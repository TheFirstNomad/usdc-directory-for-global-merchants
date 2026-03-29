import { Menu, X, Wallet, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useTheme } from "@/components/ThemeProvider";

const navLinks = [
  { label: "Directory", href: "/" },
  { label: "Map", href: "/map" },
  { label: "About USDC", href: "/about" },
  { label: "Insights", href: "/insights" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { theme, toggleTheme } = useTheme();

  const truncatedAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "";

  const handleAuth = () => {
    open(isConnected ? { view: "Account" } : undefined);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/Circle_USDC_Logo.svg" alt="USDC" className="h-8 w-8 flex-shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] bg-clip-text text-transparent">
              USDC
            </span>
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Directory
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleAuth}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>{isConnected ? truncatedAddress : "Sign In"}</span>
          </button>

          <Link to="/submit">
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all px-5 py-2.5 rounded-xl"
            >
              List Your Business
            </Button>
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg ${
                location.pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 space-y-2">
            <button
              onClick={() => {
                handleAuth();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border bg-card"
            >
              <LogIn className="h-4 w-4" />
              {isConnected ? truncatedAddress : "Sign In"}
            </button>
            <Link to="/submit" onClick={() => setMobileOpen(false)} className="block">
              <Button size="sm" className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold rounded-xl">
                List Your Business
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
