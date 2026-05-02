/**
 * submit-listing – Persists a new listing or update after on-chain payment.
 *
 * POST body:
 *   { type: "listing"|"update", tx_hash, wallet_address, data: { company_name, description, website, categories, region, logo_url, contact_email?, partner_id? } }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CATEGORIES = new Set([
  "AI & Agentic Platforms","Bridge Apps","Bridge SDKs","DeFi Apps","Digital Wallets",
  "Due Diligence & Advisory","Ecommerce","Exchanges","Fintechs","Gaming",
  "Infrastructure Providers","Market Makers","Marketplaces","Neobanks","OTC Desks",
  "Payments","PR & Communications","Remittances","Security","AI Agents",
]);
const ALLOWED_REGIONS = new Set([
  "Global","Africa","Europe","Asia","North America","South America","Other",
]);

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const WALLET_RE = /^0x[0-9a-fA-F]{40}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(body: any): { ok: true; out: any } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const { type, tx_hash, wallet_address, data } = body;

  if (type !== "listing" && type !== "update") return { ok: false, error: "type must be 'listing' or 'update'" };
  if (typeof tx_hash !== "string" || !TX_HASH_RE.test(tx_hash)) return { ok: false, error: "Invalid tx_hash" };
  if (typeof wallet_address !== "string" || !WALLET_RE.test(wallet_address)) return { ok: false, error: "Invalid wallet_address" };
  if (!data || typeof data !== "object") return { ok: false, error: "Missing data" };

  const company_name = String(data.company_name ?? "").trim();
  const description = String(data.description ?? "").trim();
  if (company_name.length < 1 || company_name.length > 80) return { ok: false, error: "company_name 1-80 chars" };
  if (description.length < 1 || description.length > 500) return { ok: false, error: "description 1-500 chars" };

  let website: string | null = null;
  if (data.website) {
    const w = String(data.website).trim();
    if (w.length > 200 || !isValidUrl(w)) return { ok: false, error: "Invalid website URL" };
    website = w;
  }

  let contact_email: string | null = null;
  if (data.contact_email) {
    const e = String(data.contact_email).trim();
    if (e.length > 255 || !EMAIL_RE.test(e)) return { ok: false, error: "Invalid contact_email" };
    contact_email = e;
  }

  const categories: string[] = Array.isArray(data.categories) ? data.categories.map(String) : [];
  if (categories.length > 5) return { ok: false, error: "Max 5 categories" };
  for (const c of categories) {
    if (!ALLOWED_CATEGORIES.has(c)) return { ok: false, error: `Invalid category: ${c}` };
  }

  const region = data.region ? String(data.region) : "Global";
  if (!ALLOWED_REGIONS.has(region)) return { ok: false, error: `Invalid region: ${region}` };

  let logo_url: string | null = null;
  if (data.logo_url) {
    const l = String(data.logo_url).trim();
    if (l.length > 500 || !isValidUrl(l)) return { ok: false, error: "Invalid logo_url" };
    logo_url = l;
  }

  const partner_id = data.partner_id ? String(data.partner_id) : undefined;
  if (type === "update" && !partner_id) return { ok: false, error: "partner_id required for updates" };

  return {
    ok: true,
    out: { type, tx_hash, wallet_address, company_name, description, website, contact_email, categories, region, logo_url, partner_id },
  };
}

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
    const v = validate(body);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { type, tx_hash, wallet_address, company_name, description, website, contact_email, categories, region, logo_url, partner_id } = v.out;
    const walletLower = wallet_address.toLowerCase();
    const now = new Date().toISOString();

    // Reject duplicate tx_hash to prevent replay
    const { data: dup } = await supabase
      .from("submissions")
      .select("id")
      .eq("payment_id", tx_hash)
      .maybeSingle();
    if (dup) {
      return new Response(JSON.stringify({ error: "Transaction hash already used" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "listing") {
      const { data: newPartner, error: partnerErr } = await supabase
        .from("partners")
        .insert({
          name: company_name,
          description,
          website,
          categories,
          region,
          logo_url,
          wallet_address: walletLower,
          payment_status: "pending_review",
          payment_id: tx_hash,
          featured: false,
        })
        .select("id")
        .single();

      if (partnerErr) {
        console.error("Partner insert error:", partnerErr);
        throw partnerErr;
      }

      const { error: subErr } = await supabase.from("submissions").insert({
        company_name,
        contact_email: contact_email || "not-provided@usdc.directory",
        website: website || "https://usdc.directory",
        description,
        categories,
        region,
        logo_url,
        wallet_address: walletLower,
        payment_id: tx_hash,
        payment_status: "confirmed",
        status: "pending",
        partner_id: newPartner.id,
      });
      if (subErr) console.error("Submission insert error:", subErr);

      return new Response(
        JSON.stringify({ success: true, partner_id: newPartner.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // type === "update": verify ownership before updating
    const { data: existing, error: loadErr } = await supabase
      .from("partners")
      .select("id, wallet_address")
      .eq("id", partner_id!)
      .maybeSingle();

    if (loadErr || !existing) {
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((existing.wallet_address || "").toLowerCase() !== walletLower) {
      return new Response(JSON.stringify({ error: "Not the owner of this listing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await supabase
      .from("partners")
      .update({
        description,
        website,
        categories,
        region,
        updated_at: now,
      })
      .eq("id", partner_id!);

    if (updateErr) {
      console.error("Partner update error:", updateErr);
      throw updateErr;
    }

    const { error: subErr } = await supabase.from("submissions").insert({
      company_name,
      contact_email: contact_email || "not-provided@usdc.directory",
      website: website || "https://usdc.directory",
      description,
      categories,
      region,
      wallet_address: walletLower,
      payment_id: tx_hash,
      payment_status: "confirmed",
      status: "approved",
      partner_id: partner_id!,
    });
    if (subErr) console.error("Submission insert error:", subErr);

    return new Response(
      JSON.stringify({ success: true, partner_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("submit-listing error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
