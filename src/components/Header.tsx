import { Menu, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Directory", href: "/" },
  { label: "Map", href: "/map" },
  { label: "About USDC", href: "/about" },
  { label: "Insights", href: "/insights" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/Circle_USDC_Logo.svg"
            alt="USDC"
            className="h-8 w-8 flex-shrink-0"
          />
          <div className="flex items-baseline gap-1">
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[hsl(210,79%,46%)] to-[hsl(275,100%,25%)] bg-clip-text text-transparent">
              USDC
            </span>
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Directory
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
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
          
          {/* Acquire as direct mailto */}
          <a
            href="mailto:hello@usdc.directory?subject=USDC%20Directory%20Acquisition%20Inquiry"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            Acquire
          </a>
        </nav>

        {/* Desktop actions — Add Your Business now direct mailto */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <a
            href="mailto:hello@usdc.directory?subject=Add%20My%20Business%20to%20USDC%20Directory%20-%20Submission%20Inquiry"
            className="no-underline"
          >
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md">
              Add Your Business
            </Button>
          </a>
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-fade-in">
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
          
          <a 
            href="mailto:hello@usdc.directory?subject=USDC%20Directory%20Acquisition%20Inquiry"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Acquire
          </a>
          
          <a 
            href="mailto:hello@usdc.directory?subject=Add%20My%20Business%20to%20USDC%20Directory%20-%20Submission%20Inquiry"
            onClick={() => setMobileOpen(false)}
            className="block mt-2"
          >
            <Button size="sm" className="w-full bg-primary text-primary-foreground font-semibold">
              Add Your Business
            </Button>
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
