import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Pencil, ExternalLink, Plus } from "lucide-react";

interface ListingItem {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  logo_emoji: string | null;
  categories: string[];
}

const MyListings = () => {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    const fetchMyListings = async () => {
      const { data, error } = await supabase
        .rpc("get_my_listings", { _wallet_address: address.toLowerCase() });

      if (!error && data) {
        setListings(data as ListingItem[]);
      }
      setLoading(false);
    };

    fetchMyListings();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO title="My Listings" description="Manage your USDC Directory listings" path="/my-listings" />
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Connect Your Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view and manage your business listings.
            </p>
            <Button
              onClick={() => open()}
              className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold px-8 py-3 rounded-xl"
            >
              <Wallet className="h-5 w-5 mr-2" /> Connect
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="My Listings" description="Manage your USDC Directory listings" path="/my-listings" />
      <Header />

      <section className="bg-gradient-to-b from-primary/5 to-background py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">My Listings</h1>
          <p className="text-muted-foreground text-base">Manage your business listings on USDC Directory</p>
        </div>
      </section>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold text-foreground mb-2">No listings yet</p>
            <p className="text-muted-foreground mb-6">Get started by listing your first business!</p>
            <Link to="/submit">
              <Button className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold px-8 py-3 rounded-xl">
                <Plus className="h-5 w-5 mr-2" /> List Your Business
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                    {listing.logo_url ? (
                      <img src={listing.logo_url} alt={listing.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (listing.logo_emoji || "🏢")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{listing.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{listing.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {listing.categories.slice(0, 3).map((cat) => (
                        <span key={cat} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link to={`/merchant/${listing.id}`}>
                    <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                  </Link>
                  <Link to={`/edit/${listing.id}`}>
                    <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /></Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyListings;
