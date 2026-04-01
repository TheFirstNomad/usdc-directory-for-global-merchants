import { useState, useCallback } from "react";
import { ArrowDownUp, ChevronDown, ChevronUp, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";

// Base Mainnet token addresses
const TOKENS: Record<string, { symbol: string; name: string; address: `0x${string}` | "native"; decimals: number; logoUrl: string }> = {
  ETH: { symbol: "ETH", name: "Ethereum", address: "native", decimals: 18, logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  USDC: { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6, logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
  WETH: { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18, logoUrl: "https://cryptologos.cc/logos/ethereum-eth-logo.png" },
  DAI: { symbol: "DAI", name: "Dai Stablecoin", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18, logoUrl: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png" },
  cbBTC: { symbol: "cbBTC", name: "Coinbase BTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8, logoUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" },
};

const POPULAR_PAIRS = [
  { from: "ETH", to: "USDC" },
  { from: "cbBTC", to: "USDC" },
  { from: "DAI", to: "USDC" },
  { from: "WETH", to: "USDC" },
];

// Mock price rates (Phase 3 will use real quotes)
const MOCK_RATES: Record<string, number> = {
  ETH: 3450,
  USDC: 1,
  WETH: 3450,
  DAI: 1,
  cbBTC: 96500,
};

const TokenSelector = ({
  token,
  onSelect,
  excludeToken,
}: {
  token: string;
  onSelect: (t: string) => void;
  excludeToken: string;
}) => {
  const [open, setOpen] = useState(false);
  const t = TOKENS[token];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
      >
        <img src={t.logoUrl} alt={t.symbol} className="w-6 h-6 rounded-full" />
        <span className="font-semibold text-foreground">{t.symbol}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl py-2">
          {Object.values(TOKENS)
            .filter((tk) => tk.symbol !== excludeToken)
            .map((tk) => (
              <button
                key={tk.symbol}
                onClick={() => {
                  onSelect(tk.symbol);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${
                  tk.symbol === token ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <img src={tk.logoUrl} alt={tk.symbol} className="w-5 h-5 rounded-full" />
                <div className="text-left">
                  <div className="font-medium">{tk.symbol}</div>
                  <div className="text-xs text-muted-foreground">{tk.name}</div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const Swap = () => {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [payToken, setPayToken] = useState("ETH");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [payAmount, setPayAmount] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [slippage] = useState(0.5);

  const payTokenData = TOKENS[payToken];
  const receiveTokenData = TOKENS[receiveToken];

  // Fetch native ETH balance
  const { data: nativeBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    query: { enabled: isConnected && !!address },
  });

  // ERC20 balanceOf ABI
  const erc20BalanceAbi = [{ name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] }] as const;

  const { data: payErc20Balance } = useReadContract({
    address: payTokenData.address === "native" ? undefined : payTokenData.address as `0x${string}`,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: isConnected && !!address && payTokenData.address !== "native" },
  });

  const { data: receiveErc20Balance } = useReadContract({
    address: receiveTokenData.address === "native" ? undefined : receiveTokenData.address as `0x${string}`,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: isConnected && !!address && receiveTokenData.address !== "native" },
  });

  // Format balances
  const payBalanceFormatted = payTokenData.address === "native"
    ? (nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null)
    : (payErc20Balance != null ? formatUnits(payErc20Balance as bigint, payTokenData.decimals) : null);

  const receiveBalanceFormatted = receiveTokenData.address === "native"
    ? (nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : null)
    : (receiveErc20Balance != null ? formatUnits(receiveErc20Balance as bigint, receiveTokenData.decimals) : null);

  const payRate = MOCK_RATES[payToken] || 1;
  const receiveRate = MOCK_RATES[receiveToken] || 1;
  const payAmountNum = parseFloat(payAmount) || 0;
  const receiveAmount = payAmountNum > 0 ? ((payAmountNum * payRate) / receiveRate) : 0;
  const payFiat = payAmountNum * payRate;
  const receiveFiat = receiveAmount * receiveRate;

  const priceImpact = payAmountNum > 10000 ? 0.15 : payAmountNum > 1000 ? 0.05 : 0.01;
  const priceImpactColor =
    priceImpact > 0.1 ? "text-yellow-400" : "text-green-400";

  const handleReverse = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount(receiveAmount > 0 ? receiveAmount.toFixed(6).replace(/\.?0+$/, "") : "");
  }, [payToken, receiveToken, receiveAmount]);

  const handleMax = () => {
    if (payBalanceFormatted) {
      setPayAmount(payBalanceFormatted);
    }
  };

  const handlePairClick = (from: string, to: string) => {
    setPayToken(from);
    setReceiveToken(to);
    setPayAmount("");
  };

  const minReceived = receiveAmount * (1 - slippage / 100);

  return (
    <>
      <SEO
        title="Swap Tokens on Base | USDC Directory"
        description="Swap tokens on Base Mainnet with low fees and minimal slippage."
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Popular pairs */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {POPULAR_PAIRS.map((pair) => (
              <button
                key={`${pair.from}-${pair.to}`}
                onClick={() => handlePairClick(pair.from, pair.to)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  payToken === pair.from && receiveToken === pair.to
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {pair.from}/{pair.to}
              </button>
            ))}
          </div>

          {/* Swap card */}
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
                    <span>{parseFloat(payBalance.formatted).toFixed(4)}</span>
                    <button
                      onClick={handleMax}
                      className="text-primary font-semibold hover:underline ml-1"
                    >
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
                  }}
                  className="flex-1 bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/40 min-w-0"
                />
                <TokenSelector
                  token={payToken}
                  onSelect={setPayToken}
                  excludeToken={receiveToken}
                />
              </div>
              {payAmountNum > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  ≈ ${payFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Reverse button */}
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
                    <span>{parseFloat(receiveBalance.formatted).toFixed(4)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-semibold text-foreground">
                    {receiveAmount > 0
                      ? receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                      : "0"}
                  </p>
                </div>
                <TokenSelector
                  token={receiveToken}
                  onSelect={setReceiveToken}
                  excludeToken={payToken}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                {receiveAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ ${receiveFiat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {receiveAmount > 0 && (
                  <p className={`text-xs font-medium ${priceImpactColor}`}>
                    ~{priceImpact}% impact
                  </p>
                )}
              </div>
            </div>

            {/* Swap / Connect button */}
            <div className="mt-4">
              {!isConnected ? (
                <Button
                  onClick={() => openWallet()}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  disabled={payAmountNum <= 0}
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {payAmountNum <= 0 ? "Enter Amount" : "Swap"}
                </Button>
              )}
            </div>

            {/* Fee text */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              Fees on Base • Low slippage
            </p>

            {/* Collapsible details */}
            {receiveAmount > 0 && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <button
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    1 {payToken} ≈ {(payRate / receiveRate).toLocaleString(undefined, { maximumFractionDigits: 4 })} {receiveToken}
                  </span>
                  {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
                        {minReceived.toLocaleString(undefined, { maximumFractionDigits: 6 })} {receiveToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Route</span>
                      <span className="text-foreground">{payToken} → {receiveToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network</span>
                      <span className="text-foreground">Base Mainnet</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Swap;