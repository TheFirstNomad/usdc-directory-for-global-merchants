const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] bg-clip-text text-transparent">
                  USDC
                </span>
                <span className="font-semibold text-xl tracking-tight text-foreground -mt-1">Directory</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The #1 everyday directory for USDC worldwide, discover online & offline merchants, geo mapped businesses
              and real-world venues accepting the world's leading digital dollar.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Directory</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="/" className="hover:text-foreground transition-colors">
                    Browse Listings
                  </a>
                </li>
                <li>
                  <a href="/submit" className="hover:text-foreground transition-colors">
                    List Your Business
                  </a>
                </li>
                <li>
                  <a href="/insights" className="hover:text-foreground transition-colors">
                    Insights
                  </a>
                </li>
                <li>
                  <a href="/map" className="hover:text-foreground transition-colors">
                    Map View
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="mailto:hello@usdc.directory" className="hover:text-foreground transition-colors">
                    hello@usdc.directory
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Follow Us</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="https://x.com/usdcdirectory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    @usdcdirectory
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 USDC Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
