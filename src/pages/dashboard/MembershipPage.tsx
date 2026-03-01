import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Check, Loader2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const membershipPlans = [
  {
    level: "silver",
    name: "Silver",
    price: 150000,
    features: ["Akses affiliate marketplace", "Komisi referral 5%", "Withdraw saldo"],
    color: "from-[hsl(var(--gainmax-silver))] to-[hsl(var(--muted))]",
    border: "border-[hsl(var(--gainmax-silver))]",
  },
  {
    level: "gold",
    name: "Gold",
    price: 350000,
    features: ["Semua fitur Silver", "Komisi referral 10%", "Priority support", "Bonus bulanan"],
    color: "from-[hsl(var(--gainmax-gold))] to-[hsl(var(--gainmax-gold)/0.6)]",
    border: "border-[hsl(var(--gainmax-gold))]",
    popular: true,
  },
  {
    level: "diamond",
    name: "Diamond",
    price: 750000,
    features: ["Semua fitur Gold", "Komisi referral 15%", "Exclusive deals", "VIP support", "Early access"],
    color: "from-primary to-primary/70",
    border: "border-primary",
  },
];

const paymentMethods = [
  { code: "QRIS2", name: "QRIS", group: "E-Wallet" },
  { code: "BRIVA", name: "BRI VA", group: "Virtual Account" },
  { code: "BCAVA", name: "BCA VA", group: "Virtual Account" },
  { code: "MANDIRIVA", name: "Mandiri VA", group: "Virtual Account" },
  { code: "BNIVA", name: "BNI VA", group: "Virtual Account" },
  { code: "PERMATAVA", name: "Permata VA", group: "Virtual Account" },
  { code: "DANA", name: "DANA", group: "E-Wallet" },
  { code: "OVO", name: "OVO", group: "E-Wallet" },
  { code: "SHOPEEPAY", name: "ShopeePay", group: "E-Wallet" },
];

const MembershipPage = () => {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "method" | "result">("plan");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleSelectPlan = (level: string) => {
    setSelectedPlan(level);
    setStep("method");
  };

  const handlePay = async () => {
    if (!selectedPlan || !selectedMethod) return;
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
            payment_type: "membership",
            membership_level: selectedPlan,
            method: selectedMethod,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Gagal membuat transaksi");
      }

      setPaymentResult(result.data);
      setStep("result");
      toast.success("Transaksi berhasil dibuat!");
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const membershipActive =
    profile?.membership_level !== "none" &&
    profile?.membership_expired_at &&
    new Date(profile.membership_expired_at) > new Date();

  if (step === "result" && paymentResult) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Pembayaran</h2>
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
              setStep("plan");
              setPaymentResult(null);
              setSelectedPlan(null);
              setSelectedMethod(null);
            }}
            className="w-full rounded-full"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  if (step === "method") {
    const plan = membershipPlans.find((p) => p.level === selectedPlan);
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Pilih Metode Pembayaran</h2>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Membership {plan?.name}</p>
          <p className="text-xl font-bold text-foreground">
            Rp {plan?.price.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="space-y-2">
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("plan");
              setSelectedMethod(null);
            }}
            className="flex-1 rounded-full"
          >
            Kembali
          </Button>
          <Button
            onClick={handlePay}
            disabled={!selectedMethod || loading}
            className="flex-1 rounded-full font-bold"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Memproses..." : "Bayar Sekarang"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Membership</h2>

      {membershipActive && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            ✅ Membership {profile?.membership_level?.toUpperCase()} aktif
          </p>
          <p className="text-xs text-primary/70">
            Berlaku sampai{" "}
            {new Date(profile!.membership_expired_at!).toLocaleDateString("id-ID")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {membershipPlans.map((plan, i) => (
          <motion.div
            key={plan.level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative rounded-2xl border-2 ${plan.border} bg-card p-5 shadow-sm`}
          >
            {plan.popular && (
              <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                POPULER
              </span>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              </div>
              <p className="text-xl font-extrabold text-foreground">
                Rp {plan.price.toLocaleString("id-ID")}
                <span className="text-xs font-normal text-muted-foreground">/30 hari</span>
              </p>
            </div>
            <ul className="mb-4 space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleSelectPlan(plan.level)}
              className="w-full rounded-full font-bold"
              variant={plan.popular ? "default" : "outline"}
            >
              Pilih {plan.name}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MembershipPage;
