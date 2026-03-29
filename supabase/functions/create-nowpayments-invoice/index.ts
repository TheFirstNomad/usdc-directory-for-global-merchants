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
    const { type, wallet_address, submission_data } = await req.json();

    if (!wallet_address || typeof wallet_address !== "string") {
      return new Response(JSON.stringify({ error: "wallet_address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!type || !["listing", "update"].includes(type)) {
      return new Response(JSON.stringify({ error: "type must be listing or update" }), {
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

    // Store submission data in Supabase first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const amount = type === "listing" ? 10 : 5;

    // Create the submission record
    const submissionPayload: Record<string, unknown> = {
      wallet_address: wallet_address.toLowerCase(),
      payment_status: "awaiting_payment",
      ...(type === "listing"
        ? {
            company_name: submission_data.company_name,
            contact_email: submission_data.contact_email || `${wallet_address.slice(0, 8)}@wallet`,
            website: submission_data.website,
            description: submission_data.description,
            categories: submission_data.categories,
            region: submission_data.region,
            networks: submission_data.networks || [],
            logo_url: submission_data.logo_url || null,
          }
        : {
            company_name: submission_data.company_name || "Update",
            contact_email: `update-${submission_data.partner_id}@wallet`,
            website: submission_data.website,
            description: submission_data.description,
            categories: submission_data.categories,
            region: submission_data.region,
            partner_id: submission_data.partner_id,
            status: "update_pending",
          }),
    };

    const subRes = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(submissionPayload),
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
        price_amount: amount,
        price_currency: "usd",
        pay_currency: "usdcbase",
        order_id: orderId,
        order_description: type === "listing"
          ? `USDC Directory - New Listing: ${submission_data.company_name}`
          : `USDC Directory - Update Listing`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-webhook`,
        success_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit?success=true&order=${orderId}`,
        cancel_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit?cancelled=true`,
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
        amount,
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
