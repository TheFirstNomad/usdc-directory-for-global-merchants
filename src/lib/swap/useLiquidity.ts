import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ARC_V2_ROUTER, ARC_V2_FACTORY, V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";
import { PLATFORM_FEE_WALLET, PLATFORM_FEE_BPS } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ARC_CHAIN_ID = 5042002;

export type LiquidityState =
  | "idle"
  | "approving-a"
  | "approving-b"
  | "approving-lp"
  | "creating-pair"
  | "adding"
  | "removing"
  | "success"
  | "error";

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

  // On Arc, USDC is an ERC-20 (0x3600..., 6 decimals) — never "native"
  const addrA = tokenA?.address as `0x${string}`;
  const addrB = tokenB?.address as `0x${string}`;
  const isNativeA = false; // Arc tokens are always ERC-20
  const isNativeB = false;

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
    address: addrA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !isNativeA && !!userAddress },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: addrB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !isNativeB && !!userAddress },
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
    return Number((bal * 10000n) / ts) / 100;
  })();

  /* ── Helper: wait for tx ── */
  const waitForTx = async (hash: `0x${string}`) => {
    if (publicClient) {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") {
        throw new Error("Transaction reverted on-chain");
      }
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

  /* ── Approve token ── */
  const approveToken = useCallback(
    async (tokenAddr: `0x${string}`, amount: bigint, label: "approving-a" | "approving-b") => {
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
    },
    [writeContractAsync, publicClient],
  );

  /* ── Approve LP ── */
  const approveLp = useCallback(
    async (amount: bigint) => {
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
    },
    [writeContractAsync, publicClient, pairAddress],
  );

  /* ── Create pair (if needed) ── */
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

  /* ── Add liquidity ── */
  const addLiquidity = useCallback(
    async (amountA: string, amountB: string, slippage: number) => {
      if (!tokenA || !tokenB || !userAddress) return;
      setState("adding");
      setErrorMessage("");
      try {
        const parsedA = parseUnits(amountA, tokenA.decimals);
        const parsedB = parseUnits(amountB, tokenB.decimals);
        const slippageFactor = BigInt(Math.floor((1 - slippage / 100) * 10000));
        const minA = (parsedA * slippageFactor) / 10000n;
        const minB = (parsedB * slippageFactor) / 10000n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        // Safety guard: prevent zero-amount transactions
        if (parsedA === 0n || parsedB === 0n) {
          throw new Error("Token amounts cannot be zero");
        }

        let hash: `0x${string}`;

        // Arc router: addLiquidity with both ERC-20 tokens (no native wrapping)
        hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidity",
          args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
        } as any);

        setTxHash(hash);
        await waitForTx(hash);
        refetchAll();
        setState("success");
      } catch (err: any) {
        setState("error");
        setErrorMessage(err?.shortMessage || err?.message || "Add liquidity failed");
        throw err; // Re-throw so caller knows it failed
      }
    },
    [tokenA, tokenB, userAddress, isNativeA, isNativeB, addrA, addrB, writeContractAsync, publicClient],
  );

  /* ── Remove liquidity ── */
  const removeLiquidity = useCallback(
    async (lpAmount: bigint, slippage: number) => {
      if (!tokenA || !tokenB || !userAddress) return;
      setState("removing");
      setErrorMessage("");
      try {
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);
        let hash: `0x${string}`;

        hash = await writeContractAsync({
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
        throw err; // Re-throw so caller knows it failed
      }
    },
    [tokenA, tokenB, userAddress, isNativeA, isNativeB, addrA, addrB, writeContractAsync, publicClient],
  );

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
