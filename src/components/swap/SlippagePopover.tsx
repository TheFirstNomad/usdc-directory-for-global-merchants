import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRESETS = [0.1, 0.5, 1];

const SlippagePopover = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const [custom, setCustom] = useState("");
  const isCustom = !PRESETS.includes(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors group">
          <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-card border-border" align="end">
        <p className="text-sm font-semibold text-foreground mb-3">Slippage Tolerance</p>
        <div className="flex gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { onChange(p); setCustom(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                value === p && !isCustom
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Custom"
            value={isCustom ? value.toString() : custom}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setCustom(v);
              const num = parseFloat(v);
              if (num > 0 && num <= 50) onChange(num);
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        {value > 5 && (
          <p className="text-xs text-yellow-400 mt-2">⚠ High slippage may result in unfavorable trades</p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default SlippagePopover;
