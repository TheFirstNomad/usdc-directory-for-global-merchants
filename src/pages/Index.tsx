import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PartnerCard from "@/components/PartnerCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import CategoryFilter from "@/components/CategoryFilter";
import Footer from "@/components/Footer";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        partnerCount={partners.length}
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${filteredPartners.length} partners`}
              </p>
              {(selectedCategories.length > 0 || selectedRegions.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedRegions([]);
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />
                ))
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium">No partners found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
