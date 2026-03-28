const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Circle_USDC_Logo.svg" alt="USDC" className="h-9 w-9 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] bg-clip-text text-transparent">
                  USDC
                </span>
                <span className="font-semibold text-xl tracking-tight text-foreground -mt-1">
                  Directory
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The #1 everyday directory for spending USDC worldwide — discover merchants,
              exchanges, and real-world venues accepting the world's leading digital dollar.
            </p>
          </div>

          <div className="flex flex-wrap gap-10 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Directory</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/" className="hover:text-foreground transition-colors">Browse Merchants</a></li>
                <li><a href="/submit" className="hover:text-foreground transition-colors">List Your Business</a></li>
                <li><a href="/insights" className="hover:text-foreground transition-colors">Insights</a></li>
                <li><a href="/map" className="hover:text-foreground transition-colors">Map View</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">About USDC</a></li>
                <li>
                  <a href="mailto:hello@usdc.directory" className="hover:text-foreground transition-colors">
                    hello@usdc.directory
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 USDC Directory. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Built on Arc • Powered by Circle USDC
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
