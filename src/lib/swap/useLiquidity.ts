import { useState, useCallback } from "react";
import { useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { ARC_V2_ROUTER, V2_ROUTER_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";

const ARC_CHAIN_ID = 5042002;

export type LiquidityState = "idle" | "adding" | "success" | "error";

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
  const [errorMessage, setErrorMessage] = useState("");
  const { writeContractAsync } = useWriteContract();

  const addLiquidity = useCallback(async (amountA: string, amountB: string) => {
    if (!tokenA || !tokenB || !userAddress) return;

    setState("adding");
    setErrorMessage("");

    try {
      const parsedA = parseUnits(amountA || "0", tokenA.decimals);
      const parsedB = parseUnits(amountB || "0", tokenB.decimals);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      if (parsedA === 0n || parsedB === 0n) {
        throw new Error("Amounts cannot be zero");
      }

      // Simple addLiquidity call
      const hash = await writeContractAsync({
        address: ARC_V2_ROUTER as `0x${string}`,
        abi: V2_ROUTER_ABI,
        functionName: "addLiquidity",
        args: [
          tokenA.address as `0x${string}`,
          tokenB.address as `0x${string}`,
          parsedA,
          parsedB,
          0n, // minA
          0n, // minB
          userAddress,
          deadline
        ],
        chainId: ARC_CHAIN_ID,
      } as any);

      setState("success");
      console.log("Transaction sent:", hash);
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Add liquidity failed");
      console.error(err);
    }
  }, [tokenA, tokenB, userAddress, writeContractAsync]);

  const reset = useCallback(() => {
    setState("idle");
    setErrorMessage("");
  }, []);

  return {
    state,
    errorMessage,
    addLiquidity,
    reset,
  };
}
