import { Twitter, MessageCircle } from "lucide-react"; // kept import in case you want to add back later

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* Logo + Description */}
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

            {/* Geo Mapping note */}
            <div className="mt-6 text-xs font-medium text-[#2775CA] flex items-center gap-2">
              🗺️ Geo Mapping for Businesses — Coming Soon
            </div>
          </div>

          {/* Buy this Business Button */}
          <div className="mt-8 md:mt-0">
            <a
              href="https://unstoppabledomains.com/d/usdc.directory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2775CA] to-[#4B0082] text-white font-semibold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl text-base"
            >
              Buy this Business
              <span className="text-xl">→</span>
            </a>
          </div>
        </div>

        {/* Super clean bottom copyright only */}
        <div className="border-t border-border mt-12 pt-6 text-center text-xs text-muted-foreground">
          © 2026 USDC Directory. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
