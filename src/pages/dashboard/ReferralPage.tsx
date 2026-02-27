import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";

const ReferralPage = () => {
  const { profile } = useAuth();
  const [downlineCount, setDownlineCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const fetchDownlines = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", profile.user_id);
      setDownlineCount(count || 0);
    };
    fetchDownlines();
  }, [profile]);

  const copyCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Kode referral disalin!");
    }
  };

  const shareLink = `${window.location.origin}/register?ref=${profile?.referral_code || ""}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link referral disalin!");
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Referral</h2>

      {/* Referral code card */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Kode Referral Anda</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold tracking-widest text-foreground">{profile?.referral_code}</span>
          <button onClick={copyCode} className="rounded-xl bg-secondary p-2 text-muted-foreground transition-colors hover:bg-muted">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Share link */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Link Referral</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{shareLink}</p>
          <button onClick={copyLink} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
            Salin
          </button>
        </div>
      </div>

      {/* Downline count */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Users className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Downline</p>
            <p className="text-2xl font-extrabold text-foreground">{downlineCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
