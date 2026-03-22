const IPFooter = () => (
  <footer className="border-t bg-background py-8 text-center text-xs text-muted-foreground">
    <div className="max-w-4xl mx-auto px-4">
      <p className="font-medium text-foreground">USDC Directory</p>
      <p className="mt-1">© 2026. All rights reserved.</p>
      
      <div className="mt-6 border-t pt-6">
        <p>The merchant database, scoring algorithm, data pipelines, and platform code are protected intellectual property.</p>
        <p className="mt-2">
          Offered for licensing or acquisition. Inquiries:{" "}
          <a 
            href="mailto:hello@usdc.directory" 
            className="underline hover:text-foreground transition-colors"
          >
            hello@usdc.directory
          </a>
        </p>
      </div>

      <p className="mt-10 text-[10px]">🗺️ Geo Mapping for Businesses — Coming Soon</p>
    </div>
  </footer>
);

export default IPFooter;
