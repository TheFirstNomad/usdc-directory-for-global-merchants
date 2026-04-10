import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { agent_name, wallet_address, description, logo_url, payment_tx } = body;

    if (!agent_name || typeof agent_name !== "string" || agent_name.trim().length === 0 || agent_name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "agent_name is required (max 100 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.trim().length === 0 || wallet_address.trim().length > 256) {
      return new Response(JSON.stringify({ error: "wallet_address is required (max 256 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0 || description.trim().length > 300) {
      return new Response(JSON.stringify({ error: "description is required (max 300 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create partner directly (payment already confirmed on-chain via Arc App Kit)
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .insert({
        name: agent_name.trim(),
        description: description.trim(),
        categories: ["AI Agents"],
        region: "Global",
        networks: [],
        wallet_address: wallet_address.trim().toLowerCase(),
        logo_url: logo_url || null,
        payment_status: "confirmed",
        payment_id: payment_tx || null,
      })
      .select()
      .single();

    if (partnerError) {
      console.error("Partner insert failed:", partnerError.message);
      return new Response(JSON.stringify({ error: "Failed to create listing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ id: partner.id, name: partner.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
