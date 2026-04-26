import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { CalldataDebug } from "@/lib/swap/useSwap";
import { BUILDER_CODE } from "@/lib/builderCode";

interface Props {
  data: CalldataDebug | null;
}

const truncate = (hex: string, head = 18, tail = 8) =>
  hex.length <= head + tail ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy full hex"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <CopyButton value={value} />
    </div>
    <code className="block font-mono text-[11px] text-foreground/90 break-all leading-relaxed bg-muted/30 rounded px-2 py-1.5 border border-border/30">
      {value}
    </code>
  </div>
);

export default function CalldataDebugPanel({ data }: Props) {
  const [open, setOpen] = useState(true);

  if (!data) return null;

  const matches =
    data.attributed.toLowerCase().endsWith(data.suffix.slice(2).toLowerCase()) &&
    data.attributed.length === data.raw.length + data.suffix.length - 2;

  return (
    <div className="w-full max-w-[460px] mt-4 rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-xl shadow-black/10 animate-fade-in">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">ERC-8021 Debug</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              data.kind === "approve"
                ? "bg-yellow-500/15 text-yellow-400"
                : "bg-primary/15 text-primary"
            }`}
          >
            {data.kind}
          </span>
          {matches ? (
            <span className="text-[10px] text-green-400 font-medium">✓ suffix attached</span>
          ) : (
            <span className="text-[10px] text-red-400 font-medium">✗ mismatch</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Builder Code</div>
              <code className="font-mono text-foreground">{BUILDER_CODE}</code>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Captured</div>
              <span className="text-foreground">{new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          <Row label={`To (${data.kind === "approve" ? "Token" : "Router"})`} value={data.to} />
          <Row label={`Raw calldata · ${(data.raw.length - 2) / 2} bytes`} value={truncate(data.raw, 30, 12)} />
          <Row label={`Suffix · ${(data.suffix.length - 2) / 2} bytes`} value={data.suffix} />
          <Row
            label={`Attributed (sent on-chain) · ${(data.attributed.length - 2) / 2} bytes`}
            value={truncate(data.attributed, 30, 24)}
          />

          <p className="text-[10px] text-muted-foreground/80 leading-relaxed pt-1">
            Paste the suffix above into BaseScan's transaction <span className="font-semibold">Input Data</span> field — it must appear at the end of the calldata to confirm builder attribution.
          </p>
        </div>
      )}
    </div>
  );
}
