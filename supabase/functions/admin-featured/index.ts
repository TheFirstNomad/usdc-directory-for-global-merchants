import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { recoverMessageAddress } from "npm:viem@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-address, x-admin-timestamp, x-admin-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const OWNER_WALLET = "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c".toLowerCase();
const MAX_AGE_MS = 5 * 60 * 1000;

async function verifyAdmin(req: Request): Promise<boolean> {
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
    const recovered = (await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    })).toLowerCase();
    return recovered === OWNER_WALLET;
  } catch (e) {
    console.error("[admin-featured] recover error:", e);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, logo_url, logo_emoji, website, categories, region, featured, created_at")
        .order("name", { ascending: true });

      if (error) throw error;

      const featuredCount = (data || []).filter((p: any) => p.featured).length;
      return new Response(
        JSON.stringify({ partners: data || [], featuredCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const { partnerId, featured } = await req.json();

      if (!partnerId || typeof featured !== "boolean") {
        return new Response(
          JSON.stringify({ error: "partnerId and featured (boolean) required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (featured) {
        const { count } = await supabase
          .from("partners")
          .select("id", { count: "exact", head: true })
          .eq("featured", true);

        if ((count ?? 0) >= 4) {
          return new Response(
            JSON.stringify({ error: "Maximum 4 featured listings allowed. Unfeature one first." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { error } = await supabase
        .from("partners")
        .update({ featured, updated_at: new Date().toISOString() })
        .eq("id", partnerId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
