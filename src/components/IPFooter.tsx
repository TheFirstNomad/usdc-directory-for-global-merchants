const IPFooter = () => (
  <footer className="border-t bg-background py-8 text-center text-xs text-muted-foreground">
    <div className="max-w-4xl mx-auto px-4">
      <p className="font-medium text-foreground">USDC Directory</p>
      <p className="mt-1">The #1 everyday directory for spending USDC worldwide — Built for freedom with Circle&apos;s regulated digital dollar.</p>
      
      <div className="mt-6 border-t pt-6">
        <p>© 2026 USDC Directory. All code, merchant curation scoring algorithm, data pipelines, and integrations are protected intellectual property.</p>
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
    </div>
  </footer>
);

export default IPFooter;
