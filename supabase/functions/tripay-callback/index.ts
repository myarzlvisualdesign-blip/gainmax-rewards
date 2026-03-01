import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-callback-signature, x-callback-event",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateKey = Deno.env.get("TRIPAY_PRIVATE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const json = await req.text();

    // Validate callback signature
    const callbackSignature = req.headers.get("x-callback-signature") || "";
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
      encoder.encode(json)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureData))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (callbackSignature !== expectedSignature) {
      console.error("Invalid signature");
      return new Response(
        JSON.stringify({ success: false, message: "Invalid signature" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate callback event
    const callbackEvent = req.headers.get("x-callback-event") || "";
    if (callbackEvent !== "payment_status") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Unrecognized callback event",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = JSON.parse(json);
    const {
      reference,
      merchant_ref,
      status,
      total_amount,
    } = data;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find payment
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("merchant_ref", merchant_ref)
      .eq("tripay_reference", reference)
      .eq("status", "UNPAID")
      .single();

    if (findError || !payment) {
      console.error("Payment not found:", merchant_ref, reference);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment not found or already processed",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const upperStatus = (status as string).toUpperCase();

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status: upperStatus,
        paid_at: upperStatus === "PAID" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    // If PAID, process the payment
    if (upperStatus === "PAID") {
      if (payment.payment_type === "membership") {
        // Activate membership
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + 30);

        await supabase
          .from("profiles")
          .update({
            membership_level: payment.membership_level,
            membership_expired_at: expiredAt.toISOString(),
          })
          .eq("user_id", payment.user_id);

        console.log(
          `Membership ${payment.membership_level} activated for user ${payment.user_id}`
        );
      } else if (payment.payment_type === "topup") {
        // Add to saldo_bisa_ditarik
        const { data: profile } = await supabase
          .from("profiles")
          .select("saldo_bisa_ditarik")
          .eq("user_id", payment.user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              saldo_bisa_ditarik:
                (profile.saldo_bisa_ditarik || 0) + payment.amount,
            })
            .eq("user_id", payment.user_id);
        }

        console.log(
          `Top-up ${payment.amount} added to user ${payment.user_id}`
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
