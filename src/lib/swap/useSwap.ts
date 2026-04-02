import { useState, useCallback } from "react";
import { useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import { UNISWAP_V3_ROUTER, SWAP_ROUTER_ABI, ERC20_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";
import { WETH_ADDRESS, getPoolFee } from "./tokens";

export type SwapState = "idle" | "approving" | "swapping" | "success" | "error";

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

  const isNativeIn = tokenIn?.address === "native";
  const isNativeOut = tokenOut?.address === "native";
  const actualTokenIn = isNativeIn ? WETH_ADDRESS : (tokenIn?.address as `0x${string}`);

  const amountInParsed = (() => {
    try {
      if (!tokenIn || !amountIn) return 0n;
      return parseUnits(amountIn, tokenIn.decimals);
    } catch {
      return 0n;
    }
  })();

  // Check ERC20 allowance
  const { data: allowance } = useReadContract({
    address: actualTokenIn,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, UNISWAP_V3_ROUTER as `0x${string}`] : undefined,
    query: { enabled: !isNativeIn && !!userAddress && chainId === 8453 },
  });

  const needsApproval =
    !isNativeIn && amountInParsed > 0n && ((allowance as bigint) ?? 0n) < amountInParsed;

  const approve = useCallback(async () => {
    if (!tokenIn || isNativeIn || !userAddress) return;
    setSwapState("approving");
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: actualTokenIn,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [UNISWAP_V3_ROUTER as `0x${string}`, amountInParsed],
        chainId: 8453,
      } as any);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setSwapState("idle");
    } catch (err: any) {
      setSwapState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Approval failed");
    }
  }, [tokenIn, isNativeIn, userAddress, actualTokenIn, amountInParsed, writeContractAsync, publicClient]);

  const swap = useCallback(async () => {
    if (!tokenIn || !tokenOut || !userAddress || amountInParsed <= 0n || !amountOutMin) return;
    setSwapState("swapping");
    setErrorMessage("");

    try {
      const poolFee = getPoolFee(tokenIn.symbol, tokenOut.symbol);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
      const actualOut = isNativeOut ? WETH_ADDRESS : (tokenOut.address as `0x${string}`);

      const swapCalldata = encodeFunctionData({
        abi: SWAP_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: isNativeIn ? WETH_ADDRESS : (tokenIn.address as `0x${string}`),
            tokenOut: actualOut,
            fee: poolFee,
            recipient: isNativeOut ? (UNISWAP_V3_ROUTER as `0x${string}`) : userAddress,
            amountIn: amountInParsed,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0n,
          },
        ],
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
        chainId: 8453,
      } as any);

      setTxHash(hash);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setSwapState("success");
    } catch (err: any) {
      setSwapState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Swap failed");
    }
  }, [tokenIn, tokenOut, userAddress, amountInParsed, amountOutMin, isNativeIn, isNativeOut, writeContractAsync, publicClient]);

  const reset = useCallback(() => {
    setSwapState("idle");
    setTxHash(undefined);
    setErrorMessage("");
  }, []);

  return { swapState, txHash, errorMessage, needsApproval, approve, swap, reset };
}
