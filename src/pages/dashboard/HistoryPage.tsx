import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions_affiliate"]["Row"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  valid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-blue-100 text-blue-700",
};

const HistoryPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("transactions_affiliate")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Riwayat Transaksi</h2>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Belum ada transaksi</div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("id-ID")}</p>
                <Badge className={`${statusColors[tx.status]} border-0 text-[10px] font-bold uppercase`}>
                  {tx.status}
                </Badge>
              </div>
              <p className="mb-1 text-sm font-semibold text-foreground">Order #{tx.order_id || "-"}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rp {tx.amount.toLocaleString("id-ID")}</span>
                <span className="font-bold text-primary">+Rp {tx.reward.toLocaleString("id-ID")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
