/**
 * circle-proxy – Forwards requests to https://api.circle.com on behalf of
 * the browser, bypassing CORS restrictions the Circle API imposes on
 * custom domains.
 *
 * Accepts:
 *   POST /circle-proxy
 *   Body: { method: "GET"|"POST", path: string, body?: object, headers?: object }
 *
 * The function injects the stored ARC_KIT_KEY as the Bearer token and
 * forwards the request server-side.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CIRCLE_BASE = "https://api.circle.com";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    if (!path || !path.startsWith("/")) {
      return new Response(
        JSON.stringify({ error: "Invalid path — must start with /" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only allow stablecoinKits endpoints
    if (!path.startsWith("/v1/stablecoinKits/")) {
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

    console.log(`[circle-proxy] ${method} ${targetUrl}`);

    const upstream = await fetch(targetUrl, fetchInit);
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
