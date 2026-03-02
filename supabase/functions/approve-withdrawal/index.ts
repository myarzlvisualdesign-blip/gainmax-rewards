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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: Admin only");

    const { withdrawal_id, action, notes } = await req.json();
    if (!withdrawal_id || !action) throw new Error("withdrawal_id and action required");

    const { data: withdrawal, error: wdErr } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawal_id)
      .single();
    if (wdErr || !withdrawal) throw new Error("Withdrawal not found");
    if (withdrawal.status !== "pending") throw new Error("Withdrawal is not pending");

    if (action === "reject") {
      await supabaseAdmin.from("withdrawals").update({ status: "ditolak" }).eq("id", withdrawal_id);

      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        type: "withdrawal_rejected",
        title: "Withdraw Ditolak",
        message: `Withdraw Rp ${withdrawal.amount.toLocaleString()} ditolak.`,
        reference_id: withdrawal_id,
      });

      return new Response(JSON.stringify({ success: true, status: "ditolak" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve: deduct saldo
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("saldo_bisa_ditarik")
      .eq("user_id", withdrawal.user_id)
      .single();

    if (!prof || prof.saldo_bisa_ditarik < withdrawal.amount) {
      throw new Error("Saldo tidak mencukupi");
    }

    await supabaseAdmin.from("profiles").update({
      saldo_bisa_ditarik: prof.saldo_bisa_ditarik - withdrawal.amount,
    }).eq("user_id", withdrawal.user_id);

    await supabaseAdmin.from("withdrawals").update({ status: "berhasil" }).eq("id", withdrawal_id);

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "withdrawal_approved",
      title: "Withdraw Berhasil",
      message: `Withdraw Rp ${withdrawal.amount.toLocaleString()} berhasil diproses.`,
      reference_id: withdrawal_id,
    });

    return new Response(JSON.stringify({ success: true, status: "berhasil" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
