import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { ARC_V2_ROUTER, ARC_V2_FACTORY, V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";

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

  const addrA = tokenA?.address as `0x${string}`;
  const addrB = tokenB?.address as `0x${string}`;

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

  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: addrA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: addrB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress },
  });

  /* ── Correct reserve mapping (token0/token1 order) ── */
  const reserveA = reserves && addrA ? (reserves as any)[0] : 0n;
  const reserveB = reserves && addrB ? (reserves as any)[1] : 0n;

  const userShare =
    totalSupply && userLpBalance ? Number((BigInt(userLpBalance) * 10000n) / BigInt(totalSupply)) / 100 : 0;

  /* ── FIXED: Properly detect on-chain failures ── */
  const waitForTx = async (hash: `0x${string}`) => {
    if (!publicClient) return;
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status === "reverted") {
      throw new Error("Transaction failed on-chain");
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

  /* ── Approve functions (already fixed) ── */
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
          gas: 800_000,
          maxFeePerGas: parseUnits("0.000001", 18),
        } as any);
        await waitForTx(hash);
        refetchAll();
        setState("idle");
      } catch (err: any) {
        setState("error");
        setErrorMessage(err?.shortMessage || err?.message || "Approval failed");
      }
    },
    [writeContractAsync, refetchAll],
  );

  const approveLp = useCallback(
    async (amount: bigint) => {
      if (!pairAddress) return;
      setState("approving-lp");
      setErrorMessage("");
      try {
        const hash = await writeContractAsync({
          address: pairAddress as `0x${string}`,
          abi: V2_PAIR_ABI,
          functionName: "approve",
          args: [ARC_V2_ROUTER as `0x${string}`, amount],
          chainId: ARC_CHAIN_ID,
          gas: 800_000,
          maxFeePerGas: parseUnits("0.000001", 18),
        } as any);
        await waitForTx(hash);
        refetchAll();
        setState("idle");
      } catch (err: any) {
        setState("error");
        setErrorMessage(err?.shortMessage || err?.message || "LP approval failed");
      }
    },
    [pairAddress, writeContractAsync, refetchAll],
  );

  /* ── Create Pair ── */
  const createPair = useCallback(async () => {
    if (!addrA || !addrB) return;
    setState("creating-pair");
    setErrorMessage("");
    try {
      const hash = await writeContractAsync({
        address: ARC_V2_FACTORY,
        abi: V2_FACTORY_ABI,
        functionName: "createPair",
        args: [addrA, addrB],
        chainId: ARC_CHAIN_ID,
        gas: 2_500_000,
        maxFeePerGas: parseUnits("0.000001", 18),
      } as any);
      await waitForTx(hash);
      refetchAll();
      setState("idle");
      return hash;
    } catch (err: any) {
      setState("error");
      setErrorMessage(err?.shortMessage || err?.message || "Create pair failed");
      throw err;
    }
  }, [addrA, addrB, writeContractAsync, refetchAll]);

  /* ── FIXED ADD LIQUIDITY: Auto-creates pair if missing + proper failure detection ── */
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

        // AUTO CREATE PAIR if it doesn't exist yet
        if (!pairExists) {
          await createPair();
          // small delay for indexing
          await new Promise((r) => setTimeout(r, 2000));
          await refetchAll();
        }

        const hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "addLiquidity",
          args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
          gas: 2_000_000,
          maxFeePerGas: parseUnits("0.000001", 18),
        } as any);

        setTxHash(hash);
        await waitForTx(hash); // ← NOW correctly detects on-chain revert
        await refetchAll();
        setState("success");
      } catch (err: any) {
        setState("error");
        setErrorMessage(err?.shortMessage || err?.message || "Add liquidity failed");
        throw err;
      }
    },
    [tokenA, tokenB, userAddress, addrA, addrB, pairExists, createPair, writeContractAsync, refetchAll],
  );

  /* ── Remove Liquidity (also fixed) ── */
  const removeLiquidity = useCallback(
    async (liquidityAmount: bigint, slippage: number) => {
      if (!userAddress || !pairAddress) return;
      setState("removing");
      setErrorMessage("");
      try {
        const slippageFactor = BigInt(Math.floor((1 - slippage / 100) * 10000));
        const minA = (reserveA * liquidityAmount * slippageFactor) / (totalSupply || 1n) / 10000n;
        const minB = (reserveB * liquidityAmount * slippageFactor) / (totalSupply || 1n) / 10000n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

        const hash = await writeContractAsync({
          address: ARC_V2_ROUTER as `0x${string}`,
          abi: V2_ROUTER_ABI,
          functionName: "removeLiquidity",
          args: [addrA, addrB, liquidityAmount, minA, minB, userAddress, deadline],
          chainId: ARC_CHAIN_ID,
          gas: 1_800_000,
          maxFeePerGas: parseUnits("0.000001", 18),
        } as any);

        setTxHash(hash);
        await waitForTx(hash);
        await refetchAll();
        setState("success");
      } catch (err: any) {
        setState("error");
        setErrorMessage(err?.shortMessage || err?.message || "Remove liquidity failed");
        throw err;
      }
    },
    [userAddress, pairAddress, addrA, addrB, reserveA, reserveB, totalSupply, writeContractAsync, refetchAll],
  );

  const reset = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setTxHash(undefined);
  }, []);

  return {
    state,
    txHash,
    errorMessage,
    pairExists,
    reserveA,
    reserveB,
    totalSupply: totalSupply || 0n,
    userLpBalance: userLpBalance || 0n,
    userShare,
    allowanceA: allowanceA || 0n,
    allowanceB: allowanceB || 0n,
    lpAllowance: lpAllowance || 0n,
    approveToken,
    approveLp,
    createPair,
    addLiquidity,
    removeLiquidity,
    reset,
    isNativeA: false,
    isNativeB: false,
    addrA,
    addrB,
  };
}
