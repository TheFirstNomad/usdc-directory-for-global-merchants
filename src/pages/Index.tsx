import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PartnerCard from "@/components/PartnerCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import CategoryFilter from "@/components/CategoryFilter";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { fetchPartners, type Partner } from "@/lib/partners";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners().then((data) => {
      setPartners(data);
      setLoading(false);
    });
  }, []);

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleRegion = (region: string) =>
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );

  const featuredPartners = useMemo(
    () => partners.filter((p) => p.featured),
    [partners]
  );

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q)) ||
        p.region.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategories.length === 0 ||
        p.categories.some((c) => selectedCategories.includes(c));

      const matchesRegion =
        selectedRegions.length === 0 || selectedRegions.includes(p.region);

      return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [searchQuery, selectedCategories, selectedRegions, partners]);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedRegions([]);
    setSearchQuery("");
  };

  const hasFilters = selectedCategories.length > 0 || selectedRegions.length > 0 || searchQuery.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={() => {}}
        partnerCount={partners.length}
        onCategorySelect={toggleCategory}
        selectedCategories={selectedCategories}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <FeaturedCarousel partners={featuredPartners} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <aside className="lg:w-56 flex-shrink-0">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategory}
              selectedRegions={selectedRegions}
              onToggleRegion={toggleRegion}
            />
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-muted-foreground font-medium">
                {loading ? "Loading…" : `${filteredPartners.length} partners`}
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl h-56 animate-pulse" />
                ))}
              </div>
            ) : filteredPartners.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredPartners.map((partner, i) => (
                  <PartnerCard key={partner.id} partner={partner} index={i} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <SearchX className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">No partners found</p>
                <p className="text-sm text-muted-foreground mb-5">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="focus:ring-2 focus:ring-ring"
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
