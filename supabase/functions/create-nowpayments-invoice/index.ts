import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation helpers
function isValidString(val: unknown, maxLen: number): val is string {
  return typeof val === "string" && val.trim().length > 0 && val.trim().length <= maxLen;
}

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function isValidUrl(val: string): boolean {
  try {
    const url = new URL(val);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isStringArray(val: unknown, maxItems = 10): val is string[] {
  return Array.isArray(val) && val.length <= maxItems && val.every(v => typeof v === "string" && v.length <= 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, wallet_address, submission_data } = await req.json();

    if (!wallet_address || typeof wallet_address !== "string" || wallet_address.trim().length === 0 || wallet_address.trim().length > 256) {
      return new Response(JSON.stringify({ error: "wallet_address is required (max 256 chars)" }), {
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

    if (!submission_data || typeof submission_data !== "object") {
      return new Response(JSON.stringify({ error: "submission_data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate submission_data fields based on type
    if (type === "listing") {
      if (!isValidString(submission_data.company_name, 200)) {
        return new Response(JSON.stringify({ error: "company_name is required (max 200 chars)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isValidString(submission_data.description, 2000)) {
        return new Response(JSON.stringify({ error: "description is required (max 2000 chars)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isValidString(submission_data.website, 500) || !isValidUrl(submission_data.website)) {
        return new Response(JSON.stringify({ error: "A valid website URL is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.contact_email && !isValidEmail(submission_data.contact_email)) {
        return new Response(JSON.stringify({ error: "Invalid contact email format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.categories && !isStringArray(submission_data.categories)) {
        return new Response(JSON.stringify({ error: "categories must be an array of strings (max 10)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.region && !isValidString(submission_data.region, 100)) {
        return new Response(JSON.stringify({ error: "region must be a string (max 100 chars)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.networks && !isStringArray(submission_data.networks)) {
        return new Response(JSON.stringify({ error: "networks must be an array of strings (max 10)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.logo_url && (!isValidString(submission_data.logo_url, 1000) || !isValidUrl(submission_data.logo_url))) {
        return new Response(JSON.stringify({ error: "logo_url must be a valid URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // type === "update"
      if (!submission_data.partner_id || typeof submission_data.partner_id !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission_data.partner_id)) {
        return new Response(JSON.stringify({ error: "A valid partner_id (UUID) is required for updates" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.description && !isValidString(submission_data.description, 2000)) {
        return new Response(JSON.stringify({ error: "description must be max 2000 chars" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (submission_data.website && (!isValidString(submission_data.website, 500) || !isValidUrl(submission_data.website))) {
        return new Response(JSON.stringify({ error: "website must be a valid URL" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    const amount = type === "listing" ? 10 : 5;

    // Create the submission record
    const submissionPayload: Record<string, unknown> = {
      wallet_address: wallet_address.toLowerCase(),
      payment_status: "awaiting_payment",
      ...(type === "listing"
        ? {
            company_name: submission_data.company_name.trim(),
            contact_email: submission_data.contact_email || `${wallet_address.slice(0, 8)}@wallet`,
            website: submission_data.website.trim(),
            description: submission_data.description.trim(),
            categories: submission_data.categories || [],
            region: submission_data.region || "Global",
            networks: submission_data.networks || [],
            logo_url: submission_data.logo_url || null,
          }
        : {
            company_name: submission_data.company_name?.trim() || "Update",
            contact_email: `update-${submission_data.partner_id}@wallet`,
            website: submission_data.website?.trim() || "",
            description: submission_data.description?.trim() || "",
            categories: submission_data.categories || [],
            region: submission_data.region || "Global",
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
      console.error("Submission insert failed:", await subRes.text());
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
          ? `USDC Directory - New Listing: ${submission_data.company_name.trim().slice(0, 100)}`
          : `USDC Directory - Update Listing`,
        ipn_callback_url: `${supabaseUrl}/functions/v1/nowpayments-webhook`,
        success_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit?success=true&order=${orderId}`,
        cancel_url: `${Deno.env.get("SITE_URL") || "https://usdc-directory.lovable.app"}/submit?cancelled=true`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    });

    if (!invoiceRes.ok) {
      console.error("NOWPayments invoice creation failed:", await invoiceRes.text());
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
