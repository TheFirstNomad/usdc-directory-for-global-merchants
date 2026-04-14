/**
 * submit-listing – Persists a new listing or update after on-chain payment.
 *
 * POST body:
 *   { type: "listing"|"update", tx_hash, wallet_address, data: { company_name, description, website, categories, region, logo_url, contact_email?, partner_id? } }
 *
 * For "listing": inserts into submissions + partners.
 * For "update": inserts into submissions + updates existing partner.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { type, tx_hash, wallet_address, data } = body as {
      type: "listing" | "update";
      tx_hash: string;
      wallet_address: string;
      data: {
        company_name: string;
        description: string;
        website?: string;
        categories?: string[];
        region?: string;
        logo_url?: string | null;
        contact_email?: string;
        partner_id?: string;
      };
    };

    if (!type || !tx_hash || !wallet_address || !data?.company_name || !data?.description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, tx_hash, wallet_address, data.company_name, data.description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const walletLower = wallet_address.toLowerCase();
    const now = new Date().toISOString();

    if (type === "listing") {
      // 1. Insert partner
      const { data: newPartner, error: partnerErr } = await supabase
        .from("partners")
        .insert({
          name: data.company_name,
          description: data.description,
          website: data.website || null,
          categories: data.categories || [],
          region: data.region || "Global",
          logo_url: data.logo_url || null,
          wallet_address: walletLower,
          payment_status: "confirmed",
          payment_id: tx_hash,
          featured: false,
        })
        .select("id")
        .single();

      if (partnerErr) {
        console.error("Partner insert error:", partnerErr);
        throw partnerErr;
      }

      // 2. Insert submission record for payment tracking
      const { error: subErr } = await supabase.from("submissions").insert({
        company_name: data.company_name,
        contact_email: data.contact_email || "not-provided@usdc.directory",
        website: data.website || "https://usdc.directory",
        description: data.description,
        categories: data.categories || [],
        region: data.region || "Global",
        logo_url: data.logo_url || null,
        wallet_address: walletLower,
        payment_id: tx_hash,
        payment_status: "confirmed",
        status: "approved",
        partner_id: newPartner.id,
      });

      if (subErr) console.error("Submission insert error:", subErr);

      return new Response(
        JSON.stringify({ success: true, partner_id: newPartner.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "update") {
      const partnerId = data.partner_id;
      if (!partnerId) {
        return new Response(
          JSON.stringify({ error: "partner_id required for updates" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // 1. Update partner
      const { error: updateErr } = await supabase
        .from("partners")
        .update({
          description: data.description,
          website: data.website || null,
          categories: data.categories || [],
          region: data.region || "Global",
          updated_at: now,
        })
        .eq("id", partnerId);

      if (updateErr) {
        console.error("Partner update error:", updateErr);
        throw updateErr;
      }

      // 2. Insert submission for payment tracking
      const { error: subErr } = await supabase.from("submissions").insert({
        company_name: data.company_name,
        contact_email: data.contact_email || "not-provided@usdc.directory",
        website: data.website || "https://usdc.directory",
        description: data.description,
        categories: data.categories || [],
        region: data.region || "Global",
        wallet_address: walletLower,
        payment_id: tx_hash,
        payment_status: "confirmed",
        status: "approved",
        partner_id: partnerId,
      });

      if (subErr) console.error("Submission insert error:", subErr);

      return new Response(
        JSON.stringify({ success: true, partner_id: partnerId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Use 'listing' or 'update'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("submit-listing error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
