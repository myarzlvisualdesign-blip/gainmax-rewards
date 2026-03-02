import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";

const WithdrawPage = () => {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);

  const membershipActive = profile?.membership_level !== "none" &&
    profile?.membership_expired_at &&
    new Date(profile.membership_expired_at) > new Date();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!membershipActive) { toast.error("Membership harus aktif untuk withdraw"); return; }
    if (numAmount <= 0 || numAmount > (profile?.saldo_bisa_ditarik || 0)) { toast.error("Jumlah tidak valid atau melebihi saldo"); return; }
    if (!bankName || !accountNumber || !accountHolder) { toast.error("Lengkapi data rekening/e-wallet"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from("withdrawals").insert({
        user_id: user!.id,
        amount: numAmount,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
      } as any);
      if (error) throw error;
      toast.success("Pengajuan withdraw berhasil! Menunggu persetujuan admin.");
      setAmount(""); setBankName(""); setAccountNumber(""); setAccountHolder("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengajukan withdraw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Withdraw</h2>

      <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-4 ${membershipActive ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"}`}>
        {membershipActive ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
        <div>
          <p className={`text-sm font-semibold ${membershipActive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
            {membershipActive ? "Membership Aktif" : "Membership Tidak Aktif"}
          </p>
          <p className={`text-xs ${membershipActive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
            {membershipActive
              ? `Berlaku sampai ${new Date(profile!.membership_expired_at!).toLocaleDateString("id-ID")}`
              : "Aktifkan membership untuk mencairkan saldo"
            }
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">Saldo Bisa Ditarik</p>
        <p className="text-2xl font-extrabold text-foreground">
          Rp {(profile?.saldo_bisa_ditarik || 0).toLocaleString("id-ID")}
        </p>
      </div>

      <form onSubmit={handleWithdraw} className="space-y-4">
        <div className="space-y-2">
          <Label>Bank / E-Wallet</Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih bank/e-wallet" /></SelectTrigger>
            <SelectContent>
              {["BCA", "BRI", "BNI", "Mandiri", "CIMB", "Permata", "DANA", "GoPay", "OVO", "ShopeePay", "LinkAja"].map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>No Rekening / Nomor E-Wallet</Label>
          <Input placeholder="Masukkan nomor" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Nama Pemegang</Label>
          <Input placeholder="Nama sesuai rekening" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Jumlah Penarikan (Rp)</Label>
          <Input type="number" placeholder="Masukkan jumlah" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl" min="0" max={profile?.saldo_bisa_ditarik || 0} />
        </div>
        <Button type="submit" disabled={loading || !membershipActive} className="w-full rounded-full font-bold uppercase tracking-wider">
          {loading ? "Memproses..." : "Ajukan Penarikan"}
        </Button>
      </form>
    </div>
  );
};

export default WithdrawPage;
