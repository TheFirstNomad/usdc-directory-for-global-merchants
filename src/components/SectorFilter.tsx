const sectors = [
  "Finance",
  "Developer Tooling",
  "Gaming",
  "Payments",
  "Data & Analytics",
  "Infrastructure",
  "DeFi",
  "NFTs",
];

interface SectorFilterProps {
  selectedSectors: string[];
  onToggleSector: (sector: string) => void;
}

const SectorFilter = ({ selectedSectors, onToggleSector }: SectorFilterProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-card-foreground mb-4">Profile Sectors</h3>
      <div className="space-y-2">
        {sectors.map((sector) => (
          <label
            key={sector}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selectedSectors.includes(sector)}
              onChange={() => onToggleSector(sector)}
              className="w-4 h-4 rounded border-border text-primary accent-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
              {sector}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SectorFilter;
