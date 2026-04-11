import { useState, useCallback } from "react";
import { useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import {
  UNISWAP_V3_ROUTER, SWAP_ROUTER_ABI, ERC20_ABI,
} from "./contracts";
import type { TokenInfo } from "./tokens";
import { WETH_ADDRESS, getPoolFee } from "./tokens";
import { encodeFunctionData } from "viem";
import { createViemAdapterFromWallet, swapViaKit, type PaymentChainId } from "@/lib/arcAppKit";

export type SwapState = "idle" | "approving" | "swapping" | "success" | "error";

const normalizeErrorMessage = (message: string) =>
  message
    .replace(/^execution reverted:?\s*/i, "")
    .replace(/^The contract function "[^"]+" reverted with the following reason:\s*/i, "")
    .trim();

const getReadableSwapError = (error: any) => {
  const combinedMessage = [
    error?.cause?.reason,
    error?.shortMessage,
    error?.message,
    error?.details,
    error?.cause?.shortMessage,
    error?.cause?.message,
    error?.cause?.details,
  ]
    .filter(Boolean)
    .join(" | ");

  const normalizedMessage = normalizeErrorMessage(combinedMessage);
  const normalized = normalizedMessage.toLowerCase();

  if (normalized.includes("user rejected") || normalized.includes("rejected the request") || normalized.includes("user denied")) {
    return "Transaction cancelled in wallet.";
  }
  if (normalized.includes("insufficient funds")) {
    return "Insufficient balance for the swap and network fees.";
  }
  if (
    normalized.includes("network fee unavailable") ||
    normalized.includes("estimate gas") ||
    normalized.includes("gas estimation") ||
    normalized.includes("unpredictable gas")
  ) {
    return "Swap could not be simulated. Recheck the amount, route, and slippage, then try again.";
  }
  if (normalized.includes("createswap failed") || normalized.includes("failed to fetch")) {
    return "Swap request failed. Ensure your wallet is connected to the correct network and try again.";
  }
  if (normalized.includes("reverted") || normalized.includes("execution reverted")) {
    return normalizedMessage || "Swap reverted on-chain. Try a smaller amount or refresh the quote.";
  }
  return normalizedMessage || error?.shortMessage || error?.message || "Swap failed";
};

export function useSwap({
  tokenIn,
  tokenOut,
  amountIn,
  amountOutMin,
  chainId,
  userAddress,
}: {
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  amountOutMin: bigint | null;
  chainId: number;
  userAddress: `0x${string}` | undefined;
  slippage: number;
}) {
  const [swapState, setSwapState] = useState<SwapState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMessage, setErrorMessage] = useState("");

  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();

  const isBase = chainId === 8453;
  const isArc = chainId === 5042002;
  const isNativeIn = tokenIn?.address === "native";
  const isNativeOut = tokenOut?.address === "native";

  const routerAddress = UNISWAP_V3_ROUTER;

  const actualTokenIn = isNativeIn
    ? WETH_ADDRESS
    : (tokenIn?.address as `0x${string}`);

  const amountInParsed = (() => {
    try {
      if (!tokenIn || !amountIn) return 0n;
      return parseUnits(amountIn, tokenIn.decimals);
    } catch {
      return 0n;
    }
  })();

  // Check ERC20 allowance (only for Base V3 router — Arc uses App Kit)
  const { data: allowance } = useReadContract({
    address: actualTokenIn,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, routerAddress as `0x${string}`] : undefined,
    query: { enabled: !isNativeIn && !!userAddress && isBase },
    chainId,
  });

  // Arc uses App Kit swap (no approval needed from our side)
  const needsApproval =
    isBase && !isNativeIn && amountInParsed > 0n && ((allowance as bigint) ?? 0n) < amountInParsed;

  const approve = useCallback(async () => {
    if (!tokenIn || isNativeIn || !userAddress) return;
    setSwapState("approving");
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: actualTokenIn,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [routerAddress as `0x${string}`, amountInParsed],
        account: userAddress,
        chainId,
      } as any);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setSwapState("idle");
    } catch (err: any) {
      setSwapState("error");
      setErrorMessage(getReadableSwapError(err));
    }
  }, [tokenIn, isNativeIn, userAddress, actualTokenIn, amountInParsed, writeContractAsync, publicClient, routerAddress, chainId]);

  const swap = useCallback(async () => {
    if (!tokenIn || !tokenOut || !userAddress || amountInParsed <= 0n) return;
    setSwapState("swapping");
    setErrorMessage("");

    try {
      if (isArc) {
        // ── Arc Testnet: Use Circle App Kit swap ──
        const adapter = await createViemAdapterFromWallet(userAddress);
        const result = await swapViaKit(
          adapter,
          chainId as PaymentChainId,
          tokenIn.symbol,
          tokenOut.symbol,
          amountIn
        );
        setTxHash(result.txHash as `0x${string}`);
        setSwapState("success");
      } else {
        // ── Uniswap V3 swap on Base ──
        if (!amountOutMin) return;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
        const poolFee = getPoolFee(tokenIn.symbol, tokenOut.symbol);
        const actualOut = isNativeOut ? WETH_ADDRESS : (tokenOut.address as `0x${string}`);

        const swapCalldata = encodeFunctionData({
          abi: SWAP_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [{
            tokenIn: isNativeIn ? WETH_ADDRESS : (tokenIn.address as `0x${string}`),
            tokenOut: actualOut,
            fee: poolFee,
            recipient: isNativeOut ? (UNISWAP_V3_ROUTER as `0x${string}`) : userAddress,
            amountIn: amountInParsed,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0n,
          }],
        });

        const calls: `0x${string}`[] = [swapCalldata];

        if (isNativeIn) {
          calls.push(
            encodeFunctionData({ abi: SWAP_ROUTER_ABI, functionName: "refundETH", args: [] })
          );
        }
        if (isNativeOut) {
          calls.push(
            encodeFunctionData({
              abi: SWAP_ROUTER_ABI,
              functionName: "unwrapWETH9",
              args: [amountOutMin, userAddress],
            })
          );
        }

        const hash = await writeContractAsync({
          address: UNISWAP_V3_ROUTER as `0x${string}`,
          abi: SWAP_ROUTER_ABI,
          functionName: "multicall",
          args: [deadline, calls],
          value: isNativeIn ? amountInParsed : undefined,
          account: userAddress,
          chainId: 8453,
        } as any);

        setTxHash(hash);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        setSwapState("success");
      }
    } catch (err: any) {
      setSwapState("error");
      setErrorMessage(getReadableSwapError(err));
      throw err;
    }
  }, [tokenIn, tokenOut, userAddress, amountInParsed, amountOutMin, amountIn, isNativeIn, isNativeOut, isArc, chainId, writeContractAsync, publicClient]);

  const reset = useCallback(() => {
    setSwapState("idle");
    setTxHash(undefined);
    setErrorMessage("");
  }, []);

  return { swapState, txHash, errorMessage, needsApproval, approve, swap, reset };
}
