import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Partner } from "@/lib/partners";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PartnerCard = ({ partner }: { partner: Partner }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-tag flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-105 transition-transform">
            {partner.logo_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-card-foreground text-base leading-tight">
                  {partner.name}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {partner.description}
                </p>
              </div>
              {partner.featured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground flex-shrink-0 uppercase tracking-wider">
                  Featured
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {partner.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-tag text-tag-foreground"
                >
                  {cat}
                </span>
              ))}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {partner.region}
              </span>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-tag flex items-center justify-center text-3xl">
              {partner.logo_emoji}
            </div>
            <div>
              <DialogTitle className="text-lg">{partner.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{partner.region}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-foreground leading-relaxed">{partner.description}</p>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {partner.categories.map((cat) => (
                <span key={cat} className="px-2.5 py-1 rounded-full text-xs font-medium bg-tag text-tag-foreground">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          {partner.use_cases.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Use Cases
              </p>
              <div className="flex flex-wrap gap-1.5">
                {partner.use_cases.map((uc) => (
                  <span key={uc} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noopener noreferrer">
              <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                Visit Website <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerCard;
