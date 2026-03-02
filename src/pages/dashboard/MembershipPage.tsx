import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Check, Loader2, Upload, ArrowLeft, Copy, QrCode, Building2, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface MembershipPackage {
  id: string;
  level: string;
  price: number;
  referral_commission: number;
  commission_percentage: number;
  features: string[];
  is_active: boolean;
}

interface BankAccount {
  name: string;
  number: string;
  type: string;
}

const MembershipPage = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [qrisUrl, setQrisUrl] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<MembershipPackage | null>(null);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "payment" | "upload" | "done">("plan");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [pkgRes, settingsRes] = await Promise.all([
        supabase.from("membership_packages").select("*").eq("is_active", true).order("price"),
        supabase.from("site_settings").select("*"),
      ]);
      if (pkgRes.data) {
        setPackages(pkgRes.data.map(p => ({ ...p, features: Array.isArray(p.features) ? p.features as string[] : [] })));
      }
      if (settingsRes.data) {
        const qris = settingsRes.data.find(s => s.key === "qris_image_url");
        const banks = settingsRes.data.find(s => s.key === "bank_accounts");
        if (qris?.value) setQrisUrl(qris.value);
        if (banks?.value) {
          try { setBankAccounts(JSON.parse(banks.value)); } catch {}
        }
      }
    };
    fetchData();
  }, []);

  const membershipActive =
    profile?.membership_level !== "none" &&
    profile?.membership_expired_at &&
    new Date(profile.membership_expired_at) > new Date();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin!");
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !selectedChannel || !proofFile || !user) return;
    setLoading(true);
    try {
      // Upload proof image
      const ext = proofFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("proof-images").upload(filePath, proofFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("proof-images").getPublicUrl(filePath);

      // Create payment record
      const { error: insertErr } = await supabase.from("payments").insert({
        user_id: user.id,
        payment_type: "membership" as any,
        membership_level: selectedPlan.level as any,
        amount: selectedPlan.price,
        payment_method: selectedChannel,
        payment_channel: selectedChannel,
        proof_image_url: urlData.publicUrl,
        status: "PENDING" as any,
      });
      if (insertErr) throw insertErr;

      setStep("done");
      toast.success("Pembayaran berhasil diajukan! Menunggu verifikasi admin.");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("plan");
    setSelectedPlan(null);
    setSelectedChannel("");
    setProofFile(null);
  };

  // DONE state
  if (step === "done") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Pembayaran Diajukan!</h2>
        <p className="text-sm text-muted-foreground">
          Pembayaran Anda sedang menunggu verifikasi dari admin. Anda akan mendapat notifikasi setelah disetujui.
        </p>
        <Button onClick={resetFlow} variant="outline" className="rounded-full">
          Kembali
        </Button>
      </div>
    );
  }

  // UPLOAD step
  if (step === "upload") {
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("payment")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <h2 className="text-lg font-bold text-foreground">Upload Bukti Transfer</h2>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-1 text-xs text-muted-foreground">Paket: {selectedPlan?.level?.toUpperCase()}</p>
          <p className="text-xl font-extrabold text-foreground">Rp {selectedPlan?.price.toLocaleString("id-ID")}</p>
          <p className="text-xs text-muted-foreground">Via: {selectedChannel}</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 transition-colors hover:border-primary/50"
        >
          {proofFile ? (
            <>
              <img src={URL.createObjectURL(proofFile)} alt="Preview" className="h-40 rounded-xl object-contain" />
              <p className="text-xs text-muted-foreground">{proofFile.name}</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Klik untuk upload bukti transfer</p>
            </>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />

        <Button onClick={handleSubmitPayment} disabled={!proofFile || loading} className="w-full rounded-full font-bold">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Mengirim..." : "Kirim Pembayaran"}
        </Button>
      </div>
    );
  }

  // PAYMENT info step
  if (step === "payment" && selectedPlan) {
    const banks = bankAccounts.filter(b => b.type === "bank");
    const ewallets = bankAccounts.filter(b => b.type === "ewallet");

    return (
      <div className="space-y-4">
        <button onClick={() => { setStep("plan"); setSelectedChannel(""); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <h2 className="text-lg font-bold text-foreground">Transfer Pembayaran</h2>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground">Total yang harus dibayar</p>
          <p className="text-2xl font-extrabold text-foreground">Rp {selectedPlan.price.toLocaleString("id-ID")}</p>
          <p className="text-xs text-primary">Paket {selectedPlan.level.toUpperCase()}</p>
        </div>

        {/* Bank accounts */}
        {banks.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="h-3 w-3" /> Transfer Bank
            </p>
            <div className="space-y-2">
              {banks.map((b) => (
                <button
                  key={b.number}
                  onClick={() => setSelectedChannel(`BANK_${b.name}`)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    selectedChannel === `BANK_${b.name}` ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{b.number}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(b.number); }} className="rounded-lg bg-secondary p-2">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* E-wallets */}
        {ewallets.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Smartphone className="h-3 w-3" /> E-Wallet
            </p>
            <div className="space-y-2">
              {ewallets.map((b) => (
                <button
                  key={`${b.name}-${b.number}`}
                  onClick={() => setSelectedChannel(b.name)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    selectedChannel === b.name ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{b.number}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(b.number); }} className="rounded-lg bg-secondary p-2">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QRIS */}
        {qrisUrl && (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <QrCode className="h-3 w-3" /> QRIS
            </p>
            <button
              onClick={() => setSelectedChannel("QRIS")}
              className={`w-full rounded-xl border p-4 text-center transition-all ${
                selectedChannel === "QRIS" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <img src={qrisUrl} alt="QRIS" className="mx-auto h-48 rounded-lg object-contain" />
              <p className="mt-2 text-xs text-muted-foreground">Scan QRIS di atas</p>
            </button>
          </div>
        )}

        <Button onClick={() => setStep("upload")} disabled={!selectedChannel} className="w-full rounded-full font-bold">
          Lanjut Upload Bukti
        </Button>
      </div>
    );
  }

  // PLAN selection (default)
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Membership</h2>

      {membershipActive && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            ✅ Membership {profile?.membership_level?.toUpperCase()} aktif
          </p>
          <p className="text-xs text-primary/70">
            Berlaku sampai {new Date(profile!.membership_expired_at!).toLocaleDateString("id-ID")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {packages.map((pkg, i) => {
          const isGold = pkg.level === "gold";
          const borderColor = pkg.level === "silver" ? "border-[hsl(var(--gainmax-silver))]" : pkg.level === "gold" ? "border-[hsl(var(--gainmax-gold))]" : "border-primary";

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border-2 ${borderColor} bg-card p-5 shadow-sm`}
            >
              {isGold && (
                <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  POPULER
                </span>
              )}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">{pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1)}</h3>
                </div>
                <p className="text-xl font-extrabold text-foreground">
                  Rp {pkg.price.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-muted-foreground">/30 hari</span>
                </p>
              </div>
              <ul className="mb-2 space-y-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-xs text-muted-foreground">
                Komisi referral: <span className="font-bold text-primary">Rp {pkg.referral_commission.toLocaleString("id-ID")}</span> per ajakan
              </p>
              <Button
                onClick={() => { setSelectedPlan(pkg); setStep("payment"); }}
                className="w-full rounded-full font-bold"
                variant={isGold ? "default" : "outline"}
              >
                Pilih {pkg.level.charAt(0).toUpperCase() + pkg.level.slice(1)}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MembershipPage;
