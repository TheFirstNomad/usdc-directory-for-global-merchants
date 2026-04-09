import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  ARC_V2_ROUTER, ARC_V2_FACTORY,
  V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI,
} from "./contracts";
import type { TokenInfo } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ARC_CHAIN_ID = 5042002;
const ARC_NATIVE_USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;

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

  const isNativeUSDC_A = addrA?.toLowerCase() === ARC_NATIVE_USDC.toLowerCase();
  const isNativeUSDC_B = addrB?.toLowerCase() === ARC_NATIVE_USDC.toLowerCase();

  /* ── Pair lookup ── */
  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: ARC_V2_FACTORY,
    abi: V2_FACTORY_ABI,
    functionName: "getPair",
    args: addrA && addrB ? [addrA, addrB] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!addrA && !!addrB && addrA !== addrB },
  });

  const pairExists = !!pairAddress && pairAddress !== ZERO_ADDRESS;

  /* ── Reserves & LP data ── */
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "getReserves",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists },
  });

  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "token0",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists },
  });

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "totalSupply",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists },
  });

  const { data: userLpBalance, refetch: refetchLpBalance } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists && !!userAddress },
  });

  const { data: lpAllowance, refetch: refetchLpAllowance } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists && !!userAddress },
  });

  /* ── Allowances ── */
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: addrA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress && !isNativeUSDC_A },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: addrB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress && !isNativeUSDC_B },
  });

  /* ── Reserves parsing ── */
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

  const userShare = (() => {
    if (!totalSupply || !userLpBalance) return 0;
    const ts = totalSupply as bigint;
    const bal = userLpBalance as bigint;
    if (ts === 0n) return 0;
    return Number(bal * 10000n / ts) / 100;
  })();

  const waitForTx = async (hash: `0x${string}`) => {
    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") throw new Error("Transaction reverted on-chain");
    }
  };

  const refetchAll = () => {
    refetchPair();
    refetchReserves();
    refetchTotalSupply();
    refetchLpBalance();
    refetchLpAllowance();
    refetchAllowanceA();
    refetchAllowanceB();
  };

  /* Approve functions */
  const approveToken = useCallback(async (tokenAddr: `0x${string}`, amount: bigint, label: "approving-a" | "approving-b") => {
    setState(label);
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ARC_V2_ROUTER as `0x${string}`, amount],
        chainId: ARC_CHAIN_ID,
      } as any);
      await waitForTx(hash);
      refetchAll();
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
        chainId: ARC_CHAIN_ID,
      } as any);
      await waitForTx(hash);
      refetchAll();
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "LP Approval failed");
    }
  }, [writeContractAsync, publicClient, pairAddress]);

  const createPair = useCallback(async () => {
    if (pairExists) return;
    setState("creating-pair");
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: ARC_V2_FACTORY,
        abi: V2_FACTORY_ABI,
        functionName: "createPair",
        args: [addrA, addrB],
        chainId: ARC_CHAIN_ID,
      } as any);
      await waitForTx(hash);
      refetchAll();
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Pair creation failed");
    }
  }, [pairExists, addrA, addrB, writeContractAsync, publicClient]);

  /* ── Add Liquidity with Debug Logs ── */
  const addLiquidity = useCallback(async (amountA: string, amountB: string, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress) return;

    setState("adding");
    setErrorMessage("");

    try {
      console.log("=== Add Liquidity Debug ===");
      console.log("TokenA:", tokenA.symbol, addrA, "Native USDC?", isNativeUSDC_A);
      console.log("TokenB:", tokenB.symbol, addrB, "Native USDC?", isNativeUSDC_B);
      console.log("AmountA input:", amountA, "Parsed:", parsedA?.toString());
      console.log("AmountB input:", amountB, "Parsed:", parsedB?.toString());

      const parsedA = parseUnits(amountA || "0", tokenA.decimals);
      const parsedB = parseUnits(amountB || "0", tokenB.decimals);
      const slippageFactor = BigInt(Math.floor((1 - slippage / 100) * 10000));
      const minA = parsedA * slippageFactor / 10000n;
      const minB = parsedB * slippageFactor / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

      if (parsedA === 0n || parsedB === 0n) {
        throw new Error("Amounts cannot be zero");
      }

      let hash: `0x${string}`;

      if (isNativeUSDC_A || isNativeUSDC_B) {
        const nativeIsA = isNativeUSDC_A;
        const ercToken = nativeIsA ? tokenB : tokenA;
        const ercAmount = nativeIsA ? parsedB : parsedA;
        const ercMin = nativeIsA ? minB : minA;
        const nativeAmount = nativeIsA ? parsedA : parsedB;
        const nativeMin = nativeIsA ? minA : minB;

        const nativeAmount18 = parseUnits(
          formatUnits(nativeAmount, nativeIsA ? tokenA.decimals : tokenB.decimals),
          18
        );

        console.log("Using addLiquidityETH");
        console.log("ERC Token:", ercToken.address);
        console.log("ERC Amount:", ercAmount.toString());
        console.log("Native Amount (18 dec):", nativeAmount18.toString());

        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidityETH",
          args: [
            ercToken.address as `0x${string}`,
            ercAmount,
            ercMin,
            nativeMin,
            userAddress,
            deadline
          ],
          value: nativeAmount18,
          chainId: ARC_CHAIN_ID,
        } as any);
      } else {
        console.log("Using regular addLiquidity (both ERC-20)");
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidity",
          args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
        } as any);
      }

      console.log("Transaction sent:", hash);
      setTxHash(hash);
      await waitForTx(hash);
      refetchAll();
      setState("success");
    } catch (err: any) {
      setState("error");
      const msg = err?.shortMessage || err?.message || "Add liquidity failed";
      setErrorMessage(msg);
      console.error("Add liquidity FULL ERROR:", err);
      throw err;
    }
  }, [tokenA, tokenB, userAddress, addrA, addrB, isNativeUSDC_A, isNativeUSDC_B, writeContractAsync, publicClient]);

  /* Remove Liquidity */
  const removeLiquidity = useCallback(async (lpAmount: bigint, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress || !pairAddress) return;
    setState("removing");
    setErrorMessage("");
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
      const hash = await writeContractAsync({
        address: ARC_V2_ROUTER as `0x${string}`,
        abi: V2_ROUTER_ABI,
        functionName: "removeLiquidity",
        args: [addrA, addrB, lpAmount, 0n, 0n, userAddress, deadline],
        chainId: ARC_CHAIN_ID,
      } as any);

      setTxHash(hash);
      await waitForTx(hash);
      refetchAll();
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Remove liquidity failed");
      throw err;
    }
  }, [tokenA, tokenB, userAddress, addrA, addrB, pairAddress, writeContractAsync, publicClient]);

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
    createPair,
    addLiquidity,
    removeLiquidity,
    reset,
  };
}
