import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Directory", href: "/" },
  { label: "About USDC", href: "/about" },
  { label: "Submit Your Company", href: "/submit" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-black text-sm">$</span>
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            USDC Directory
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === link.href
                  ? "text-primary bg-tag"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://partners.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Circle Alliance ↗
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get USDC
            </Button>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === link.href
                  ? "text-primary bg-tag"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://partners.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            Circle Alliance ↗
          </a>
          <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full mt-2 bg-primary text-primary-foreground">
              Get USDC
            </Button>
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
