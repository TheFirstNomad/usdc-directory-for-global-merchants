import { Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          {/* === REAL USDC LOGO + PRO BRANDING === */}
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
              USDC is issued by{" "}
              <a
                href="https://www.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Circle Internet Financial
              </a>
              . This directory highlights official Circle Alliance members. 
              For the complete live list always visit{" "}
              <a
                href="https://partners.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                partners.circle.com
              </a>
              .
            </p>
          </div>

          {/* Links Columns */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Resources</h4>
              <div className="space-y-3 text-sm">
                <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground transition-colors">Get USDC</a>
                <a href="https://partners.circle.com/" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground transition-colors">Circle Alliance</a>
                <a href="https://developers.circle.com/" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground transition-colors">Developer Docs</a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Directory</h4>
              <div className="space-y-3 text-sm">
                <a href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About USDC</a>
                <a href="/submit" className="block text-muted-foreground hover:text-foreground transition-colors">Submit Company</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 USDC Directory. All rights reserved.
          </p>

          {/* Social Icons + Legal */}
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            <div className="flex gap-4 text-xs text-muted-foreground">
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
