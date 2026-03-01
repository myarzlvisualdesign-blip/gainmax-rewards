import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ExternalLink, Wallet } from "lucide-react";

const paymentMethods = [
  { code: "QRIS2", name: "QRIS", group: "E-Wallet" },
  { code: "BRIVA", name: "BRI VA", group: "Virtual Account" },
  { code: "BCAVA", name: "BCA VA", group: "Virtual Account" },
  { code: "MANDIRIVA", name: "Mandiri VA", group: "Virtual Account" },
  { code: "BNIVA", name: "BNI VA", group: "Virtual Account" },
  { code: "DANA", name: "DANA", group: "E-Wallet" },
  { code: "OVO", name: "OVO", group: "E-Wallet" },
];

const TopupPage = () => {
  const { profile } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const quickAmounts = [50000, 100000, 200000, 500000];

  const handleTopup = async () => {
    const numAmount = Number(amount);
    if (numAmount < 10000) {
      toast.error("Minimum top-up Rp 10.000");
      return;
    }
    if (!selectedMethod) {
      toast.error("Pilih metode pembayaran");
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tripay-create-transaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_type: "topup",
            amount: numAmount,
            method: selectedMethod,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Gagal membuat transaksi");
      }

      setPaymentResult(result.data);
      toast.success("Transaksi top-up berhasil dibuat!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  if (paymentResult) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Pembayaran Top-Up</h2>
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Pembayaran</p>
            <p className="text-3xl font-extrabold text-foreground">
              Rp {(paymentResult.amount + (paymentResult.fee || 0)).toLocaleString("id-ID")}
            </p>
          </div>

          {paymentResult.pay_code && (
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Kode Pembayaran</p>
              <p className="text-xl font-mono font-bold text-foreground tracking-wider">
                {paymentResult.pay_code}
              </p>
            </div>
          )}

          {paymentResult.qr_url && (
            <div className="flex justify-center">
              <img src={paymentResult.qr_url} alt="QR Code" className="w-48 h-48 rounded-xl" />
            </div>
          )}

          {paymentResult.checkout_url && (
            <Button
              onClick={() => window.open(paymentResult.checkout_url, "_blank")}
              className="w-full rounded-full font-bold"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Bayar di Tripay
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Selesaikan pembayaran sebelum{" "}
            {new Date(paymentResult.expired_time * 1000).toLocaleString("id-ID")}
          </p>

          <Button
            variant="outline"
            onClick={() => {
              setPaymentResult(null);
              setAmount("");
              setSelectedMethod(null);
            }}
            className="w-full rounded-full"
          >
            Buat Transaksi Baru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-2 text-lg font-bold text-foreground flex items-center gap-2">
        <Wallet className="h-5 w-5" />
        Top-Up Saldo
      </h2>

      {/* Current balance */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
        <p className="text-2xl font-extrabold text-foreground">
          Rp {(profile?.saldo_bisa_ditarik || 0).toLocaleString("id-ID")}
        </p>
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <Label>Jumlah Top-Up (Rp)</Label>
        <Input
          type="number"
          placeholder="Masukkan jumlah (min. 10.000)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-xl"
          min="10000"
        />
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                amount === String(q)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Rp {q.toLocaleString("id-ID")}
            </button>
          ))}
        </div>
      </div>

      {/* Payment methods */}
      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        {["E-Wallet", "Virtual Account"].map((group) => (
          <div key={group}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {group}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods
                .filter((m) => m.group === group)
                .map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setSelectedMethod(m.code)}
                    className={`rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                      selectedMethod === m.code
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleTopup}
        disabled={loading || !amount || Number(amount) < 10000 || !selectedMethod}
        className="w-full rounded-full font-bold uppercase tracking-wider"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Memproses..." : "Top-Up Sekarang"}
      </Button>
    </div>
  );
};

export default TopupPage;
