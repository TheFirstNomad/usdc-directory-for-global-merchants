import { useState, useCallback } from "react";
import {
  ArrowDownUp, ChevronDown, ChevronUp, Wallet, Info,
  ExternalLink, AlertTriangle, Droplets, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useBalance, useReadContract, useChainId, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";

import ChainSelector from "@/components/swap/ChainSelector";
import TokenSearchModal from "@/components/swap/TokenSearchModal";
import { TOKENS_BY_CHAIN, POPULAR_PAIRS, type TokenInfo } from "@/lib/swap/tokens";
import { CHAINS, type SupportedChainId } from "@/lib/swap/chains";
import { ERC20_ABI } from "@/lib/swap/contracts";
import { useQuote } from "@/lib/swap/useQuote";
import { useSwap } from "@/lib/swap/useSwap";

const Swap = () => {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(8453);
  const tokens = TOKENS_BY_CHAIN[selectedChainId] ?? [];
  const [payToken, setPayToken] = useState<TokenInfo>(tokens[0]);
  const [receiveToken, setReceiveToken] = useState<TokenInfo>(tokens[1] ?? tokens[0]);
  const [payAmount, setPayAmount] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [slippage] = useState(0.5);
  const [tokenModalOpen, setTokenModalOpen] = useState<"pay" | "receive" | null>(null);

  const chainConfig = CHAINS[selectedChainId];
  const popularPairs = POPULAR_PAIRS[selectedChainId] ?? [];
  const isArcTestnet = selectedChainId === 5042002;
  const wrongChain = isConnected && walletChainId !== selectedChainId;

  /* ── chain switch ── */
  const handleChainChange = useCallback((id: SupportedChainId) => {
    setSelectedChainId(id);
    const t = TOKENS_BY_CHAIN[id] ?? [];
    setPayToken(t[0]);
    setReceiveToken(t[1] ?? t[0]);
    setPayAmount("");
  }, []);

  /* ── balances ── */
  const { data: nativeBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: selectedChainId,
    query: { enabled: isConnected && !!address },
  });

  const { data: payErc20Bal } = useReadContract({
    address: payToken.address === "native" ? undefined : (payToken.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId: selectedChainId,
    query: { enabled: isConnected && !!address && payToken.address !== "native" },
  });

  const { data: recErc20Bal } = useReadContract({
    address: receiveToken.address === "native" ? undefined : (receiveToken.address as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    chainId: selectedChainId,
    query: { enabled: isConnected && !!address && receiveToken.address !== "native" },
  });

  const payBalance =
    payToken.address === "native"
      ? nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null
      : payErc20Bal != null ? formatUnits(payErc20Bal as bigint, payToken.decimals) : null;

  const receiveBalance =
    receiveToken.address === "native"
      ? nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null
      : recErc20Bal != null ? formatUnits(recErc20Bal as bigint, receiveToken.decimals) : null;

  /* ── quote ── */
  const { amountOut, isLoading: quoteLoading, error: quoteError, poolFee } = useQuote({
    tokenIn: payToken,
    tokenOut: receiveToken,
    amountIn: payAmount,
    chainId: selectedChainId,
  });

  const receiveAmount = amountOut ? formatUnits(amountOut, receiveToken.decimals) : "";
  const receiveAmountNum = parseFloat(receiveAmount) || 0;
  const payAmountNum = parseFloat(payAmount) || 0;

  const amountOutMin =
    amountOut ? (amountOut * BigInt(Math.floor((1 - slippage / 100) * 10000))) / 10000n : null;
  const minReceived = amountOutMin ? formatUnits(amountOutMin, receiveToken.decimals) : "";

  const priceRate =
    receiveAmountNum > 0 && payAmountNum > 0 ? receiveAmountNum / payAmountNum : null;

  /* ── swap execution ── */
  const { swapState, txHash, errorMessage, needsApproval, approve, swap, reset } = useSwap({
    tokenIn: payToken,
    tokenOut: receiveToken,
    amountIn: payAmount,
    amountOutMin,
    chainId: selectedChainId,
    userAddress: address as `0x${string}` | undefined,
    slippage,
  });

  /* ── handlers ── */
  const handleReverse = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount(receiveAmount || "");
  }, [payToken, receiveToken, receiveAmount]);

  const handleMax = () => { if (payBalance) setPayAmount(payBalance); };

  const handlePairClick = (from: string, to: string) => {
    const f = tokens.find((t) => t.symbol === from);
    const r = tokens.find((t) => t.symbol === to);
    if (f) setPayToken(f);
    if (r) setReceiveToken(r);
    setPayAmount("");
  };

  const handleTokenSelect = (token: TokenInfo) => {
    if (tokenModalOpen === "pay") {
      if (token.symbol === receiveToken.symbol) setReceiveToken(payToken);
      setPayToken(token);
    } else {
      if (token.symbol === payToken.symbol) setPayToken(receiveToken);
      setReceiveToken(token);
    }
  };

  const swapDisabled = payAmountNum <= 0 || !amountOut || wrongChain || isArcTestnet;

  /* ── render ── */
  return (
    <>
      <SEO
        title="Swap Tokens on Base | USDC Directory"
        description="Swap tokens on Base Mainnet with low fees and minimal slippage."
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Chain selector */}
          <div className="mb-6">
            <ChainSelector chainId={selectedChainId} onChange={handleChainChange} />
          </div>

          {/* Testnet banner */}
          {isArcTestnet && (
            <div className="w-full max-w-[440px] mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Testnet Mode</p>
                <p className="text-xs text-yellow-400/70 mt-0.5">
                  All funds and swaps have no real value. Use only test USDC from the Circle faucet.
                </p>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
                >
                  <Droplets className="h-3 w-3" />
                  Get Test USDC
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Popular pairs */}
          {popularPairs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {popularPairs.map((p) => (
                <button
                  key={`${p.from}-${p.to}`}
                  onClick={() => handlePairClick(p.from, p.to)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    payToken.symbol === p.from && receiveToken.symbol === p.to
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {p.from}/{p.to}
                </button>
              ))}
            </div>
          )}

          {/* Wrong-chain prompt */}
          {wrongChain && (
            <div className="w-full max-w-[440px] mb-4">
              <Button
                onClick={() => switchChain({ chainId: selectedChainId })}
                variant="outline"
                className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Switch wallet to {chainConfig.name}
              </Button>
            </div>
          )}

          {/* ─── Swap Card ─── */}
          <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-foreground">Swap</h1>
              {isConnected && (
                <button
                  onClick={() => openWallet({ view: "Account" })}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""}
                </button>
              )}
            </div>

            {/* You Pay */}
            <div className="rounded-xl bg-muted/30 border border-border/50 p-4 mb-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">You Pay</span>
                {isConnected && payBalance && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="h-3 w-3" />
                    <span>{parseFloat(payBalance).toFixed(4)}</span>
                    <button onClick={handleMax} className="text-primary font-semibold hover:underline ml-1">
                      Max
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, "");
                    if (v.split(".").length <= 2) setPayAmount(v);
                    if (swapState !== "idle") reset();
                  }}
                  className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 min-w-0"
                />
                <button
                  onClick={() => setTokenModalOpen("pay")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <img src={payToken.logoUrl} alt={payToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-semibold text-foreground">{payToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Reverse */}
            <div className="flex justify-center -my-3 relative z-10">
              <button
                onClick={handleReverse}
                className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted hover:border-primary/40 transition-all hover:scale-105"
              >
                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* You Receive */}
            <div className="rounded-xl bg-muted/30 border border-border/50 p-4 mt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">You Receive</span>
                {isConnected && receiveBalance && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wallet className="h-3 w-3" />
                    <span>{parseFloat(receiveBalance).toFixed(4)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {quoteLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-lg text-muted-foreground">Fetching quote…</span>
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {receiveAmountNum > 0
                        ? parseFloat(receiveAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })
                        : "0"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setTokenModalOpen("receive")}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <img src={receiveToken.logoUrl} alt={receiveToken.symbol} className="w-6 h-6 rounded-full" />
                  <span className="font-semibold text-foreground">{receiveToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {quoteError && payAmountNum > 0 && (
                <p className="text-xs text-red-400 mt-1.5">No liquidity found for this pair</p>
              )}
            </div>

            {/* ── Action buttons ── */}
            <div className="mt-4 space-y-2">
              {swapState === "success" && txHash ? (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-green-400">Swap successful! 🎉</p>
                  <a
                    href={`${chainConfig.explorer}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View on {chainConfig.shortName === "Base" ? "BaseScan" : "ArcScan"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button onClick={reset} variant="outline" className="w-full mt-2">
                    New Swap
                  </Button>
                </div>
              ) : swapState === "error" ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-400">{errorMessage || "Swap failed"}</p>
                  <Button onClick={reset} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </div>
              ) : !isConnected ? (
                <Button
                  onClick={() => openWallet()}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              ) : isArcTestnet ? (
                <Button disabled className="w-full h-12 text-base font-semibold rounded-xl opacity-40">
                  Swaps on Arc Testnet — Coming Soon
                </Button>
              ) : needsApproval ? (
                <Button
                  onClick={approve}
                  disabled={swapState === "approving"}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {swapState === "approving" ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Approving…
                    </>
                  ) : (
                    `Approve ${payToken.symbol}`
                  )}
                </Button>
              ) : (
                <Button
                  onClick={swap}
                  disabled={swapDisabled || swapState === "swapping"}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {swapState === "swapping" ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Swapping…
                    </>
                  ) : payAmountNum <= 0 ? (
                    "Enter Amount"
                  ) : !amountOut ? (
                    "Fetching Quote…"
                  ) : (
                    "Swap"
                  )}
                </Button>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
              {isArcTestnet ? "Arc Testnet • No real value" : "Fees on Base • Low slippage"}
            </p>

            {/* Collapsible details */}
            {receiveAmountNum > 0 && !isArcTestnet && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    1 {payToken.symbol} ≈{" "}
                    {priceRate ? priceRate.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"}{" "}
                    {receiveToken.symbol}
                  </span>
                  {detailsOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                {detailsOpen && (
                  <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Slippage Tolerance</span>
                      <span className="text-foreground">{slippage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Received</span>
                      <span className="text-foreground">
                        {parseFloat(minReceived).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {receiveToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pool Fee</span>
                      <span className="text-foreground">{poolFee / 10000}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Route</span>
                      <span className="text-foreground">
                        {payToken.symbol} → {receiveToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network</span>
                      <span className="text-foreground">{chainConfig.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEX</span>
                      <span className="text-foreground">{chainConfig.dexName}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Token search modal */}
      <TokenSearchModal
        open={tokenModalOpen !== null}
        onClose={() => setTokenModalOpen(null)}
        onSelect={handleTokenSelect}
        excludeSymbol={tokenModalOpen === "pay" ? receiveToken.symbol : payToken.symbol}
        chainId={selectedChainId}
      />
    </>
  );
};

export default Swap;
