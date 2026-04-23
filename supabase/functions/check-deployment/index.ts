// Fetches a target URL server-side, checks whether the HTML mounts a React app,
// and persists the result to public.deployment_checks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  let target = "https://usdc.directory";

  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.url && typeof body.url === "string") target = body.url;
    }

    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (DeploymentStatusBot)" },
      redirect: "follow",
    });
    const html = await res.text();
    const durationMs = Date.now() - startedAt;

    const scriptMatches = Array.from(
      html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    ).map((m) => m[1]);
    const hasRoot = /<div\s+id=["']root["']\s*>/i.test(html);
    const hasModuleScript = /<script[^>]*type=["']module["'][^>]*src=/i.test(html);
    const mountSuccess = res.ok && hasRoot && hasModuleScript;

    let error: string | null = null;
    if (!res.ok) error = `HTTP ${res.status} ${res.statusText}`;
    else if (!hasRoot) error = 'Missing <div id="root"> in HTML';
    else if (!hasModuleScript) error = "No module script tag found — React bundle not loaded";

    const record = {
      url: target,
      status_code: res.status,
      mount_success: mountSuccess,
      has_root: hasRoot,
      has_module_script: hasModuleScript,
      script_count: scriptMatches.length,
      html_bytes: html.length,
      duration_ms: durationMs,
      error,
    };

    // Persist to DB (service role bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error: insertError } = await supabase.from("deployment_checks").insert(record);
    if (insertError) console.error("Insert failed:", insertError.message);

    return new Response(
      JSON.stringify({
        ...record,
        checkedAt: new Date().toISOString(),
        scripts: scriptMatches.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
      await supabase.from("deployment_checks").insert({
        url: target,
        mount_success: false,
        duration_ms: Date.now() - startedAt,
        error: message,
      });
    } catch (_) { /* swallow */ }

    return new Response(
      JSON.stringify({
        url: target,
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        mountSuccess: false,
        error: message,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
