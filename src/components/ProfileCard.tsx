import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProfileData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  products: string[];
  logo: string;
  category: string;
}

const ProfileCard = ({ profile }: { profile: ProfileData }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-shadow">
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        <span className="text-2xl">{profile.logo}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-card-foreground text-lg">
              {profile.name}
            </h3>
            <p className="text-muted-foreground text-sm mt-0.5">
              {profile.description}
            </p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
          >
            View Profile
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {profile.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-tag text-tag-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 text-sm text-muted-foreground">
          <span className="font-medium text-card-foreground">
            Products that support USDC:
          </span>{" "}
          {profile.products.join(", ")}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
