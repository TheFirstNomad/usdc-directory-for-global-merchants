import { useMemo } from "react";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import {
  BarChart3, TrendingUp, DollarSign, Droplets, Percent, Activity,
} from "lucide-react";
import { ARC_V2_FACTORY } from "@/lib/swap/contracts";
import { V2_FACTORY_ABI, V2_PAIR_ABI } from "@/lib/swap/contracts";
import { ARC_TESTNET_TOKENS, PLATFORM_FEE_BPS } from "@/lib/swap/tokens";

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const USDC = ARC_TESTNET_TOKENS[0];
const EURC = ARC_TESTNET_TOKENS[1];

const usdcAddr = "0x3600000000000000000000000000000000000000" as `0x${string}`; // wrapped native
const eurcAddr = EURC.address as `0x${string}`;

/** Rough fiat prices for TVL calc */
const PRICES: Record<string, number> = { USDC: 1, EURC: 1.08 };

const PoolAnalytics = () => {
  const { data: pairAddress } = useReadContract({
    address: ARC_V2_FACTORY,
    abi: V2_FACTORY_ABI,
    functionName: "getPair",
    args: [usdcAddr, eurcAddr],
    chainId: 5042002,
  });

  const pairExists = !!pairAddress && pairAddress !== ZERO;

  const { data: reserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "getReserves",
    chainId: 5042002,
    query: { enabled: pairExists, refetchInterval: 15_000 },
  });

  const { data: token0 } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "token0",
    chainId: 5042002,
    query: { enabled: pairExists },
  });

  const { data: totalSupply } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: V2_PAIR_ABI,
    functionName: "totalSupply",
    chainId: 5042002,
    query: { enabled: pairExists },
  });

  const stats = useMemo(() => {
    if (!reserves || !token0) {
      return { tvl: 0, reserveUSDC: 0, reserveEURC: 0, lpSupply: "0", feeRate: 0.3, platformFee: PLATFORM_FEE_BPS / 100, dailyFees: 0 };
    }
    const [r0, r1] = reserves as [bigint, bigint, number];
    const isToken0USDC = (token0 as string).toLowerCase() === usdcAddr.toLowerCase();
    const rUSDC = isToken0USDC ? r0 : r1;
    const rEURC = isToken0USDC ? r1 : r0;

    const reserveUSDC = Number(formatUnits(rUSDC, USDC.decimals));
    const reserveEURC = Number(formatUnits(rEURC, EURC.decimals));
    const tvl = reserveUSDC * PRICES.USDC + reserveEURC * PRICES.EURC;

    const lpSupply = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)).toFixed(6) : "0";
    // Estimate daily fees: assume ~5% daily volume relative to TVL (placeholder)
    const estDailyVolume = tvl * 0.05;
    const dailyFees = estDailyVolume * 0.003;

    return { tvl, reserveUSDC, reserveEURC, lpSupply, feeRate: 0.3, platformFee: PLATFORM_FEE_BPS / 100, dailyFees };
  }, [reserves, token0, totalSupply]);

  if (!pairExists) {
    return (
      <div className="w-full max-w-[460px] mt-6 rounded-2xl border border-border/40 bg-card/80 p-6 text-center">
        <BarChart3 className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Pool analytics will appear once the USDC/EURC pair is created.</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Value Locked",
      value: `$${stats.tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      label: "USDC Reserve",
      value: stats.reserveUSDC.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: Droplets,
      color: "text-blue-400",
    },
    {
      label: "EURC Reserve",
      value: stats.reserveEURC.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      icon: Droplets,
      color: "text-purple-400",
    },
    {
      label: "LP Token Supply",
      value: stats.lpSupply,
      icon: Activity,
      color: "text-cyan-400",
    },
    {
      label: "Trading Fee",
      value: `${stats.feeRate}%`,
      icon: Percent,
      color: "text-yellow-400",
    },
    {
      label: "Est. Daily Fees",
      value: `$${stats.dailyFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="w-full max-w-[460px] mt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">USDC / EURC Pool Analytics</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-3 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <c.icon className={`h-3.5 w-3.5 ${c.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
        {stats.platformFee}% platform fee applied on swaps & liquidity removal
      </p>
    </div>
  );
};

export default PoolAnalytics;
