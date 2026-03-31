import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-wallet-address, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OWNER_WALLET = "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c".toLowerCase();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const wallet = req.headers.get("x-wallet-address")?.toLowerCase();
  if (!wallet || wallet !== OWNER_WALLET) {
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

      // If enabling featured, check count doesn't exceed 4
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
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
