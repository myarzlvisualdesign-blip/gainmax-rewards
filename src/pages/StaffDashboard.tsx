import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Crown, DollarSign, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const membershipColors: Record<string, string> = {
  silver: "bg-gainmax-silver text-foreground",
  gold: "bg-gainmax-gold text-foreground",
  diamond: "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground",
  none: "bg-muted text-muted-foreground",
};

const StaffDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [membersRes, commissionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("parent_id", user.id),
        supabase.from("referral_commissions").select("*").eq("staff_id", user.id).order("created_at", { ascending: false }),
      ]);
      setMembers(membersRes.data || []);
      setCommissions(commissionsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-light opacity-80">Staff Dashboard</p>
              <p className="text-lg font-bold">{profile?.name || "Staff"}</p>
            </div>
            <button onClick={signOut} className="rounded-xl p-2 transition-colors hover:bg-primary-foreground/10">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <Users className="mb-2 h-5 w-5 opacity-70" />
              <p className="text-2xl font-extrabold">{members.length}</p>
              <p className="text-xs opacity-70">Anggota</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <DollarSign className="mb-2 h-5 w-5 opacity-70" />
              <p className="text-2xl font-extrabold">Rp {totalCommission.toLocaleString("id-ID")}</p>
              <p className="text-xs opacity-70">Komisi</p>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <Crown className="mb-2 h-5 w-5 opacity-70" />
              <p className="text-lg font-extrabold">{profile?.membership_level?.toUpperCase()}</p>
              <p className="text-xs opacity-70">Level</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h3 className="mb-3 text-lg font-bold text-foreground">Daftar Anggota</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : members.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada anggota</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.name || m.email}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Badge className={`${membershipColors[m.membership_level]} border-0 text-[10px] font-bold uppercase`}>
                  <Crown className="mr-1 h-3 w-3" />
                  {m.membership_level === "none" ? "Free" : m.membership_level}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <h3 className="mb-3 mt-8 text-lg font-bold text-foreground">Riwayat Komisi</h3>
        {commissions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada komisi</p>
        ) : (
          <div className="space-y-3">
            {commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                  <p className="text-sm font-semibold text-foreground">{c.percentage}% komisi</p>
                  <Badge className={`border-0 text-[10px] font-bold uppercase mt-1 ${c.status === "cair" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{c.status}</Badge>
                </div>
                <p className="font-bold text-primary">+Rp {c.amount.toLocaleString("id-ID")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
