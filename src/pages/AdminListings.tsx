// Admin Manage Listings page — full CRUD table for partners
import { useEffect, useState, useCallback } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { TREASURY_ADDRESS } from "@/lib/web3";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, RefreshCw, Pencil, Trash2, Loader2, Star, DollarSign, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface PartnerRow {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  logo_emoji: string | null;
  website: string | null;
  categories: string[];
  region: string | null;
  featured: boolean | null;
  payment_status: string;
  created_at: string;
}

const AdminListings = () => {
  const { address, isConnected } = useAppKitAccount();
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editPartner, setEditPartner] = useState<PartnerRow | null>(null);
  const [saving, setSaving] = useState(false);

  const isOwner = isConnected && address?.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

  const fetchData = useCallback(async () => {
    if (!isOwner || !address) return;
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-listings`,
        { headers: { "x-wallet-address": address, "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPartners(data.partners);
    } catch {
      toast({ title: "Error", description: "Failed to load listings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isOwner, address, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-listings`,
        {
          method: "DELETE",
          headers: { "x-wallet-address": address!, "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setPartners((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Deleted", description: "Listing removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    }
  }, [address, toast]);

  // Updated: send all fields including categories to edge function
  const handleSave = useCallback(async () => {
    if (!editPartner || !address) return;
    setSaving(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const payload = {
        id: editPartner.id,
        name: editPartner.name,
        description: editPartner.description,
        website: editPartner.website,
        categories: editPartner.categories,
        region: editPartner.region,
      };
      console.log("[AdminListings] Saving listing:", payload);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-listings`,
        {
          method: "PUT",
          headers: { "x-wallet-address": address, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const body = await res.json();
      if (!res.ok) {
        console.error("[AdminListings] Update failed:", body);
        throw new Error(body.error || "Failed to update");
      }
      console.log("[AdminListings] Update success:", body);
      setPartners((prev) =>
        prev.map((p) => (p.id === editPartner.id ? { ...p, ...editPartner } : p))
      );
      setEditPartner(null);
      toast({ title: "Updated", description: "Listing saved" });
    } catch (err) {
      console.error("[AdminListings] Save error:", err);
      toast({ title: "Error", description: "Failed to update listing", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [editPartner, address, toast]);

  const handleToggleFeatured = useCallback(async (id: string, featured: boolean) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-listings`,
        {
          method: "PUT",
          headers: { "x-wallet-address": address!, "Content-Type": "application/json" },
          body: JSON.stringify({ id, featured }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      setPartners((prev) => prev.map((p) => (p.id === id ? { ...p, featured } : p)));
    } catch {
      toast({ title: "Error", description: "Failed to toggle featured", variant: "destructive" });
    }
  }, [address, toast]);

  const filtered = partners.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
  );

  if (!isConnected || !isOwner) {
    return (
      <>
        <SEO title="Unauthorized" description="Admin access only" />
        <Header />
        <main className="min-h-[70vh] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <ShieldAlert className="h-16 w-16 text-destructive" />
              <h2 className="text-xl font-bold text-foreground">Unauthorized</h2>
              <p className="text-muted-foreground text-center text-sm">
                Connect the owner wallet to access listing management.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO title="Manage Listings | USDC Directory" description="Admin listing management" />
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header with nav tabs */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{partners.length} total listings</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/payments" className="gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Payment Monitor
            </Link>
          </Button>
          <Button variant="secondary" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" /> Manage Listings
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/featured" className="gap-2 text-muted-foreground">
              <Star className="h-4 w-4" /> Featured
            </Link>
          </Button>
        </div>

        <Input
          placeholder="Search listings…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Featured</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className={p.featured ? "bg-primary/5" : ""}>
                        <TableCell>
                          {p.logo_url ? (
                            <img
                              src={p.logo_url}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-contain bg-card"
                              onError={(e) => { e.currentTarget.src = "/usdc-directory-logo.png"; }}
                            />
                          ) : (
                            <span className="text-xl">{p.logo_emoji || "🏢"}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[300px] truncate">
                          {p.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.payment_status === "confirmed" ? "default" : "secondary"} className="text-[10px]">
                            {p.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!p.featured}
                            onCheckedChange={(val) => handleToggleFeatured(p.id, val)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setEditPartner({ ...p })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove <strong>{p.name}</strong>. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(p.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Modal */}
      <Dialog open={!!editPartner} onOpenChange={(open) => !open && setEditPartner(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {editPartner && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Business Name</label>
                <Input
                  value={editPartner.name}
                  onChange={(e) => setEditPartner({ ...editPartner, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={editPartner.description}
                  onChange={(e) => setEditPartner({ ...editPartner, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Website</label>
                <Input
                  value={editPartner.website || ""}
                  onChange={(e) => setEditPartner({ ...editPartner, website: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Region</label>
                <Input
                  value={editPartner.region || ""}
                  onChange={(e) => setEditPartner({ ...editPartner, region: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPartner(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default AdminListings;
