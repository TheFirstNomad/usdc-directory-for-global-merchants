
const AcquisitionBanner = () => (
  <div className="bg-muted/60 border-b text-center text-xs py-1.5 px-4 text-muted-foreground">
    Offered for licensing or acquisition. Inquiries:{" "}
    <a 
      href="mailto:hello@usdc.directory?subject=USDC%20Directory%20-%20Licensing%20or%20Acquisition" 
      className="font-medium text-foreground hover:underline transition-colors"
    >
      hello@usdc.directory
    </a>
  </div>
);

export default AcquisitionBanner;
