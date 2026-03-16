import { Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Logo + Cool Description */}
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/Circle_USDC_Logo.svg" 
                alt="USDC" 
                className="h-9 w-9 flex-shrink-0" 
              />
              <div className="flex flex-col -space-x-px">
                <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-[#2775CA] to-[#4B0082] bg-clip-text text-transparent">
                  USDC
                </span>
                <span className="font-semibold text-xl tracking-tight text-foreground -mt-1">
                  Directory
                </span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Independent global guide to the digital dollar. Discover where you can 
              spend, send, and use USDC across exchanges, wallets, merchants, and 
              businesses worldwide.
            </p>

            {/* New Geo Mapping note */}
            <div className="mt-6 text-xs font-medium text-[#2775CA] flex items-center gap-2">
              🗺️ Geo Mapping for Businesses — Coming Soon
            </div>
          </div>

          {/* Buy This Directory Button (prominent) */}
          <div className="mt-8 md:mt-0">
            <a
              href="https://unstoppabledomains.com/d/usdc.directory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2775CA] to-[#4B0082] text-white font-semibold rounded-2xl hover:scale-105 transition-all shadow-lg"
            >
              Buy this Directory
              <span className="text-xl">→</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-muted-foreground">
            © 2026 USDC Directory. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            <div className="flex gap-4 text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
