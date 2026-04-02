import { useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { UNISWAP_V3_QUOTER_V2, QUOTER_V2_ABI } from "./contracts";
import type { TokenInfo } from "./tokens";
import { WETH_ADDRESS, getPoolFee } from "./tokens";

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

  const actualTokenIn = tokenIn?.address === "native" ? WETH_ADDRESS : (tokenIn?.address as `0x${string}`);
  const actualTokenOut = tokenOut?.address === "native" ? WETH_ADDRESS : (tokenOut?.address as `0x${string}`);
  const poolFee = tokenIn && tokenOut ? getPoolFee(tokenIn.symbol, tokenOut.symbol) : 3000;

  const isBase = chainId === 8453;
  const shouldFetch =
    enabled &&
    isBase &&
    !!tokenIn &&
    !!tokenOut &&
    amountInParsed > 0n &&
    actualTokenIn !== actualTokenOut;

  const { data, isLoading, error } = useReadContract({
    address: UNISWAP_V3_QUOTER_V2,
    abi: QUOTER_V2_ABI,
    functionName: "quoteExactInputSingle",
    args: shouldFetch
      ? [
          {
            tokenIn: actualTokenIn!,
            tokenOut: actualTokenOut!,
            amountIn: amountInParsed,
            fee: poolFee,
            sqrtPriceLimitX96: 0n,
          },
        ]
      : undefined,
    chainId: 8453,
    query: { enabled: shouldFetch, refetchInterval: 15_000 },
  });

  const result = data as readonly [bigint, bigint, number, bigint] | undefined;

  return {
    amountOut: result?.[0] ?? null,
    gasEstimate: result?.[3] ?? null,
    isLoading: shouldFetch && isLoading,
    error,
    poolFee,
  };
}
