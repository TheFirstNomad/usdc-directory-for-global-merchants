import { useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { UNISWAP_V3_QUOTER_V2, QUOTER_V2_ABI, ARC_V2_ROUTER, V2_ROUTER_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";
import { WETH_ADDRESS, getPoolFee, ARC_WRAPPED_NATIVE } from "./tokens";

export function useQuote({
  tokenIn,
  tokenOut,
  amountIn,
  chainId,
  enabled = true,
}: {
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  chainId: number;
  enabled?: boolean;
}) {
  const amountInParsed = (() => {
    try {
      const num = parseFloat(amountIn);
      if (!num || num <= 0 || !tokenIn) return 0n;
      return parseUnits(amountIn, tokenIn.decimals);
    } catch {
      return 0n;
    }
  })();

  const isBase = chainId === 8453;
  const isArc = chainId === 5042002;

  // ── V3 quote (Base) ──
  const actualTokenInV3 = tokenIn?.address === "native" ? WETH_ADDRESS : (tokenIn?.address as `0x${string}`);
  const actualTokenOutV3 = tokenOut?.address === "native" ? WETH_ADDRESS : (tokenOut?.address as `0x${string}`);
  const poolFee = tokenIn && tokenOut ? getPoolFee(tokenIn.symbol, tokenOut.symbol) : 3000;

  const shouldFetchV3 =
    enabled && isBase && !!tokenIn && !!tokenOut &&
    amountInParsed > 0n && actualTokenInV3 !== actualTokenOutV3;

  const { data: v3Data, isLoading: v3Loading, error: v3Error } = useReadContract({
    address: UNISWAP_V3_QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: shouldFetchV3
      ? [{
          tokenIn: actualTokenInV3!,
          tokenOut: actualTokenOutV3!,
          amountIn: amountInParsed,
          fee: poolFee,
          sqrtPriceLimitX96: 0n,
        }]
      : undefined,
    chainId: 8453,
    query: { enabled: shouldFetchV3, refetchInterval: 15_000 },
  });

  // ── V2 quote (Arc Testnet) ──
  const v2TokenIn = tokenIn?.address === "native" ? ARC_WRAPPED_NATIVE : (tokenIn?.address as `0x${string}`);
  const v2TokenOut = tokenOut?.address === "native" ? ARC_WRAPPED_NATIVE : (tokenOut?.address as `0x${string}`);

  const shouldFetchV2 =
    enabled && isArc && !!tokenIn && !!tokenOut &&
    amountInParsed > 0n && v2TokenIn !== v2TokenOut;

  const v2Path = shouldFetchV2 ? [v2TokenIn, v2TokenOut] : [];

  const { data: v2Data, isLoading: v2Loading, error: v2Error } = useReadContract({
    address: ARC_V2_ROUTER,
    abi: V2_ROUTER_ABI,
    functionName: "getAmountsOut",
    args: shouldFetchV2 ? [amountInParsed, v2Path as `0x${string}`[]] : undefined,
    chainId: 5042002,
    query: { enabled: shouldFetchV2, refetchInterval: 15_000 },
  });

  // ── Return unified result ──
  if (isArc) {
    const amounts = v2Data as bigint[] | undefined;
    const amountOut = amounts && amounts.length >= 2 ? amounts[amounts.length - 1] : null;
    return {
      amountOut,
      gasEstimate: null,
      isLoading: shouldFetchV2 && v2Loading,
      error: v2Error,
      poolFee: 3000, // V2 uses 0.3% fee
    };
  }

  // Base V3
  const result = v3Data as readonly [bigint, bigint, number, bigint] | undefined;
  return {
    amountOut: result?.[0] ?? null,
    gasEstimate: result?.[3] ?? null,
    isLoading: shouldFetchV3 && v3Loading,
    error: v3Error,
    poolFee,
  };
}
