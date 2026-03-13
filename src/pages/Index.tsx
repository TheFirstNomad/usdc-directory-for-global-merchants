import { useState, useMemo } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProfileCard from "@/components/ProfileCard";
import SectorFilter from "@/components/SectorFilter";
import Footer from "@/components/Footer";
import { profiles } from "@/data/profiles";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        !activeCategory || p.category === activeCategory;

      const matchesSector =
        selectedSectors.length === 0 ||
        p.tags.some((t) => selectedSectors.includes(t));

      return matchesSearch && matchesCategory && matchesSector;
    });
  }, [searchQuery, activeCategory, selectedSectors]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <SectorFilter
              selectedSectors={selectedSectors}
              onToggleSector={toggleSector}
            />
          </aside>
          <div className="flex-1 space-y-4">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No profiles found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
