import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  ARC_V2_ROUTER, ARC_V2_FACTORY,
  V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI,
} from "./contracts";
import type { TokenInfo } from "./tokens";
import { ARC_WRAPPED_NATIVE } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export type LiquidityState = "idle" | "approving-a" | "approving-b" | "approving-lp" | "adding" | "removing" | "success" | "error";

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

  const publicClient = usePublicClient({ chainId: 5042002 });
  const { writeContractAsync } = useWriteContract();

  const addrA = tokenA?.address === "native" ? ARC_WRAPPED_NATIVE : (tokenA?.address as `0x${string}`);
  const addrB = tokenB?.address === "native" ? ARC_WRAPPED_NATIVE : (tokenB?.address as `0x${string}`);
  const isNativeA = tokenA?.address === "native";
  const isNativeB = tokenB?.address === "native";

  // Get pair address
  const { data: pairAddress } = useReadContract({
    address: ARC_V2_FACTORY,
    abi: V2_FACTORY_ABI,
    functionName: "getPair",
    args: addrA && addrB ? [addrA, addrB] : undefined,
    chainId: 5042002,
    query: { enabled: !!addrA && !!addrB && addrA !== addrB },
  });

  const pairExists = !!pairAddress && pairAddress !== ZERO_ADDRESS;

  // Get reserves
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "getReserves",
    chainId: 5042002,
    query: { enabled: pairExists, refetchInterval: 15_000 },
  });

  // Get token0 to know ordering
  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "token0",
    chainId: 5042002,
    query: { enabled: pairExists },
  });

  // Total supply of LP tokens
  const { data: totalSupply } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "totalSupply",
    chainId: 5042002,
    query: { enabled: pairExists },
  });

  // User LP balance
  const { data: userLpBalance, refetch: refetchLpBalance } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId: 5042002,
    query: { enabled: pairExists && !!userAddress },
  });

  // LP allowance for router
  const { data: lpAllowance } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: 5042002,
    query: { enabled: pairExists && !!userAddress },
  });

  // Token allowances for router
  const { data: allowanceA } = useReadContract({
    address: addrA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: 5042002,
    query: { enabled: !isNativeA && !!userAddress },
  });

  const { data: allowanceB } = useReadContract({
    address: addrB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: 5042002,
    query: { enabled: !isNativeB && !!userAddress },
  });

  // Parsed reserves
  const reserveA = (() => {
    if (!reserves || !token0 || !tokenA) return 0n;
    const [r0, r1] = reserves as [bigint, bigint, number];
    return (token0 as string).toLowerCase() === addrA?.toLowerCase() ? r0 : r1;
  })();

  const reserveB = (() => {
    if (!reserves || !token0 || !tokenB) return 0n;
    const [r0, r1] = reserves as [bigint, bigint, number];
    return (token0 as string).toLowerCase() === addrB?.toLowerCase() ? r0 : r1;
  })();

  // User share
  const userShare = (() => {
    if (!totalSupply || !userLpBalance) return 0;
    const ts = totalSupply as bigint;
    const bal = userLpBalance as bigint;
    if (ts === 0n) return 0;
    return Number(bal * 10000n / ts) / 100;
  })();

  const approveToken = useCallback(async (tokenAddr: `0x${string}`, amount: bigint, label: "approving-a" | "approving-b") => {
    setState(label);
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ARC_V2_ROUTER as `0x${string}`, amount],
        chainId: 5042002,
      } as any);
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Approval failed");
    }
  }, [writeContractAsync, publicClient]);

  const approveLp = useCallback(async (amount: bigint) => {
    if (!pairAddress || pairAddress === ZERO_ADDRESS) return;
    setState("approving-lp");
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: pairAddress as `0x${string}`,
        abi: V2_PAIR_ABI,
        functionName: "approve",
        args: [ARC_V2_ROUTER as `0x${string}`, amount],
        chainId: 5042002,
      } as any);
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "LP Approval failed");
    }
  }, [writeContractAsync, publicClient, pairAddress]);

  const addLiquidity = useCallback(async (amountA: string, amountB: string, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress) return;
    setState("adding");
    setErrorMessage("");
    try {
      const parsedA = parseUnits(amountA, tokenA.decimals);
      const parsedB = parseUnits(amountB, tokenB.decimals);
      const minA = parsedA * BigInt(Math.floor((1 - slippage / 100) * 10000)) / 10000n;
      const minB = parsedB * BigInt(Math.floor((1 - slippage / 100) * 10000)) / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      let hash: `0x${string}`;

      if (isNativeA || isNativeB) {
        const token = isNativeA ? addrB : addrA;
        const amountToken = isNativeA ? parsedB : parsedA;
        const amountETH = isNativeA ? parsedA : parsedB;
        const amountTokenMin = isNativeA ? minB : minA;
        const amountETHMin = isNativeA ? minA : minB;

        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidityETH",
          args: [token, amountToken, amountTokenMin, amountETHMin, userAddress, deadline],
          value: amountETH,
          chainId: 5042002,
        } as any);
      } else {
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidity",
          args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
          chainId: 5042002,
        } as any);
      }

      setTxHash(hash);
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      refetchReserves();
      refetchLpBalance();
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Add liquidity failed");
    }
  }, [tokenA, tokenB, userAddress, isNativeA, isNativeB, addrA, addrB, writeContractAsync, publicClient, refetchReserves, refetchLpBalance]);

  const removeLiquidity = useCallback(async (lpAmount: bigint, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress) return;
    setState("removing");
    setErrorMessage("");
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      let hash: `0x${string}`;

      if (isNativeA || isNativeB) {
        const token = isNativeA ? addrB : addrA;
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "removeLiquidityETH",
          args: [token, lpAmount, 0n, 0n, userAddress, deadline],
          chainId: 5042002,
        } as any);
      } else {
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "removeLiquidity",
          args: [addrA, addrB, lpAmount, 0n, 0n, userAddress, deadline],
          chainId: 5042002,
        } as any);
      }

      setTxHash(hash);
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      refetchReserves();
      refetchLpBalance();
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Remove liquidity failed");
    }
  }, [tokenA, tokenB, userAddress, isNativeA, isNativeB, addrA, addrB, writeContractAsync, publicClient, refetchReserves, refetchLpBalance]);

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
    pairAddress: pairAddress as `0x${string}` | undefined,
    reserveA,
    reserveB,
    totalSupply: (totalSupply as bigint) ?? 0n,
    userLpBalance: (userLpBalance as bigint) ?? 0n,
    userShare,
    allowanceA: (allowanceA as bigint) ?? 0n,
    allowanceB: (allowanceB as bigint) ?? 0n,
    lpAllowance: (lpAllowance as bigint) ?? 0n,
    approveToken,
    approveLp,
    addLiquidity,
    removeLiquidity,
    reset,
    isNativeA,
    isNativeB,
    addrA,
    addrB,
  };
}
