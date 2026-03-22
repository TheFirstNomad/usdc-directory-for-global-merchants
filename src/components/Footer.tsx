import IPFooter from "@/components/IPFooter";

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
                <span className="font-bold text-2xl tracking-tighter bg-gradient-to-r from-[hsl(210,79%,46%)] to-[hsl(275,100%,25%)] bg-clip-text text-transparent">
                  USDC
                </span>
                <span className="font-semibold text-xl tracking-tight text-foreground -mt-1">
                  Directory
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              The #1 everyday directory for spending USDC worldwide — Built for freedom
              with Circle's regulated digital dollar.
            </p>

            <div className="mt-6 text-xs font-medium text-primary flex items-center gap-2">
              🗺️ Geo Mapping for Businesses — Coming Soon
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Directory</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/" className="hover:text-foreground transition-colors">Browse Merchants</a></li>
                <li><a href="/submit" className="hover:text-foreground transition-colors">Add Business</a></li>
                <li><a href="/insights" className="hover:text-foreground transition-colors">Insights</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">About USDC</a></li>
                <li><a href="/acquire" className="hover:text-foreground transition-colors">Acquire</a></li>
                <li><a href="/license" className="hover:text-foreground transition-colors">License</a></li>
              </ul>
            </div>
          </div>

          {/* Buy this Business */}
          <div className="mt-4 md:mt-0">
            <a
              href="/acquire"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-[hsl(275,100%,25%)] text-primary-foreground font-semibold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl text-base"
            >
              Acquire This Platform
              <span className="text-xl">→</span>
            </a>
          </div>
        </div>

        </div>
      </div>

      <IPFooter />
    </footer>
  );
};

export default Footer;
