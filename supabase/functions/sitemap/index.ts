import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE = "https://usdc.directory";

const STATIC_PATHS = [
  "/", "/about", "/submit", "/submit/ai-agent", "/insights",
  "/acquire", "/license", "/map", "/ai-agents", "/api-docs", "/swap", "/bridge",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: partners } = await supabase
      .from("partners_public")
      .select("id, updated_at, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);

    const now = new Date().toISOString();
    const urls: string[] = [];

    for (const p of STATIC_PATHS) {
      urls.push(`<url><loc>${SITE}${p}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>${p === "/" ? "1.0" : "0.7"}</priority></url>`);
    }
    for (const row of partners || []) {
      const lastmod = (row as any).updated_at || (row as any).created_at || now;
      urls.push(`<url><loc>${SITE}/merchant/${(row as any).id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("sitemap error", err);
    return new Response("<?xml version=\"1.0\"?><urlset/>", {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});
