import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { payment_type, method, membership_level, amount } = body;

    // Validate input
    if (!payment_type || !method) {
      return new Response(
        JSON.stringify({ error: "payment_type and method are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine amount based on type
    let paymentAmount: number;
    let orderName: string;

    if (payment_type === "membership") {
      const membershipPrices: Record<string, number> = {
        silver: 150000,
        gold: 350000,
        diamond: 750000,
      };
      if (!membership_level || !membershipPrices[membership_level]) {
        return new Response(
          JSON.stringify({ error: "Invalid membership level" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      paymentAmount = membershipPrices[membership_level];
      orderName = `Membership ${membership_level.charAt(0).toUpperCase() + membership_level.slice(1)} - 30 Hari`;
    } else if (payment_type === "topup") {
      if (!amount || amount < 10000) {
        return new Response(
          JSON.stringify({ error: "Minimum top-up Rp 10.000" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      paymentAmount = amount;
      orderName = `Top Up Saldo Rp ${paymentAmount.toLocaleString("id-ID")}`;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payment_type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate merchant ref
    const merchantRef = `GNM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Tripay credentials
    const apiKey = Deno.env.get("TRIPAY_API_KEY")!;
    const privateKey = Deno.env.get("TRIPAY_PRIVATE_KEY")!;
    const merchantCode = Deno.env.get("TRIPAY_MERCHANT_CODE")!;

    // Create signature: HMAC-SHA256(merchantCode + merchantRef + amount, privateKey)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(privateKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureData = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(merchantCode + merchantRef + paymentAmount)
    );
    const signature = Array.from(new Uint8Array(signatureData))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiredTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    // Callback URL = this edge function's sibling
    const callbackUrl = `${supabaseUrl}/functions/v1/tripay-callback`;

    const tripayPayload = {
      method,
      merchant_ref: merchantRef,
      amount: paymentAmount,
      customer_name: profile.name || "Member",
      customer_email: profile.email,
      order_items: [
        {
          name: orderName,
          price: paymentAmount,
          quantity: 1,
        },
      ],
      callback_url: callbackUrl,
      return_url: `${req.headers.get("origin") || "https://gainmax-rewards.lovable.app"}/dashboard`,
      expired_time: expiredTime,
      signature,
    };

    // Call Tripay API (sandbox for now - change to production URL when ready)
    const tripayRes = await fetch(
      "https://tripay.co.id/api-sandbox/transaction/create",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tripayPayload),
      }
    );

    const tripayData = await tripayRes.json();

    if (!tripayData.success) {
      console.error("Tripay error:", tripayData);
      return new Response(
        JSON.stringify({
          error: tripayData.message || "Failed to create transaction",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save to payments table using service role
    const { error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        payment_type,
        amount: paymentAmount,
        fee: tripayData.data.total_fee || 0,
        total_amount: tripayData.data.amount || paymentAmount,
        merchant_ref: merchantRef,
        tripay_reference: tripayData.data.reference,
        payment_method: method,
        payment_url: tripayData.data.pay_url,
        checkout_url: tripayData.data.checkout_url,
        pay_code: String(tripayData.data.pay_code || ""),
        status: "UNPAID",
        membership_level: payment_type === "membership" ? membership_level : null,
        expired_time: expiredTime,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: tripayData.data.reference,
          merchant_ref: merchantRef,
          checkout_url: tripayData.data.checkout_url,
          pay_code: tripayData.data.pay_code,
          pay_url: tripayData.data.pay_url,
          amount: paymentAmount,
          fee: tripayData.data.total_fee,
          payment_method: method,
          expired_time: expiredTime,
          qr_url: tripayData.data.qr_url,
          qr_string: tripayData.data.qr_string,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
