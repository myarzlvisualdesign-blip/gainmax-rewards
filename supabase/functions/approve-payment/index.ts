import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleData) throw new Error("Forbidden: Admin only");

    const { payment_id, action, notes } = await req.json();
    if (!payment_id || !action) throw new Error("payment_id and action required");
    if (!["approve", "reject"].includes(action)) throw new Error("action must be approve or reject");

    // Get payment
    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();
    if (payErr || !payment) throw new Error("Payment not found");
    if (payment.status !== "PENDING") throw new Error("Payment is not PENDING");

    if (action === "reject") {
      await supabaseAdmin.from("payments").update({
        status: "DITOLAK",
        admin_notes: notes || null,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      }).eq("id", payment_id);

      // Notify
      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        type: "payment_rejected",
        title: "Pembayaran Ditolak",
        message: `Pembayaran dari user ${payment.user_id} ditolak.`,
        reference_id: payment_id,
      });

      return new Response(JSON.stringify({ success: true, status: "DITOLAK" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // APPROVE flow
    // 1. Update payment
    await supabaseAdmin.from("payments").update({
      status: "BERHASIL",
      admin_notes: notes || null,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      paid_at: new Date().toISOString(),
    }).eq("id", payment_id);

    // 2. Get membership package for commission info
    const { data: pkg } = await supabaseAdmin
      .from("membership_packages")
      .select("*")
      .eq("level", payment.membership_level)
      .single();

    // 3. Activate membership
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await supabaseAdmin.from("profiles").update({
      membership_level: payment.membership_level,
      membership_expired_at: expiry.toISOString(),
    }).eq("user_id", payment.user_id);

    // 4. Handle referral commission
    const { data: payerProfile } = await supabaseAdmin
      .from("profiles")
      .select("parent_id")
      .eq("user_id", payment.user_id)
      .single();

    if (payerProfile?.parent_id && payerProfile.parent_id !== payment.user_id && pkg) {
      const referrerId = payerProfile.parent_id;
      const commission = pkg.referral_commission;

      // Check no duplicate commission for this payment
      const { data: existing } = await supabaseAdmin
        .from("referral_commissions")
        .select("id")
        .eq("payment_id", payment_id)
        .eq("staff_id", referrerId)
        .maybeSingle();

      if (!existing) {
        // Insert commission
        await supabaseAdmin.from("referral_commissions").insert({
          staff_id: referrerId,
          member_id: payment.user_id,
          amount: commission,
          percentage: pkg.commission_percentage,
          status: "cair",
          payment_id: payment_id,
        });

        // Update referrer saldo
        const { data: referrerProfile } = await supabaseAdmin
          .from("profiles")
          .select("saldo_referral, saldo_bisa_ditarik")
          .eq("user_id", referrerId)
          .single();

        if (referrerProfile) {
          await supabaseAdmin.from("profiles").update({
            saldo_referral: referrerProfile.saldo_referral + commission,
            saldo_bisa_ditarik: referrerProfile.saldo_bisa_ditarik + commission,
          }).eq("user_id", referrerId);
        }

        // Promote referrer to staff if still member
        const { data: referrerRole } = await supabaseAdmin.rpc("get_user_role", { _user_id: referrerId });
        if (referrerRole === "member") {
          await supabaseAdmin.from("user_roles").update({ role: "staff" }).eq("user_id", referrerId);
        }

        // Notify about commission
        await supabaseAdmin.from("notifications").insert({
          user_id: user.id,
          type: "referral_commission",
          title: "Komisi Referral",
          message: `Komisi Rp ${commission.toLocaleString()} dari referral berhasil dicairkan.`,
          reference_id: payment_id,
        });
      }
    }

    // Notify about successful payment
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "payment_approved",
      title: "Pembayaran Disetujui",
      message: `Pembayaran membership ${payment.membership_level} dari user berhasil diverifikasi.`,
      reference_id: payment_id,
    });

    return new Response(JSON.stringify({ success: true, status: "BERHASIL" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
