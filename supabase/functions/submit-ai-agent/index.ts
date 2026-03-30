import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { agent_name, wallet_address, description, logo_url } = body;

    // Validate inputs
    if (!agent_name || typeof agent_name !== "string" || agent_name.trim().length === 0 || agent_name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "agent_name is required (max 100 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.trim().length === 0 || wallet_address.trim().length > 256) {
      return new Response(JSON.stringify({ error: "wallet_address is required (max 256 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!description || typeof description !== "string" || description.trim().length === 0 || description.trim().length > 300) {
      return new Response(JSON.stringify({ error: "description is required (max 300 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Payment gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const headers = {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation",
    };

    // Create submission
    const subRes = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        company_name: agent_name.trim(),
        contact_email: "ai-agent@autonomous",
        website: "",
        description: description.trim(),
        categories: ["AI Agents"],
        region: "Global",
        networks: [],
        wallet_address: wallet_address.trim().toLowerCase(),
        logo_url: logo_url || null,
        payment_status: "awaiting_payment",
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.error("Submission insert failed:", err);
      return new Response(JSON.stringify({ error: "Failed to create submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [submission] = await subRes.json();
    const orderId = submission.id;

    // Create NOWPayments invoice
    const invoiceRes = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: 10,
        price_currency: "usd",
        pay_currency: "usdcbase",
        order_id: orderId,
        order_description: `USDC Directory - AI Agent: ${agent_name.trim()}`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-webhook`,
        success_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit/ai-agent?success=true&order=${orderId}`,
        cancel_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit/ai-agent`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    if (!invoiceRes.ok) {
      const err = await invoiceRes.text();
      console.error("NOWPayments invoice creation failed:", err);
      return new Response(JSON.stringify({ error: "Failed to create payment invoice" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoice = await invoiceRes.json();

    // Update submission with payment_id
    await fetch(`${supabaseUrl}/rest/v1/submissions?id=eq.${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ payment_id: String(invoice.id) }),
    });

    return new Response(
      JSON.stringify({
        invoice_url: invoice.invoice_url,
        invoice_id: invoice.id,
        order_id: orderId,
        amount: 10,
      }),
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
