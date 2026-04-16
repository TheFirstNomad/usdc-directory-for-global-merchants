// Admin Manage Listings edge function — full CRUD for the partners table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyMessage } from "npm:viem@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-address, x-admin-timestamp, x-admin-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OWNER_WALLET = "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c".toLowerCase();
const MAX_AGE_MS = 5 * 60 * 1000;

function verifyAdmin(req: Request): boolean {
  const address = req.headers.get("x-admin-address")?.toLowerCase();
  const timestamp = req.headers.get("x-admin-timestamp");
  const signature = req.headers.get("x-admin-signature");

  if (!address || !timestamp || !signature || address !== OWNER_WALLET) {
    return false;
  }

  const ts = Number(timestamp);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_AGE_MS) {
    return false;
  }

  try {
    const message = `USDC Directory Admin\nTimestamp: ${ts}`;
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    return recovered === OWNER_WALLET;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET — list all partners
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, description, logo_url, logo_emoji, website, categories, region, featured, payment_status, created_at, networks, wallet_address")
        .order("name", { ascending: true })
        .limit(2000);

      if (error) throw error;
      return new Response(
        JSON.stringify({ partners: data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT — update a partner
    if (req.method === "PUT") {
      const { id, name, description, website, categories, region, featured } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing partner id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (website !== undefined) updates.website = website;
      if (categories !== undefined) updates.categories = categories;
      if (region !== undefined) updates.region = region;
      if (featured !== undefined) updates.featured = featured;

      console.log("[admin-listings] PUT id:", id, "updates:", JSON.stringify(updates));
      const { error, data: updateData } = await supabase.from("partners").update(updates).eq("id", id).select("id");
      console.log("[admin-listings] PUT result:", JSON.stringify({ error, updateData }));
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE — delete a partner
    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing partner id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("submissions").delete().eq("partner_id", id);
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
