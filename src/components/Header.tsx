import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-hero px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-hero-foreground/20 flex items-center justify-center">
          <span className="text-hero-foreground font-bold text-sm">$</span>
        </div>
        <span className="text-hero-foreground font-bold text-xl tracking-tight">
          USDC Directory
        </span>
      </div>
      <Button
        variant="outline"
        className="border-hero-foreground/30 text-hero-foreground bg-transparent hover:bg-hero-foreground/10 text-sm font-medium"
      >
        Submit Profile <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </header>
  );
};

export default Header;
