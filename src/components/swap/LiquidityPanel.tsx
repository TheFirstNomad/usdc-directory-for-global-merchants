import { useState, useMemo, useCallback } from "react";
import {
  Wallet, Loader2, Plus, Minus, AlertTriangle, ExternalLink, Droplets, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUnits, parseUnits } from "viem";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useBalance, useChainId, useSwitchChain } from "wagmi";
import SlippagePopover from "./SlippagePopover";
import SuccessModal from "./SuccessModal";
import { ARC_TESTNET_TOKENS, type TokenInfo } from "@/lib/swap/tokens";
import { CHAINS } from "@/lib/swap/chains";
import { useLiquidity } from "@/lib/swap/useLiquidity";

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

  const {
    state, txHash, errorMessage,
    pairExists, reserveA, reserveB, totalSupply,
    userLpBalance, userShare,
    allowanceA, allowanceB, lpAllowance,
    approveToken, approveLp,
    addLiquidity, removeLiquidity, reset,
    isNativeA, addrA, addrB,
  } = useLiquidity({
    tokenA, tokenB,
    userAddress: address as `0x${string}` | undefined,
  });

  const reserveAFmt = tokenA ? formatUnits(reserveA, tokenA.decimals) : "0";
  const reserveBFmt = tokenB ? formatUnits(reserveB, tokenB.decimals) : "0";
  const lpBalanceFmt = formatUnits(userLpBalance, 18);
  const lpToRemove = userLpBalance * BigInt(removePercent) / 100n;

  // Estimated output on remove
  const estRemoveA = totalSupply > 0n ? (reserveA * lpToRemove / totalSupply) : 0n;
  const estRemoveB = totalSupply > 0n ? (reserveB * lpToRemove / totalSupply) : 0n;

  // Price ratio
  const priceAB = useMemo(() => {
    if (!reserveA || !reserveB || reserveA === 0n || reserveB === 0n || !tokenA || !tokenB) return null;
    const a = Number(formatUnits(reserveA, tokenA.decimals));
    const b = Number(formatUnits(reserveB, tokenB.decimals));
    return b / a;
  }, [reserveA, reserveB, tokenA, tokenB]);

  // Auto-fill amountB when amountA changes (if pool exists)
  const handleAmountAChange = useCallback((val: string) => {
    const v = val.replace(/[^0-9.]/g, "");
    if (v.split(".").length <= 2) setAmountA(v);
    if (priceAB && parseFloat(v) > 0) {
      setAmountB((parseFloat(v) * priceAB).toFixed(6));
    } else {
      setAmountB("");
    }
  }, [priceAB]);

  const handleAmountBChange = useCallback((val: string) => {
    const v = val.replace(/[^0-9.]/g, "");
    if (v.split(".").length <= 2) setAmountB(v);
    if (priceAB && parseFloat(v) > 0) {
      setAmountA((parseFloat(v) / priceAB).toFixed(6));
    } else {
      setAmountA("");
    }
  }, [priceAB]);

  const parsedA = (() => { try { return parseUnits(amountA || "0", tokenA?.decimals ?? 6); } catch { return 0n; } })();
  const parsedB = (() => { try { return parseUnits(amountB || "0", tokenB?.decimals ?? 6); } catch { return 0n; } })();

  const needsApprovalA = !isNativeA && parsedA > 0n && allowanceA < parsedA;
  const needsApprovalB = parsedB > 0n && allowanceB < parsedB;
  const needsLpApproval = lpToRemove > 0n && lpAllowance < lpToRemove;

  const handleAdd = async () => {
    await addLiquidity(amountA, amountB, slippage);
    setShowSuccess(true);
  };

  const handleRemove = async () => {
    await removeLiquidity(lpToRemove, slippage);
    setShowSuccess(true);
  };

  const busy = state !== "idle" && state !== "success" && state !== "error";

  return (
    <div className="w-full max-w-[460px]">
      {/* Pool Info */}
      {pairExists && (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{tokenA.symbol}/{tokenB.symbol} Pool</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-muted/20 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-0.5">Reserve {tokenA.symbol}</p>
              <p className="font-semibold text-foreground">{parseFloat(reserveAFmt).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
            </div>
            <div className="bg-muted/20 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-0.5">Reserve {tokenB.symbol}</p>
              <p className="font-semibold text-foreground">{parseFloat(reserveBFmt).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
            </div>
            {priceAB !== null && (
              <div className="bg-muted/20 rounded-lg p-2.5">
                <p className="text-muted-foreground mb-0.5">Rate</p>
                <p className="font-semibold text-foreground">1 {tokenA.symbol} = {priceAB.toFixed(4)} {tokenB.symbol}</p>
              </div>
            )}
            <div className="bg-muted/20 rounded-lg p-2.5">
              <p className="text-muted-foreground mb-0.5">Your Share</p>
              <p className="font-semibold text-foreground">{userShare.toFixed(2)}%</p>
            </div>
          </div>
          {userLpBalance > 0n && (
            <p className="text-xs text-muted-foreground mt-2">
              LP Tokens: {parseFloat(lpBalanceFmt).toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </p>
          )}
        </div>
      )}

      {!pairExists && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 mb-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">No liquidity pool found. Add liquidity to create the {tokenA.symbol}/{tokenB.symbol} pair.</p>
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-5 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Liquidity</h2>
          <SlippagePopover value={slippage} onChange={setSlippage} />
        </div>

        <Tabs defaultValue="add" className="w-full">
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
            <div className="rounded-xl bg-muted/20 border border-border/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{tokenA.symbol}</span>
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
            <div className="rounded-xl bg-muted/20 border border-border/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{tokenB.symbol}</span>
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

            {/* Action */}
            <div className="pt-2 space-y-2">
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
                      {state === "approving-a" ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Approving {tokenA.symbol}…</> : `Approve ${tokenA.symbol}`}
                    </Button>
                  ) : needsApprovalB ? (
                    <Button onClick={() => approveToken(addrB, parsedB, "approving-b")} disabled={busy} className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground">
                      {state === "approving-b" ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Approving {tokenB.symbol}…</> : `Approve ${tokenB.symbol}`}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAdd}
                      disabled={parsedA <= 0n || parsedB <= 0n || busy}
                      className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground disabled:opacity-40"
                    >
                      {state === "adding" ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Adding Liquidity…</> : pairExists ? "Add Liquidity" : "Create Pair & Add Liquidity"}
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
                <p>You don't have any LP tokens for this pair.</p>
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
                          {state === "approving-lp" ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Approving LP…</> : "Approve LP Tokens"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleRemove}
                          disabled={lpToRemove <= 0n || busy}
                          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:opacity-90 disabled:opacity-40"
                        >
                          {state === "removing" ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Removing…</> : "Remove Liquidity"}
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
          Arc Testnet • 0.3% trading fee • 1% platform fee
        </p>
      </div>

      <SuccessModal
        open={showSuccess && state === "success" && !!txHash}
        txHash={txHash ?? ""}
        explorerUrl={chainConfig.explorer}
        explorerName="ArcScan"
        paySymbol={tokenA.symbol}
        payAmount={amountA || `${removePercent}% LP`}
        receiveSymbol={tokenB.symbol}
        receiveAmount={amountB || "tokens"}
        onClose={() => { setShowSuccess(false); reset(); setAmountA(""); setAmountB(""); }}
      />
    </div>
  );
};

export default LiquidityPanel;
