const IPFooter = () => (
  <div className="text-center text-xs text-muted-foreground pt-8 border-t border-border mt-8">
    <p className="font-medium">© 2026 USDC Directory. All rights reserved.</p>
    
    <div className="mt-4 max-w-md mx-auto">
      <p>The merchant database, scoring algorithm, data pipelines, and platform code are protected intellectual property.</p>
      <p className="mt-3">
        Offered for licensing or acquisition. Inquiries:{" "}
        <a 
          href="mailto:hello@usdc.directory?subject=USDC%20Directory%20Licensing%20or%20Acquisition%20Inquiry" 
          className="text-foreground font-medium hover:underline hover:text-primary transition-colors"
        >
          hello@usdc.directory
        </a>
      </p>
    </div>
  </div>
);

export default IPFooter;
