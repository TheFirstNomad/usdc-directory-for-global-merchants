const AcquisitionBanner = () => (
  <div className="bg-gradient-to-r from-primary to-[hsl(275,100%,25%)] text-primary-foreground text-center text-xs py-1.5 px-4 font-medium tracking-wide">
    Prototype developed for Circle acquisition — Contact{" "}
    <a 
      href="mailto:hello@usdc.directory" 
      className="underline font-bold hover:text-white transition-colors"
    >
      hello@usdc.directory
    </a>{" "}
    for licensing
  </div>
);

export default AcquisitionBanner;
