import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  BERHASIL: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  DITOLAK: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  cair: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  dibatalkan: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  berhasil: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ditolak: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [payRes, comRes, wdRes] = await Promise.all([
        supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("referral_commissions").select("*").eq("staff_id", user.id).order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setPayments(payRes.data || []);
      setCommissions(comRes.data || []);
      setWithdrawals(wdRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Riwayat</h2>
      <Tabs defaultValue="payments">
        <TabsList className="mb-4 w-full rounded-xl">
          <TabsTrigger value="payments" className="rounded-lg text-xs flex-1">Pembayaran</TabsTrigger>
          <TabsTrigger value="commissions" className="rounded-lg text-xs flex-1">Komisi</TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-lg text-xs flex-1">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          {payments.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Belum ada pembayaran</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`${statusColors[p.status] || ""} border-0 text-[10px] font-bold uppercase`}>{p.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Membership {p.membership_level?.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">Via {p.payment_channel || p.payment_method || "-"}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">Rp {p.amount?.toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commissions">
          {commissions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Belum ada komisi</p>
          ) : (
            <div className="space-y-3">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                    <p className="text-sm font-semibold text-foreground">{c.percentage}% komisi</p>
                    <Badge className={`${statusColors[c.status] || ""} border-0 text-[10px] font-bold uppercase mt-1`}>{c.status}</Badge>
                  </div>
                  <p className="font-bold text-primary">+Rp {c.amount.toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="withdrawals">
          {withdrawals.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Belum ada withdraw</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`${statusColors[w.status] || ""} border-0 text-[10px] font-bold uppercase`}>{w.status}</Badge>
                  </div>
                  <p className="text-lg font-bold text-foreground">Rp {w.amount.toLocaleString("id-ID")}</p>
                  {w.bank_name && <p className="text-xs text-muted-foreground">{w.bank_name} - {w.account_number}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryPage;
