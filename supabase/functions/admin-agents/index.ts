import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recoverMessageAddress } from "npm:viem@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-address, x-admin-timestamp, x-admin-signature",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const OWNER_ADDRESS = "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c".toLowerCase();
const MAX_AGE_MS = 5 * 60 * 1000;

async function verifyAdmin(req: Request): Promise<boolean> {
  const address = req.headers.get("x-admin-address")?.toLowerCase();
  const timestamp = req.headers.get("x-admin-timestamp");
  const signature = req.headers.get("x-admin-signature");
  if (!address || !timestamp || !signature || address !== OWNER_ADDRESS) return false;
  const ts = Number(timestamp);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_AGE_MS) return false;
  try {
    const message = `USDC Directory Admin\nTimestamp: ${ts}`;
    const recovered = (await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    })).toLowerCase();
    return recovered === OWNER_ADDRESS;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!(await verifyAdmin(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: payments }, { data: boosts }] = await Promise.all([
    supabase.from("agent_api_payments").select("*").order("paid_at", { ascending: false }).limit(500),
    supabase.from("agent_boosts").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const paymentsList = payments || [];
  const boostsList = boosts || [];
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const sumUsdc = (rows: any[]) => rows.reduce((acc, r) => acc + Number(r.amount_usdc || 0), 0) / 1_000_000;

  const summary = {
    callsTotal: paymentsList.length,
    callsToday: paymentsList.filter((p: any) => new Date(p.paid_at).getTime() >= dayAgo).length,
    revenueApiTotal: sumUsdc(paymentsList),
    revenueApiMonth: sumUsdc(paymentsList.filter((p: any) => new Date(p.paid_at).getTime() >= monthStart)),
    boostsActive: boostsList.filter((b: any) => new Date(b.expires_at).getTime() > now).length,
    revenueBoostsTotal: sumUsdc(boostsList),
  };

  return new Response(JSON.stringify({ payments: paymentsList, boosts: boostsList, summary }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
