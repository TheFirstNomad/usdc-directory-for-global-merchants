import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key) => {
      result[key] = obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])
        ? sortObject(obj[key] as Record<string, unknown>)
        : obj[key];
      return result;
    }, {});
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
    if (!ipnSecret) {
      console.error("NOWPAYMENTS_IPN_SECRET not configured");
      return new Response("Server error", { status: 500 });
    }

    const body = await req.json();
    const receivedSig = req.headers.get("x-nowpayments-sig");

    if (!receivedSig) {
      console.error("Missing signature header");
      return new Response("Missing signature", { status: 401 });
    }

    // Verify HMAC signature
    const sorted = sortObject(body);
    const hmac = createHmac("sha512", ipnSecret);
    hmac.update(JSON.stringify(sorted));
    const expectedSig = hmac.digest("hex");

    if (receivedSig !== expectedSig) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const { payment_status, order_id, pay_address, payment_id, actually_paid, outcome_amount } = body;

    console.log(`Webhook received: status=${payment_status}, order=${order_id}, paid=${actually_paid}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const headers = {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    };

    // Update submission payment status
    await fetch(`${supabaseUrl}/rest/v1/submissions?id=eq.${order_id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        payment_status,
        payment_id: String(payment_id),
      }),
    });

    // Only process on confirmed/finished payment
    if (payment_status === "finished" || payment_status === "confirmed") {
      // Fetch the submission
      const subRes = await fetch(
        `${supabaseUrl}/rest/v1/submissions?id=eq.${order_id}&select=*`,
        { headers }
      );
      const submissions = await subRes.json();
      
      if (!submissions || submissions.length === 0) {
        console.error("Submission not found:", order_id);
        return new Response("OK", { status: 200 });
      }

      const sub = submissions[0];

      if (sub.partner_id) {
        // This is an update - apply changes to existing partner
        await fetch(`${supabaseUrl}/rest/v1/partners?id=eq.${sub.partner_id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            description: sub.description,
            website: sub.website,
            categories: sub.categories,
            region: sub.region,
            payment_status: "completed",
            updated_at: new Date().toISOString(),
          }),
        });

        // Mark submission as completed
        await fetch(`${supabaseUrl}/rest/v1/submissions?id=eq.${order_id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "completed", payment_status: "finished" }),
        });
      } else {
      // This is a new listing - create partner
        const isAIAgent = sub.contact_email === "ai-agent@autonomous" ||
          (sub.categories && sub.categories.includes("AI Agents"));

        const partnerPayload = {
          name: sub.company_name,
          description: sub.description,
          website: sub.website,
          categories: isAIAgent
            ? (sub.categories?.includes("AI Agents") ? sub.categories : [...(sub.categories || []), "AI Agents"])
            : sub.categories,
          region: sub.region || "Global",
          wallet_address: sub.wallet_address,
          logo_url: sub.logo_url || null,
          logo_emoji: isAIAgent ? "🤖" : "🏢",
          networks: sub.networks || [],
          payment_status: "completed",
          payment_id: String(payment_id),
          featured: false,
          usdc_score: 0,
          use_cases: sub.networks || [],
        };

        await fetch(`${supabaseUrl}/rest/v1/partners`, {
          method: "POST",
          headers,
          body: JSON.stringify(partnerPayload),
        });

        // Mark submission as completed
        await fetch(`${supabaseUrl}/rest/v1/submissions?id=eq.${order_id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "completed", payment_status: "finished" }),
        });
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
});
