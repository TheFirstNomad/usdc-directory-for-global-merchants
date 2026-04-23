// Edge function: fetches a target URL server-side and reports whether the
// returned HTML contains a module script tag (indicating React app will mount).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  try {
    const { url } = await req.json().catch(() => ({ url: "https://usdc.directory" }));
    const target = url || "https://usdc.directory";

    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (DeploymentStatusBot)" },
      redirect: "follow",
    });
    const html = await res.text();
    const durationMs = Date.now() - startedAt;

    const scriptMatches = Array.from(
      html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    ).map((m) => m[1]);
    const moduleScripts = scriptMatches.filter((s) =>
      /\/assets\/.+\.js$/.test(s) || /type=["']module["']/i.test(html.split(s)[0].slice(-200) + s)
    );
    const hasRoot = /<div\s+id=["']root["']\s*>/i.test(html);
    const hasModuleScript = /<script[^>]*type=["']module["'][^>]*src=/i.test(html);

    const mountSuccess = res.ok && hasRoot && hasModuleScript;
    let error: string | null = null;
    if (!res.ok) error = `HTTP ${res.status} ${res.statusText}`;
    else if (!hasRoot) error = "Missing <div id=\"root\"> in HTML";
    else if (!hasModuleScript) error = "No <script type=\"module\"> tag found — React bundle is not loaded";

    return new Response(
      JSON.stringify({
        url: target,
        checkedAt: new Date().toISOString(),
        durationMs,
        statusCode: res.status,
        mountSuccess,
        hasRoot,
        hasModuleScript,
        scriptCount: scriptMatches.length,
        scripts: scriptMatches.slice(0, 10),
        htmlBytes: html.length,
        error,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        mountSuccess: false,
        error: e instanceof Error ? e.message : String(e),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
