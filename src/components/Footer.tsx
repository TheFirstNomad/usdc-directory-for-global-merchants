const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">$</span>
              </div>
              <span className="font-bold text-foreground text-sm">USDC Directory</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              USDC is issued by{" "}
              <a
                href="https://www.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Circle Internet Financial
              </a>
              . This directory highlights official Circle Alliance members. For the complete
              live list always visit{" "}
              <a
                href="https://partners.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                partners.circle.com
              </a>
              .
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Resources</h4>
              <div className="space-y-2">
                <a href="https://www.circle.com/usdc" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Get USDC
                </a>
                <a href="https://partners.circle.com/" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Circle Alliance
                </a>
                <a href="https://developers.circle.com/" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Developer Docs
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Directory</h4>
              <div className="space-y-2">
                <a href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">About USDC</a>
                <a href="/submit" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Submit Company</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} USDC Directory. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
