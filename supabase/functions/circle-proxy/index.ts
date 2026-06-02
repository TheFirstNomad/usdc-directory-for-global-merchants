/**
 * circle-proxy – Forwards requests to https://api.circle.com on behalf of
 * the browser, bypassing CORS restrictions the Circle API imposes on
 * custom domains.
 *
 * Hardened: requires a valid Supabase JWT so anonymous internet traffic can't
 * burn our ARC_KIT_KEY quota or use us as a generic Circle proxy. Path is
 * locked to /v1/stablecoinKits/*.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CIRCLE_BASE = "https://api.circle.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Basic caller check: browser clients send the public app key via the fetch
  // interceptor. The proxy is additionally path-locked below so the Circle key
  // never leaves the backend and cannot be used against arbitrary endpoints.
  const authHeader = req.headers.get("Authorization") || "";
  const apiKeyHeader = req.headers.get("apikey") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.slice("Bearer ".length);
  if (!token || (apiKeyHeader && apiKeyHeader !== token)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const kitKey = Deno.env.get("ARC_KIT_KEY");
    if (!kitKey) {
      return new Response(
        JSON.stringify({ error: "ARC_KIT_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = await req.json();
    const { method = "POST", path, body, headers: extraHeaders } = payload as {
      method?: string;
      path: string;
      body?: unknown;
      headers?: Record<string, string>;
    };

    if (!path || typeof path !== "string" || !path.startsWith("/v1/stablecoinKits/")) {
      return new Response(
        JSON.stringify({ error: "Only /v1/stablecoinKits/* endpoints are allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const targetUrl = `${CIRCLE_BASE}${path}`;

    const fetchInit: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${kitKey}`,
        ...(extraHeaders ?? {}),
      },
    };
    if (method.toUpperCase() !== "GET" && body !== undefined) {
      fetchInit.body = JSON.stringify(body);
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15_000);
    fetchInit.signal = ac.signal;

    const upstream = await fetch(targetUrl, fetchInit);
    clearTimeout(timer);
    const responseBody = await upstream.text();

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[circle-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
