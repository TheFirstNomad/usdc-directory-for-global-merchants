const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">$</span>
          </div>
          <span className="font-semibold text-foreground text-sm">
            USDC Directory
          </span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Cookies
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 USDC Directory. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
