import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const walletAddress = formData.get("wallet_address") as string | null;

    if (!file || !walletAddress) {
      return new Response(JSON.stringify({ error: "file and wallet_address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Only image files allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${walletAddress.toLowerCase()}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/logos/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: arrayBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("Upload failed:", err);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/logos/${fileName}`;

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
