import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, DollarSign, ShoppingBag, Package, CheckCircle, XCircle, Clock, UserCog, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions_affiliate"]["Row"];
type Withdrawal = Database["public"]["Tables"]["withdrawals"]["Row"];

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Product form
  const [productForm, setProductForm] = useState({ name: "", price: "", category: "Umum", image_url: "", estimated_reward: "", affiliate_url: "" });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchAll = async () => {
    const [p, prod, tx, wd] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("transactions_affiliate").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
    ]);
    setProfiles(p.data || []);
    setProducts(prod.data || []);
    setTransactions(tx.data || []);
    setWithdrawals(wd.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const totalReward = transactions.filter(t => t.status === "valid" || t.status === "paid").reduce((s, t) => s + t.reward, 0);
  const totalWithdraw = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0);

  // Product CRUD
  const handleSaveProduct = async () => {
    const data = {
      name: productForm.name,
      price: Number(productForm.price),
      category: productForm.category,
      image_url: productForm.image_url || null,
      estimated_reward: Number(productForm.estimated_reward),
      affiliate_url: productForm.affiliate_url || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(data).eq("id", editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Produk diperbarui");
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("Produk ditambahkan");
    }
    setProductForm({ name: "", price: "", category: "Umum", image_url: "", estimated_reward: "", affiliate_url: "" });
    setEditingProduct(null);
    fetchAll();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Produk dihapus"); fetchAll(); }
  };

  // Withdrawal actions
  const handleWithdrawal = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Withdrawal ${status}`); fetchAll(); }
  };

  // Transaction status update
  const handleTransactionStatus = async (id: string, status: "valid" | "rejected" | "paid") => {
    const { error } = await supabase.from("transactions_affiliate").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status diperbarui ke ${status}`); fetchAll(); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-foreground to-foreground/90 px-4 pb-8 pt-6 text-background">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-light opacity-80">Admin Panel</p>
              <p className="text-lg font-bold">{profile?.name || "Admin"}</p>
            </div>
            <button onClick={signOut} className="rounded-xl p-2 transition-colors hover:bg-background/10">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <Users className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">{profiles.length}</p>
              <p className="text-[11px] opacity-70">Users</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <Package className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">{products.length}</p>
              <p className="text-[11px] opacity-70">Produk</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <TrendingUp className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">Rp {totalReward.toLocaleString("id-ID")}</p>
              <p className="text-[11px] opacity-70">Total Reward</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <DollarSign className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">Rp {totalWithdraw.toLocaleString("id-ID")}</p>
              <p className="text-[11px] opacity-70">Total Withdraw</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <Tabs defaultValue="users">
          <TabsList className="mb-4 w-full rounded-xl">
            <TabsTrigger value="users" className="rounded-lg text-xs">Users</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs">Produk</TabsTrigger>
            <TabsTrigger value="transactions" className="rounded-lg text-xs">Transaksi</TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg text-xs">Withdraw</TabsTrigger>
          </TabsList>

          {/* Users tab */}
          <TabsContent value="users">
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name || p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                    <p className="text-[10px] text-muted-foreground">Saldo: Rp {(p.saldo_bisa_ditarik).toLocaleString("id-ID")} | Status: {p.status}</p>
                  </div>
                  <Badge className={`border-0 text-[10px] font-bold uppercase ${p.membership_level === "none" ? "bg-muted text-muted-foreground" : p.membership_level === "gold" ? "bg-gainmax-gold text-foreground" : p.membership_level === "diamond" ? "bg-primary text-primary-foreground" : "bg-gainmax-silver text-foreground"}`}>
                    {p.membership_level}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Products tab */}
          <TabsContent value="products">
            {/* Add product form */}
            <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-foreground">{editingProduct ? "Edit Produk" : "Tambah Produk"}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nama</Label>
                  <Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Harga (Rp)</Label>
                  <Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Kategori</Label>
                  <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Umum", "Elektronik", "Fashion", "Rumah Tangga", "Kesehatan"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Est. Reward (Rp)</Label>
                  <Input type="number" value={productForm.estimated_reward} onChange={e => setProductForm({ ...productForm, estimated_reward: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Image URL</Label>
                  <Input value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Affiliate URL</Label>
                  <Input value={productForm.affiliate_url} onChange={e => setProductForm({ ...productForm, affiliate_url: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveProduct} className="rounded-full text-xs font-bold">
                  {editingProduct ? "Update" : "Tambah"}
                </Button>
                {editingProduct && (
                  <Button variant="outline" onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: "", category: "Umum", image_url: "", estimated_reward: "", affiliate_url: "" }); }} className="rounded-full text-xs">
                    Batal
                  </Button>
                )}
              </div>
            </div>

            {/* Products list */}
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Rp {p.price.toLocaleString("id-ID")} | Reward: Rp {p.estimated_reward.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => {
                      setEditingProduct(p);
                      setProductForm({
                        name: p.name, price: String(p.price), category: p.category,
                        image_url: p.image_url || "", estimated_reward: String(p.estimated_reward),
                        affiliate_url: p.affiliate_url || "",
                      });
                    }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => deleteProduct(p.id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Transactions tab */}
          <TabsContent value="transactions">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`border-0 text-[10px] font-bold uppercase ${
                      tx.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      tx.status === "valid" ? "bg-green-100 text-green-700" :
                      tx.status === "rejected" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>{tx.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Order #{tx.order_id || "-"}</p>
                  <p className="text-xs text-muted-foreground">Reward: Rp {tx.reward.toLocaleString("id-ID")}</p>
                  {tx.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-lg text-xs" onClick={() => handleTransactionStatus(tx.id, "valid")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Valid
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => handleTransactionStatus(tx.id, "rejected")}>
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Withdrawals tab */}
          <TabsContent value="withdrawals">
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`border-0 text-[10px] font-bold uppercase ${
                      w.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      w.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{w.status}</Badge>
                  </div>
                  <p className="text-lg font-bold text-foreground">Rp {w.amount.toLocaleString("id-ID")}</p>
                  {w.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-lg text-xs" onClick={() => handleWithdrawal(w.id, "approved")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => handleWithdrawal(w.id, "rejected")}>
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
