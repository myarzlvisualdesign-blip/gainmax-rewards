import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";

const WithdrawPage = () => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const membershipActive = profile?.membership_level !== "none" && 
    profile?.membership_expired_at && 
    new Date(profile.membership_expired_at) > new Date();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!membershipActive) {
      toast.error("Membership harus aktif untuk withdraw");
      return;
    }
    if (numAmount <= 0 || numAmount > (profile?.saldo_bisa_ditarik || 0)) {
      toast.error("Jumlah tidak valid atau melebihi saldo");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: user!.id,
        amount: numAmount,
      });
      if (error) throw error;
      toast.success("Pengajuan withdraw berhasil! Menunggu persetujuan admin.");
      setAmount("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengajukan withdraw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Withdraw</h2>

      {/* Status membership */}
      <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-4 ${membershipActive ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        {membershipActive ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <div>
          <p className={`text-sm font-semibold ${membershipActive ? "text-green-700" : "text-red-700"}`}>
            {membershipActive ? "Membership Aktif" : "Membership Tidak Aktif"}
          </p>
          <p className={`text-xs ${membershipActive ? "text-green-600" : "text-red-600"}`}>
            {membershipActive 
              ? `Berlaku sampai ${new Date(profile!.membership_expired_at!).toLocaleDateString("id-ID")}`
              : "Aktifkan membership untuk mencairkan saldo"
            }
          </p>
        </div>
      </div>

      {/* Saldo info */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">Saldo Bisa Ditarik</p>
        <p className="text-2xl font-extrabold text-foreground">
          Rp {(profile?.saldo_bisa_ditarik || 0).toLocaleString("id-ID")}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleWithdraw} className="space-y-4">
        <div className="space-y-2">
          <Label>Jumlah Penarikan (Rp)</Label>
          <Input
            type="number"
            placeholder="Masukkan jumlah"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl"
            min="0"
            max={profile?.saldo_bisa_ditarik || 0}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !membershipActive}
          className="w-full rounded-full font-bold uppercase tracking-wider"
        >
          {loading ? "Memproses..." : "Ajukan Penarikan"}
        </Button>
      </form>
    </div>
  );
};

export default WithdrawPage;
