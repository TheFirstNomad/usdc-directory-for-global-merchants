import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const INTERVAL = 15;

const QuoteTimer = ({ active, onRefresh }: { active: boolean; onRefresh?: () => void }) => {
  const [seconds, setSeconds] = useState(INTERVAL);

  useEffect(() => {
    if (!active) { setSeconds(INTERVAL); return; }
    setSeconds(INTERVAL);
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) return INTERVAL;
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const pct = (seconds / INTERVAL) * 100;

  return (
    <button
      onClick={onRefresh}
      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      title="Quote refreshes automatically"
    >
      <div className="relative w-4 h-4">
        <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" />
          <circle
            cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray={`${(pct / 100) * 50.3} 50.3`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <RefreshCw className="absolute inset-0.5 w-3 h-3" />
      </div>
      {seconds}s
    </button>
  );
};

export default QuoteTimer;
