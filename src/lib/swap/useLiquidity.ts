import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import {
  ARC_V2_ROUTER, ARC_V2_FACTORY,
  V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI,
} from "./contracts";
import type { TokenInfo } from "./tokens";
import { ARC_WRAPPED_NATIVE } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ARC_CHAIN_ID = 5042002;
const ARC_NATIVE_USDC = ARC_WRAPPED_NATIVE;
const ARC_NATIVE_DECIMALS = 18;
const DEFAULT_DEADLINE_SECONDS = 1800;
const BPS_SCALE = 10000n;

const isArcNativeUsdc = (address?: `0x${string}` | "native") =>
  !!address && address !== "native" && address.toLowerCase() === ARC_NATIVE_USDC.toLowerCase();

const getSlippageFactor = (slippage: number) => {
  if (!Number.isFinite(slippage) || slippage < 0 || slippage >= 100) {
    throw new Error("Slippage must stay between 0% and 99.99%.");
  }

  return BigInt(Math.floor((1 - slippage / 100) * Number(BPS_SCALE)));
};

const getDeadline = () => BigInt(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS);

const getReadableLiquidityError = (error: any) => {
  const combinedMessage = [
    error?.shortMessage,
    error?.message,
    error?.details,
    error?.cause?.shortMessage,
    error?.cause?.message,
  ]
    .filter(Boolean)
    .join(" | ");

  const normalized = combinedMessage.toLowerCase();

  if (normalized.includes("user rejected") || normalized.includes("rejected the request") || normalized.includes("user denied")) {
    return "Transaction cancelled in wallet.";
  }

  if (normalized.includes("insufficient funds")) {
    return "Insufficient native USDC balance for liquidity plus network fees.";
  }

  if (normalized.includes("too many") && normalized.includes("decimal")) {
    return "One of the token amounts has too many decimal places.";
  }

  if (
    normalized.includes("network fee unavailable") ||
    normalized.includes("estimate gas") ||
    normalized.includes("gas estimation") ||
    normalized.includes("unpredictable gas")
  ) {
    return "Gas estimation failed. Recheck the native USDC amount, pool ratio, and slippage, then try again.";
  }

  if (normalized.includes("deadline")) {
    return "Transaction deadline expired. Please submit again.";
  }

  if (normalized.includes("reverted") || normalized.includes("execution reverted")) {
    return "Transaction reverted. Check token amounts, approvals, and pool pricing before retrying.";
  }

  if (normalized.includes("zero")) {
    return "Token amounts must be greater than zero.";
  }

  return error?.shortMessage || error?.message || "Liquidity transaction failed.";
};

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

  const addrA = tokenA?.address === "native" ? undefined : (tokenA?.address as `0x${string}` | undefined);
  const addrB = tokenB?.address === "native" ? undefined : (tokenB?.address as `0x${string}` | undefined);
  const isNativeA = isArcNativeUsdc(tokenA?.address);
  const isNativeB = isArcNativeUsdc(tokenB?.address);

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

  /* ── Reserves ── */
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "getReserves",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists, refetchInterval: 15_000 },
  });

  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "token0",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists },
  });

  /* ── LP token data ── */
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

  /* ── Token allowances ── */
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: !isNativeA ? addrA : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !isNativeA && !!userAddress && !!addrA },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: !isNativeB ? addrB : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !isNativeB && !!userAddress && !!addrB },
  });

  /* ── Parsed reserves (ordered to match tokenA/tokenB) ── */
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

  /* ── User share ── */
  const userShare = (() => {
    if (!totalSupply || !userLpBalance) return 0;
    const ts = totalSupply as bigint;
    const bal = userLpBalance as bigint;
    if (ts === 0n) return 0;
    return Number(bal * 10000n / ts) / 100;
  })();

  const waitForTx = useCallback(async (hash: `0x${string}`) => {
    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted on-chain");
      }
    }
  }, [publicClient]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchPair(),
      refetchReserves(),
      refetchTotalSupply(),
      refetchLpBalance(),
      refetchLpAllowance(),
      refetchAllowanceA(),
      refetchAllowanceB(),
    ]);
  }, [
    refetchPair,
    refetchReserves,
    refetchTotalSupply,
    refetchLpBalance,
    refetchLpAllowance,
    refetchAllowanceA,
    refetchAllowanceB,
  ]);

  /* ── Approve token ── */
  const approveToken = useCallback(async (
    tokenAddr: `0x${string}`,
    amount: bigint,
    label: "approving-a" | "approving-b",
  ) => {
    if (!tokenAddr || amount <= 0n) return;
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
      await refetchAll();
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(getReadableLiquidityError(err));
    }
  }, [refetchAll, waitForTx, writeContractAsync]);

  /* ── Approve LP ── */
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
      await refetchAll();
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(getReadableLiquidityError(err));
    }
  }, [pairAddress, refetchAll, waitForTx, writeContractAsync]);

  /* ── Create pair (if needed) ── */
  const createPair = useCallback(async () => {
    if (pairExists || !addrA || !addrB || addrA === addrB) return;
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
      await refetchAll();
      setState("idle");
    } catch (err: any) {
      setState("error");
      setErrorMessage(getReadableLiquidityError(err));
    }
  }, [addrA, addrB, pairExists, refetchAll, waitForTx, writeContractAsync]);

  /* ── Add liquidity ── */
  const addLiquidity = useCallback(async (amountA: string, amountB: string, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress || !addrA || !addrB) return;
    setState("adding");
    setErrorMessage("");
    try {
      // Arc native USDC uses 18 decimals when passed as msg.value via addLiquidityETH.
      const parsedA = parseUnits(amountA, isNativeA ? ARC_NATIVE_DECIMALS : tokenA.decimals);
      const parsedB = parseUnits(amountB, isNativeB ? ARC_NATIVE_DECIMALS : tokenB.decimals);

      if (parsedA === 0n || parsedB === 0n) {
        throw new Error("Token amounts cannot be zero");
      }

      if (isNativeA && isNativeB) {
        throw new Error("Only one native Arc token can be used in a liquidity pair");
      }

      const slippageFactor = getSlippageFactor(slippage);
      const minA = (parsedA * slippageFactor) / BPS_SCALE;
      const minB = (parsedB * slippageFactor) / BPS_SCALE;
      const deadline = getDeadline();

      let hash: `0x${string}`;

      if (isNativeA || isNativeB) {
        const tokenAddress = isNativeA ? addrB : addrA;
        const tokenDesired = isNativeA ? parsedB : parsedA;
        const tokenMin = isNativeA ? minB : minA;
        const nativeMin = isNativeA ? minA : minB;
        const nativeAmount = isNativeA ? parsedA : parsedB;

        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidityETH",
          args: [tokenAddress, tokenDesired, tokenMin, nativeMin, userAddress, deadline],
          value: nativeAmount,
          chainId: ARC_CHAIN_ID,
        } as any);
      } else {
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidity",
          args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
        } as any);
      }

      setTxHash(hash);
      await waitForTx(hash);
      await refetchAll();
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(getReadableLiquidityError(err));
      throw err; // Re-throw so caller knows it failed
    }
  }, [addrA, addrB, isNativeA, isNativeB, refetchAll, tokenA, tokenB, userAddress, waitForTx, writeContractAsync]);

  /* ── Remove liquidity ── */
  const removeLiquidity = useCallback(async (lpAmount: bigint, slippage: number) => {
    if (!tokenA || !tokenB || !userAddress || !addrA || !addrB) return;
    setState("removing");
    setErrorMessage("");
    try {
      if (lpAmount <= 0n) {
        throw new Error("LP amount cannot be zero");
      }

      const slippageFactor = getSlippageFactor(slippage);
      const deadline = getDeadline();
      const poolSupply = (totalSupply as bigint) ?? 0n;
      const expectedA = poolSupply > 0n ? (reserveA * lpAmount) / poolSupply : 0n;
      const expectedB = poolSupply > 0n ? (reserveB * lpAmount) / poolSupply : 0n;
      const minA = (expectedA * slippageFactor) / BPS_SCALE;
      const minB = (expectedB * slippageFactor) / BPS_SCALE;

      let hash: `0x${string}`;

      if (isNativeA || isNativeB) {
        const tokenAddress = isNativeA ? addrB : addrA;
        const tokenMin = isNativeA ? minB : minA;
        const nativeMin = isNativeA ? minA : minB;

        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "removeLiquidityETH",
          args: [tokenAddress, lpAmount, tokenMin, nativeMin, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
        } as any);
      } else {
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "removeLiquidity",
          args: [addrA, addrB, lpAmount, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
        } as any);
      }

      setTxHash(hash);
      await waitForTx(hash);
      await refetchAll();
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMessage(getReadableLiquidityError(err));
      throw err; // Re-throw so caller knows it failed
    }
  }, [addrA, addrB, isNativeA, isNativeB, refetchAll, reserveA, reserveB, tokenA, tokenB, totalSupply, userAddress, waitForTx, writeContractAsync]);

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
    isNativeA,
    isNativeB,
    addrA,
    addrB,
  };
}
