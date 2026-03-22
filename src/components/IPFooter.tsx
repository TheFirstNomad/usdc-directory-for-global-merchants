const IPFooter = () => (
  <footer className="border-t bg-background py-12 text-center">
    <div className="max-w-3xl mx-auto px-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">© 2026 USDC Directory. All rights reserved.</p>
      
      <div className="mt-8 pt-8 border-t">
        <p>The merchant database, scoring algorithm, data pipelines, and platform code are protected intellectual property.</p>
        <p className="mt-3">
          Offered for licensing or acquisition. Inquiries:{" "}
          <a 
            href="mailto:hello@usdc.directory" 
            className="text-foreground hover:underline font-medium transition-colors"
          >
            hello@usdc.directory
          </a>
        </p>
      </div>

      <p className="mt-12 text-xs opacity-75">🗺️ Geo Mapping for Businesses — Coming Soon</p>
    </div>
  </footer>
);

export default IPFooter;
