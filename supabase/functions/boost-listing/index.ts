// Boost a listing for 30 days. Frontend pays 5 USDC on-chain first, then calls this.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { partner_id, wallet_address, payment_tx, chain } = await req.json();
    if (!partner_id || !wallet_address || !payment_tx) {
      return new Response(JSON.stringify({ error: "partner_id, wallet_address, payment_tx required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Ownership check
    const { data: partner, error: pErr } = await supabase
      .from("partners")
      .select("id, wallet_address")
      .eq("id", partner_id)
      .single();

    if (pErr || !partner) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((partner.wallet_address || "").toLowerCase() !== wallet_address.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Not the listing owner" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: uErr } = await supabase
      .from("partners")
      .update({ boosted_until: expiresAt })
      .eq("id", partner_id);

    if (uErr) {
      console.error("Boost update failed:", uErr.message);
      return new Response(JSON.stringify({ error: "Failed to apply boost" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("agent_boosts").insert({
      partner_id,
      chain: chain || "Arc_Testnet",
      amount_usdc: 5_000_000,
      payment_id: payment_tx,
      expires_at: expiresAt,
    });

    return new Response(JSON.stringify({ id: partner_id, boosted_until: expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("boost-listing error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
