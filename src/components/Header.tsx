import { Link } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* === NEW LOGO === */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/usdc-directory-logo.png" 
            alt="USDC Directory" 
            className="h-9 w-auto hover:scale-105 transition-transform duration-200"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Directory</Link>
          <Link to="/swap" className="hover:text-primary transition-colors">Swap</Link>
          <Link to="/map" className="hover:text-primary transition-colors">Map</Link>
          <Link to="/submit" className="hover:text-primary transition-colors">List Your Business</Link>
        </nav>

        {/* Wallet Connect */}
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};

export default Header;
