import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Wallet, Loader2, Plus, Minus, AlertTriangle, ExternalLink,
  Droplets, Info, BarChart3, DollarSign, Percent, Activity, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUnits, parseUnits } from "viem";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useBalance, useChainId, useSwitchChain, useReadContract } from "wagmi";
import SlippagePopover from "./SlippagePopover";
import SuccessModal from "./SuccessModal";
import { ARC_TESTNET_TOKENS, PLATFORM_FEE_BPS, type TokenInfo } from "@/lib/swap/tokens";
import { CHAINS } from "@/lib/swap/chains";
import { ERC20_ABI } from "@/lib/swap/contracts";
import { useLiquidity } from "@/lib/swap/useLiquidity";

const PRICES: Record<string, number> = { USDC: 1, EURC: 1.08 };

const LiquidityPanel = () => {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const chainConfig = CHAINS[5042002];
  const wrongChain = isConnected && walletChainId !== 5042002;

  const tokens = ARC_TESTNET_TOKENS;
  const [tokenA, setTokenA] = useState<TokenInfo>(tokens[0]);
  const [tokenB, setTokenB] = useState<TokenInfo>(tokens[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [removePercent, setRemovePercent] = useState(100);
  const [slippage, setSlippage] = useState(0.5);
  const [showSuccess, setShowSuccess] = useState(false);
  const [subTab, setSubTab] = useState<"add" | "remove">("add");

  const {
    state, txHash, errorMessage,
    pairExists, reserveA, reserveB, totalSupply,
    userLpBalance, userShare,
    allowanceA, allowanceB, lpAllowance,
    approveToken, approveLp, createPair,
    addLiquidity, removeLiquidity, reset,
    isNativeA, addrA, addrB,
  } = useLiquidity({
    tokenA, tokenB,
    userAddress: address as `0x${string}` | undefined,
  });

  /* ── Token balances ── */
  const { data: nativeBal } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: 5042002,
    query: { enabled: isConnected && !!address },
  });

  const { data: erc20BalA } = useReadContract({
    address: tokenA.address === "native" ? undefined : (tokenA.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId: 5042002,
    query: { enabled: isConnected && !!address && tokenA.address !== "native" },
  });

  const { data: erc20BalB } = useReadContract({
    address: tokenB.address === "native" ? undefined : (tokenB.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId: 5042002,
    query: { enabled: isConnected && !!address && tokenB.address !== "native" },
  });

  const balA = tokenA.address === "native"
    ? (nativeBal ? formatUnits(nativeBal.value, nativeBal.decimals) : null)
    : (erc20BalA != null ? formatUnits(erc20BalA as bigint, tokenA.decimals) : null);

  const balB = tokenB.address === "native"
    ? (nativeBal ? formatUnits(nativeBal.value, nativeBal.decimals) : null)
    : (erc20BalB != null ? formatUnits(erc20BalB as bigint, tokenB.decimals) : null);

  // Arc router limitation: addLiquidity only works for NEW pairs
  const routerLimitedForExistingPair = pairExists;

  const reserveAFmt = tokenA ? formatUnits(reserveA, tokenA.decimals) : "0";
  const reserveBFmt = tokenB ? formatUnits(reserveB, tokenB.decimals) : "0";
  const lpBalanceFmt = formatUnits(userLpBalance, 18);
  const lpToRemove = userLpBalance * BigInt(removePercent) / 100n;

  const estRemoveA = totalSupply > 0n ? (reserveA * lpToRemove / totalSupply) : 0n;
  const estRemoveB = totalSupply > 0n ? (reserveB * lpToRemove / totalSupply) : 0n;

  /* ── Price ratio for auto-fill ── */
  const priceAB = useMemo(() => {
    if (!reserveA || !reserveB || reserveA === 0n || reserveB === 0n || !tokenA || !tokenB) return null;
    const a = Number(formatUnits(reserveA, tokenA.decimals));
    const b = Number(formatUnits(reserveB, tokenB.decimals));
    return b / a;
  }, [reserveA, reserveB, tokenA, tokenB]);

  const handleAmountAChange = useCallback((val: string) => {
    const v = val.replace(/[^0-9.]/g, "");
    if (v.split(".").length <= 2) setAmountA(v);
    if (priceAB) {
      if (parseFloat(v) > 0) setAmountB((parseFloat(v) * priceAB).toFixed(6));
      else setAmountB("");
    }
  }, [priceAB]);

  const handleAmountBChange = useCallback((val: string) => {
    const v = val.replace(/[^0-9.]/g, "");
    if (v.split(".").length <= 2) setAmountB(v);
    if (priceAB) {
      if (parseFloat(v) > 0) setAmountA((parseFloat(v) / priceAB).toFixed(6));
      else setAmountA("");
    }
  }, [priceAB]);

  const parsedA = (() => { try { return parseUnits(amountA || "0", tokenA?.decimals ?? 6); } catch { return 0n; } })();
  const parsedB = (() => { try { return parseUnits(amountB || "0", tokenB?.decimals ?? 6); } catch { return 0n; } })();

  const needsApprovalA = !isNativeA && parsedA > 0n && allowanceA < parsedA;
  const needsApprovalB = parsedB > 0n && allowanceB < parsedB;
  const needsLpApproval = lpToRemove > 0n && lpAllowance < lpToRemove;

  // Show success modal reactively when tx is confirmed on-chain
  useEffect(() => {
    if (state === "success" && txHash) {
      setShowSuccess(true);
    }
  }, [state, txHash]);

  const handleAdd = async () => {
    try {
      await addLiquidity(amountA, amountB, slippage);
    } catch {
      // error already handled inside useLiquidity
    }
  };

  const handleRemove = async () => {
    try {
      await removeLiquidity(lpToRemove, slippage);
    } catch {
      // error already handled inside useLiquidity
    }
  };

  const handleCreatePair = async () => {
    await createPair();
  };

  const busy = !["idle", "success", "error"].includes(state);

  const stateLabel: Record<string, string> = {
    "approving-a": `Approving ${tokenA.symbol}…`,
    "approving-b": `Approving ${tokenB.symbol}…`,
    "approving-lp": "Approving LP Tokens…",
    "creating-pair": "Creating Pair…",
    "adding": "Adding Liquidity…",
    "removing": "Removing Liquidity…",
  };

  /* ── TVL calculation ── */
  const tvl = useMemo(() => {
    const a = Number(formatUnits(reserveA, tokenA?.decimals ?? 6)) * (PRICES[tokenA?.symbol] ?? 1);
    const b = Number(formatUnits(reserveB, tokenB?.decimals ?? 6)) * (PRICES[tokenB?.symbol] ?? 1);
    return a + b;
  }, [reserveA, reserveB, tokenA, tokenB]);

  return (
    <div className="w-full max-w-[460px] space-y-4">

      {/* ── Pool Analytics (when pair exists) ── */}
      {pairExists && (
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{tokenA.symbol}/{tokenB.symbol} Pool</h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-muted/20 border border-border/30 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-green-400" />
                <span className="text-[10px] text-muted-foreground uppercase">TVL</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                ${tvl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/30 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Percent className="h-3 w-3 text-yellow-400" />
                <span className="text-[10px] text-muted-foreground uppercase">Fee</span>
              </div>
              <p className="text-sm font-bold text-foreground">0.3%</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/30 p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] text-muted-foreground uppercase">Share</span>
              </div>
              <p className="text-sm font-bold text-foreground">{userShare.toFixed(2)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/15 p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src={tokenA.logoUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                <span className="text-[10px] text-muted-foreground">{tokenA.symbol} Reserve</span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {parseFloat(reserveAFmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-muted/15 p-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <img src={tokenB.logoUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                <span className="text-[10px] text-muted-foreground">{tokenB.symbol} Reserve</span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                {parseFloat(reserveBFmt).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {priceAB !== null && (
            <p className="text-[10px] text-muted-foreground/70 mt-2 text-center">
              1 {tokenA.symbol} = {priceAB.toFixed(4)} {tokenB.symbol}
              {userLpBalance > 0n && (
                <span className="ml-2">• LP: {parseFloat(lpBalanceFmt).toLocaleString(undefined, { maximumFractionDigits: 8 })}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* ── No pair notice ── */}
      {!pairExists && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2 animate-fade-in">
          <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-yellow-300 font-medium">No liquidity pool found for {tokenA.symbol}/{tokenB.symbol}.</p>
            <p className="text-[10px] text-yellow-400/70 mt-0.5">Add liquidity to automatically create the pair, or create it first.</p>
            {isConnected && !wrongChain && (
              <Button
                onClick={handleCreatePair}
                disabled={busy}
                size="sm"
                className="mt-2 h-7 text-[11px] bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
                variant="outline"
              >
                {state === "creating-pair" ? (
                  <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Creating…</>
                ) : (
                  <><Plus className="h-3 w-3 mr-1" /> Create Pair</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-5 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Liquidity</h2>
          <div className="flex items-center gap-1">
            {isConnected && (
              <button
                onClick={() => openWallet({ view: "Account" })}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/40"
              >
                <Wallet className="h-3.5 w-3.5" />
                {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""}
              </button>
            )}
            <SlippagePopover value={slippage} onChange={setSlippage} />
          </div>
        </div>

        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as "add" | "remove")} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="add" className="flex-1 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add
            </TabsTrigger>
            <TabsTrigger value="remove" className="flex-1 gap-1.5">
              <Minus className="h-3.5 w-3.5" /> Remove
            </TabsTrigger>
          </TabsList>

          {/* ── Add Liquidity ── */}
          <TabsContent value="add" className="space-y-3">
            {/* Token A */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 transition-colors focus-within:border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{tokenA.symbol}</span>
                {balA !== null && (
                  <button
                    onClick={() => handleAmountAChange(balA)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Wallet className="h-3 w-3" />
                    {parseFloat(balA).toFixed(2)}
                    <span className="ml-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">MAX</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={amountA}
                  onChange={(e) => handleAmountAChange(e.target.value)}
                  className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/30 shrink-0">
                  <img src={tokenA.logoUrl} alt={tokenA.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-semibold text-foreground">{tokenA.symbol}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-card border border-border/60 flex items-center justify-center">
                <Plus className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Token B */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 transition-colors focus-within:border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{tokenB.symbol}</span>
                {balB !== null && (
                  <button
                    onClick={() => handleAmountBChange(balB)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Wallet className="h-3 w-3" />
                    {parseFloat(balB).toFixed(2)}
                    <span className="ml-0.5 px-1 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">MAX</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={amountB}
                  onChange={(e) => handleAmountBChange(e.target.value)}
                  className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30"
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/30 shrink-0">
                  <img src={tokenB.logoUrl} alt={tokenB.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-semibold text-foreground">{tokenB.symbol}</span>
                </div>
              </div>
            </div>

            {/* Platform fee notice */}
            {parsedA > 0n && parsedB > 0n && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 px-1">
                <Info className="h-3 w-3" />

            {/* Router limitation warning for existing pairs */}
            {routerLimitedForExistingPair && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-300 font-medium">Adding to existing pools is not yet supported on this Arc Testnet router.</p>
                  <p className="text-[10px] text-yellow-400/70 mt-0.5">Initial pool creation works. Swaps work normally.</p>
                </div>
              </div>
            )}
                <span>{PLATFORM_FEE_BPS / 100}% platform fee on swaps • 0.3% LP trading fee</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-1 space-y-2">
              {state === "error" && (
                <div className="text-center space-y-2 animate-fade-in">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                  <Button onClick={reset} variant="outline" className="w-full">Try Again</Button>
                </div>
              )}
              {state !== "error" && (
                <>
                  {!isConnected ? (
                    <Button onClick={() => openWallet()} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                      <Wallet className="h-5 w-5 mr-2" /> Connect Wallet
                    </Button>
                  ) : wrongChain ? (
                    <Button onClick={() => switchChain({ chainId: 5042002 })} className="w-full h-12 text-base font-semibold rounded-xl bg-yellow-500/80 text-black hover:bg-yellow-500">
                      Switch to Arc Testnet
                    </Button>
                  ) : needsApprovalA ? (
                    <Button onClick={() => approveToken(addrA, parsedA, "approving-a")} disabled={busy} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                      {busy ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {stateLabel[state]}</> : `Approve ${tokenA.symbol}`}
                    </Button>
                  ) : needsApprovalB ? (
                    <Button onClick={() => approveToken(addrB, parsedB, "approving-b")} disabled={busy} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                      {busy ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {stateLabel[state]}</> : `Approve ${tokenB.symbol}`}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAdd}
                      disabled={parsedA <= 0n || parsedB <= 0n || busy || routerLimitedForExistingPair}
                      className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground disabled:opacity-40"
                    >
                      {busy ? (
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {stateLabel[state]}</>
                      ) : pairExists ? (
                        "Add Liquidity"
                      ) : (
                        <><Plus className="h-4 w-4 mr-1.5" /> Create Pair & Add Liquidity</>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Remove Liquidity ── */}
          <TabsContent value="remove" className="space-y-4">
            {userLpBalance <= 0n ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Droplets className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No LP tokens for this pair.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add liquidity first to get LP tokens.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-muted/20 border border-border/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Amount to Remove</span>
                    <span className="text-2xl font-bold text-foreground">{removePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={removePercent}
                    onChange={(e) => setRemovePercent(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex gap-2 mt-3">
                    {[25, 50, 75, 100].map((p) => (
                      <button
                        key={p}
                        onClick={() => setRemovePercent(p)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          removePercent === p
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-border/30"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated output */}
                <div className="rounded-xl bg-muted/10 border border-border/30 p-3 space-y-2 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">You will receive (estimated):</p>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <img src={tokenA.logoUrl} alt="" className="w-4 h-4 rounded-full" />
                      {tokenA.symbol}
                    </span>
                    <span className="font-medium text-foreground">
                      {parseFloat(formatUnits(estRemoveA, tokenA.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <img src={tokenB.logoUrl} alt="" className="w-4 h-4 rounded-full" />
                      {tokenB.symbol}
                    </span>
                    <span className="font-medium text-foreground">
                      {parseFloat(formatUnits(estRemoveB, tokenB.decimals)).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {state === "error" && (
                    <div className="text-center space-y-2 animate-fade-in">
                      <p className="text-sm text-red-400">{errorMessage}</p>
                      <Button onClick={reset} variant="outline" className="w-full">Try Again</Button>
                    </div>
                  )}
                  {state !== "error" && (
                    <>
                      {!isConnected ? (
                        <Button onClick={() => openWallet()} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                          <Wallet className="h-5 w-5 mr-2" /> Connect Wallet
                        </Button>
                      ) : wrongChain ? (
                        <Button onClick={() => switchChain({ chainId: 5042002 })} className="w-full h-12 text-base font-semibold rounded-xl bg-yellow-500/80 text-black hover:bg-yellow-500">
                          Switch to Arc Testnet
                        </Button>
                      ) : needsLpApproval ? (
                        <Button onClick={() => approveLp(lpToRemove)} disabled={busy} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                          {busy ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {stateLabel[state]}</> : "Approve LP Tokens"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRemove}
                          disabled={lpToRemove <= 0n || busy}
                          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90 disabled:opacity-40"
                        >
                          {busy ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {stateLabel[state]}</> : "Remove Liquidity"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-3">
          Arc Testnet • 0.3% trading fee • {PLATFORM_FEE_BPS / 100}% platform fee
        </p>
      </div>

      <SuccessModal
        open={showSuccess && state === "success" && !!txHash}
        txHash={txHash ?? ""}
        explorerUrl={chainConfig.explorer}
        explorerName="ArcScan"
        paySymbol={subTab === "add" ? tokenA.symbol : "LP"}
        payAmount={subTab === "add" ? amountA : `${removePercent}%`}
        receiveSymbol={subTab === "add" ? "LP Tokens" : `${tokenA.symbol}+${tokenB.symbol}`}
        receiveAmount={subTab === "add" ? "Received" : "Withdrawn"}
        mode={subTab === "add" ? "add-liquidity" : "remove-liquidity"}
        onClose={() => {
          setShowSuccess(false);
          reset();
          setAmountA("");
          setAmountB("");
        }}
      />
    </div>
  );
};

export default LiquidityPanel;
