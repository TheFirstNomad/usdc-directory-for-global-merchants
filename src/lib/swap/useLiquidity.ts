import { useState, useCallback } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { ARC_V2_ROUTER, ARC_V2_FACTORY, V2_ROUTER_ABI, V2_FACTORY_ABI, V2_PAIR_ABI, ERC20_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ARC_NATIVE_USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;
const ARC_CHAIN_ID = 5042002;
const ARC_SAFE_GAS = 2_500_000;
const ARC_MAX_FEE_PER_GAS = parseUnits("200", 9);
const PAIR_SYNC_ATTEMPTS = 8;
const PAIR_SYNC_DELAY_MS = 2000;
const DEFAULT_DEADLINE_SECONDS = 1800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeErrorMessage = (message: string) =>
  message
    .replace(/^execution reverted:?\s*/i, "")
    .replace(/^The contract function "[^"]+" reverted with the following reason:\s*/i, "")
    .trim();

const getReadableLiquidityError = (err: unknown) => {
  const error = err as any;
  const rawMessage = [
    error?.cause?.reason,
    error?.cause?.shortMessage,
    error?.cause?.details,
    error?.shortMessage,
    error?.details,
    error?.message,
  ]
    .find(Boolean);

  const message = normalizeErrorMessage(String(rawMessage ?? ""));
  const normalized = message.toLowerCase();

  if (normalized.includes("user rejected") || normalized.includes("user denied") || normalized.includes("rejected the request")) {
    return "Transaction cancelled in wallet.";
  }

  if (normalized.includes("network fee unavailable")) {
    return "Network fee unavailable. Arc could not estimate gas for this transaction; recheck approvals, pair state, and native USDC amount.";
  }

  return message || "Transaction failed";
};

const getSlippageFactor = (slippage: number) => {
  const boundedSlippage = Number.isFinite(slippage) ? Math.min(Math.max(slippage, 0), 100) : 0;
  return BigInt(Math.max(0, 10000 - Math.floor(boundedSlippage * 100)));
};

const getDeadline = () => BigInt(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_SECONDS);

const isArcNativeToken = (token: TokenInfo | null) => token?.address === ARC_NATIVE_USDC;

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

  const isNativeA = isArcNativeToken(tokenA);
  const isNativeB = isArcNativeToken(tokenB);
  const addrA = tokenA?.address as `0x${string}` | undefined;
  const addrB = tokenB?.address as `0x${string}` | undefined;
  const amountDecimalsA = isNativeA ? 18 : tokenA?.decimals ?? 18;
  const amountDecimalsB = isNativeB ? 18 : tokenB?.decimals ?? 18;

  const { data: pairAddress, refetch: refetchPair } = useReadContract({
    address: ARC_V2_FACTORY,
    abi: V2_FACTORY_ABI,
    functionName: "getPair",
    args: addrA && addrB ? [addrA, addrB] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!addrA && !!addrB && addrA !== addrB },
  });

  const pairExists = !!pairAddress && pairAddress !== ZERO_ADDRESS;

  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "getReserves",
    chainId: ARC_CHAIN_ID,
    query: { enabled: pairExists },
  });

  const { data: pairToken0, refetch: refetchPairToken0 } = useReadContract({
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

  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: isNativeA ? undefined : addrA,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress && !!addrA && !isNativeA },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: isNativeB ? undefined : addrB,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, ARC_V2_ROUTER as `0x${string}`] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!userAddress && !!addrB && !isNativeB },
  });

  const pairToken0Address = pairToken0 as `0x${string}` | undefined;
  const reserve0 = reserves ? (reserves as unknown as readonly [bigint, bigint, bigint])[0] : 0n;
  const reserve1 = reserves ? (reserves as unknown as readonly [bigint, bigint, bigint])[1] : 0n;
  const inferredToken0 = addrA && addrB
    ? (addrA.toLowerCase() < addrB.toLowerCase() ? addrA : addrB)
    : undefined;
  const token0Address = pairToken0Address ?? inferredToken0;
  const reserveA = token0Address && addrA && token0Address.toLowerCase() === addrA.toLowerCase() ? reserve0 : reserve1;
  const reserveB = token0Address && addrA && token0Address.toLowerCase() === addrA.toLowerCase() ? reserve1 : reserve0;

  const userShare =
    totalSupply && userLpBalance ? Number((BigInt(userLpBalance) * 10000n) / BigInt(totalSupply)) / 100 : 0;

  const waitForTx = useCallback(async (hash: `0x${string}`) => {
    if (!publicClient) {
      throw new Error("Arc Testnet client unavailable. Please reconnect your wallet and try again.");
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted on-chain after wallet confirmation.");
    }

    return receipt;
  }, [publicClient]);

  const refetchAll = useCallback(async () => {
    await Promise.allSettled([
      refetchPair(),
      refetchPairToken0(),
      refetchReserves(),
      refetchTotalSupply(),
      refetchLpBalance(),
      refetchLpAllowance(),
      refetchAllowanceA(),
      refetchAllowanceB(),
    ]);
  }, [
    refetchAllowanceA,
    refetchAllowanceB,
    refetchLpAllowance,
    refetchLpBalance,
    refetchPair,
    refetchPairToken0,
    refetchReserves,
    refetchTotalSupply,
  ]);

  const waitForPairSync = useCallback(
    async (token0: `0x${string}`, token1: `0x${string}`) => {
      if (!publicClient) return undefined;

      for (let attempt = 0; attempt < PAIR_SYNC_ATTEMPTS; attempt += 1) {
        try {
          const latestPair = (await publicClient.readContract({
            address: ARC_V2_FACTORY,
            abi: V2_FACTORY_ABI,
            functionName: "getPair",
            args: [token0, token1],
          } as any)) as `0x${string}`;

          if (latestPair && latestPair !== ZERO_ADDRESS) {
            await refetchPair();
            return latestPair;
          }
        } catch {
          // Ignore transient Arc RPC read issues and keep polling.
        }

        if (attempt < PAIR_SYNC_ATTEMPTS - 1) {
          await sleep(PAIR_SYNC_DELAY_MS);
        }
      }

      await refetchPair();
      return undefined;
    },
    [publicClient, refetchPair],
  );

  const approveToken = useCallback(
    async (tokenAddr: `0x${string}`, amount: bigint, label: "approving-a" | "approving-b") => {
      if (!userAddress || amount <= 0n || tokenAddr === ARC_NATIVE_USDC) return;

      setState(label);
      setErrorMessage("");
      setTxHash(undefined);

      try {
        const hash = await writeContractAsync({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ARC_V2_ROUTER as `0x${string}`, amount],
          account: userAddress,
          chainId: ARC_CHAIN_ID,
          gas: ARC_SAFE_GAS,
          maxFeePerGas: ARC_MAX_FEE_PER_GAS,
        } as any);

        await waitForTx(hash);
        await refetchAll();
        setState("idle");
      } catch (err: any) {
        setState("error");
        setErrorMessage(getReadableLiquidityError(err));
      }
    },
    [userAddress, writeContractAsync, waitForTx, refetchAll],
  );

  const approveLp = useCallback(
    async (amount: bigint) => {
      if (!pairAddress || !userAddress || amount <= 0n) return;

      setState("approving-lp");
      setErrorMessage("");
      setTxHash(undefined);

      try {
        const hash = await writeContractAsync({
          address: pairAddress as `0x${string}`,
          abi: V2_PAIR_ABI,
          functionName: "approve",
          args: [ARC_V2_ROUTER as `0x${string}`, amount],
          account: userAddress,
          chainId: ARC_CHAIN_ID,
          gas: ARC_SAFE_GAS,
          maxFeePerGas: ARC_MAX_FEE_PER_GAS,
        } as any);

        await waitForTx(hash);
        await refetchAll();
        setState("idle");
      } catch (err: any) {
        setState("error");
        setErrorMessage(getReadableLiquidityError(err));
      }
    },
    [pairAddress, userAddress, writeContractAsync, waitForTx, refetchAll],
  );

  const createPairInternal = useCallback(
    async ({ allowExistingPair = false, preserveState = false }: { allowExistingPair?: boolean; preserveState?: boolean } = {}) => {
      if (!addrA || !addrB || !userAddress) return;

      if (addrA.toLowerCase() === addrB.toLowerCase()) {
        throw new Error("Select two different tokens before creating a pair.");
      }

      if (!preserveState) {
        setState("creating-pair");
        setTxHash(undefined);
      }

      setErrorMessage("");

      try {
        const hash = await writeContractAsync({
          address: ARC_V2_FACTORY,
          abi: V2_FACTORY_ABI,
          functionName: "createPair",
          args: [addrA, addrB],
          account: userAddress,
          chainId: ARC_CHAIN_ID,
          gas: ARC_SAFE_GAS,
          maxFeePerGas: ARC_MAX_FEE_PER_GAS,
        } as any);

        await waitForTx(hash);
        await waitForPairSync(addrA, addrB);
        await refetchAll();

        if (!preserveState) {
          setState("idle");
        }

        return hash;
      } catch (err) {
        const message = getReadableLiquidityError(err);

        if (allowExistingPair && /PAIR_EXISTS/i.test(message)) {
          await waitForPairSync(addrA, addrB);
          await refetchAll();
          return undefined;
        }

        setState("error");
        setErrorMessage(message);
        throw err;
      }
    },
    [addrA, addrB, userAddress, writeContractAsync, waitForTx, waitForPairSync, refetchAll],
  );

  const createPair = useCallback(async () => createPairInternal(), [createPairInternal]);

  const addLiquidity = useCallback(
    async (amountA: string, amountB: string, slippage: number) => {
      if (!tokenA || !tokenB || !userAddress || !addrA || !addrB) return;

      setState("adding");
      setErrorMessage("");
      setTxHash(undefined);

      try {
        const normalizedAmountA = amountA.trim();
        const normalizedAmountB = amountB.trim();

        if (!normalizedAmountA || !normalizedAmountB) {
          throw new Error("Enter both token amounts before adding liquidity.");
        }

        if (addrA.toLowerCase() === addrB.toLowerCase()) {
          throw new Error("Select two different tokens before adding liquidity.");
        }

        const parsedA = parseUnits(normalizedAmountA, amountDecimalsA);
        const parsedB = parseUnits(normalizedAmountB, amountDecimalsB);

        if (parsedA <= 0n || parsedB <= 0n) {
          throw new Error("Liquidity amounts must be greater than zero.");
        }

        const slippageFactor = getSlippageFactor(slippage);
        const minA = (parsedA * slippageFactor) / 10000n;
        const minB = (parsedB * slippageFactor) / 10000n;
        const deadline = getDeadline();

        if (!pairExists) {
          await createPairInternal({ allowExistingPair: true, preserveState: true });
          await waitForPairSync(addrA, addrB);
          await refetchAll();
          setState("adding");
        }

        const nativeSides = Number(isNativeA) + Number(isNativeB);
        let hash: `0x${string}`;

        if (nativeSides > 1) {
          throw new Error("Only one native USDC side is supported on Arc Testnet.");
        }

        if (isNativeA || isNativeB) {
          const tokenAddress = (isNativeA ? addrB : addrA) as `0x${string}`;
          const tokenDesired = isNativeA ? parsedB : parsedA;
          const tokenMin = isNativeA ? minB : minA;
          const nativeDesired = isNativeA ? parsedA : parsedB;
          const nativeMin = isNativeA ? minA : minB;

          hash = await writeContractAsync({
            address: ARC_V2_ROUTER as `0x${string}`,
            abi: V2_ROUTER_ABI,
            functionName: "addLiquidityETH",
            args: [tokenAddress, tokenDesired, tokenMin, nativeMin, userAddress, deadline],
            value: nativeDesired,
            account: userAddress,
            chainId: ARC_CHAIN_ID,
            gas: ARC_SAFE_GAS,
            maxFeePerGas: ARC_MAX_FEE_PER_GAS,
          } as any);
        } else {
          hash = await writeContractAsync({
            address: ARC_V2_ROUTER as `0x${string}`,
            abi: V2_ROUTER_ABI,
            functionName: "addLiquidity",
            args: [addrA, addrB, parsedA, parsedB, minA, minB, userAddress, deadline],
            account: userAddress,
            chainId: ARC_CHAIN_ID,
            gas: ARC_SAFE_GAS,
            maxFeePerGas: ARC_MAX_FEE_PER_GAS,
          } as any);
        }

        setTxHash(hash);
        await waitForTx(hash);
        await refetchAll();
        setState("success");
      } catch (err) {
        setState("error");
        setErrorMessage(getReadableLiquidityError(err));
        throw err;
      }
    },
    [
      tokenA,
      tokenB,
      userAddress,
      addrA,
      addrB,
      amountDecimalsA,
      amountDecimalsB,
      pairExists,
      isNativeA,
      isNativeB,
      createPairInternal,
      waitForPairSync,
      writeContractAsync,
      waitForTx,
      refetchAll,
    ],
  );

  const removeLiquidity = useCallback(
    async (liquidityAmount: bigint, slippage: number) => {
      if (!userAddress || !pairAddress || !addrA || !addrB) return;

      setState("removing");
      setErrorMessage("");
      setTxHash(undefined);

      try {
        if (liquidityAmount <= 0n) {
          throw new Error("Enter an LP amount greater than zero.");
        }

        if (!totalSupply || totalSupply <= 0n) {
          throw new Error("Pool total supply unavailable. Refresh and try again.");
        }

        const slippageFactor = getSlippageFactor(slippage);
        const minA = (reserveA * liquidityAmount * slippageFactor) / totalSupply / 10000n;
        const minB = (reserveB * liquidityAmount * slippageFactor) / totalSupply / 10000n;
        const deadline = getDeadline();

        let hash: `0x${string}`;

        if (isNativeA || isNativeB) {
          const tokenAddress = (isNativeA ? addrB : addrA) as `0x${string}`;
          const tokenMin = isNativeA ? minB : minA;
          const nativeMin = isNativeA ? minA : minB;

          hash = await writeContractAsync({
            address: ARC_V2_ROUTER as `0x${string}`,
            abi: V2_ROUTER_ABI,
            functionName: "removeLiquidityETH",
            args: [tokenAddress, liquidityAmount, tokenMin, nativeMin, userAddress, deadline],
            account: userAddress,
            chainId: ARC_CHAIN_ID,
            gas: ARC_SAFE_GAS,
            maxFeePerGas: ARC_MAX_FEE_PER_GAS,
          } as any);
        } else {
          hash = await writeContractAsync({
            address: ARC_V2_ROUTER as `0x${string}`,
            abi: V2_ROUTER_ABI,
            functionName: "removeLiquidity",
            args: [addrA, addrB, liquidityAmount, minA, minB, userAddress, deadline],
            account: userAddress,
            chainId: ARC_CHAIN_ID,
            gas: ARC_SAFE_GAS,
            maxFeePerGas: ARC_MAX_FEE_PER_GAS,
          } as any);
        }

        setTxHash(hash);
        await waitForTx(hash);
        await refetchAll();
        setState("success");
      } catch (err) {
        setState("error");
        setErrorMessage(getReadableLiquidityError(err));
        throw err;
      }
    },
    [userAddress, pairAddress, addrA, addrB, reserveA, reserveB, totalSupply, isNativeA, isNativeB, writeContractAsync, waitForTx, refetchAll],
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
    isNativeA,
    isNativeB,
    addrA,
    addrB,
  };
}
