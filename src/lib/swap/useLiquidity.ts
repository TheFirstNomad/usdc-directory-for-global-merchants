import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import {
  ARC_V2_ROUTER, ARC_V2_FACTORY,
  V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI,
} from "./contracts";
import type { TokenInfo } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ARC_CHAIN_ID = 5042002;

export type LiquidityState =
  | "idle" | "approving-a" | "approving-b" | "approving-lp"
  | "creating-pair" | "adding" | "removing"
  | "success" | "error";

export function useLiquidity({
  tokenA,
  tokenB,
  userAddress,
}: {
  tokenA: TokenInfo | null;
  tokenB: TokenInfo | null;
  userAddress: `0x${string}` | undefined;
}) {
  const [state, setState] = useState<LiquidityState>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMessage, setErrorMessage] = useState("");

  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();

  const addrA = tokenA?.address as `0x${string}`;
  const addrB = tokenB?.address as `0x${string}`;

  /* Pair lookup */
  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: ARC_V2_FACTORY,
    abi: V2_FACTORY_ABI,
    functionName: "getPair",
    args: addrA && addrB ? [addrA, addrB] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!addrA && !!addrB && addrA !== addrB },
  });

  const pairExists = !!pairAddress && pairAddress !== ZERO_ADDRESS;

  /* Simple addLiquidity - using regular addLiquidity for now to avoid native issues */
  const addLiquidity = useCallback(async (amountA: string, amountB: string, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress) return;

    setState("adding");
    setErrorMessage("");

    try {
      const parsedA = parseUnits(amountA || "0", tokenA.decimals);
      const parsedB = parseUnits(amountB || "0", tokenB.decimals);
      const slippageFactor = BigInt(Math.floor((1 - slippage / 100) * 10000));
      const minA = parsedA * slippageFactor / 10000n;
      const minB = parsedB * slippageFactor / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      if (parsedA === 0n || parsedB === 0n) {
        throw new Error("Amounts cannot be zero");
      }

      const hash = await writeContractAsync({
        address: ARC_V2_ROUTER as `0x${string}`,
        abi: V2_ROUTER_ABI,
        functionName: "addLiquidity",
        args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
        chainId: ARC_CHAIN_ID,
      } as any);

      setTxHash(hash);
      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Add liquidity failed");
      console.error("Add liquidity error:", err);
    }
  }, [tokenA, tokenB, userAddress, addrA, addrB, writeContractAsync, publicClient]);

  const reset = useCallback(() => {
    setState("idle");
    setTxHash(undefined);
    setErrorMessage("");
  }, []);

  return {
    state,
    txHash,
    errorMessage,
    pairExists,
    addLiquidity,
    reset,
  };
}
