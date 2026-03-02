import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, DollarSign, Package, CheckCircle, XCircle, TrendingUp, Bell, Settings, CreditCard, Wallet, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Product form
  const [productForm, setProductForm] = useState({ name: "", price: "", category: "Umum", image_url: "", estimated_reward: "", affiliate_url: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Settings
  const [qrisFile, setQrisFile] = useState<File | null>(null);

  const fetchAll = async () => {
    const [p, pay, wd, prod, notif, pkg] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("membership_packages").select("*").order("price"),
    ]);
    setProfiles(p.data || []);
    setPayments(pay.data || []);
    setWithdrawals(wd.data || []);
    setProducts(prod.data || []);
    setNotifications(notif.data || []);
    setPackages(pkg.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // Realtime notifications
    const channel = supabase.channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, () => fetchAll())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const totalMembers = profiles.filter(p => p.membership_level !== "none").length;
  const totalStaff = profiles.length; // approx
  const totalPendapatan = payments.filter(p => p.status === "BERHASIL").reduce((s, p) => s + (p.amount || 0), 0);
  const pendingWithdraw = withdrawals.filter(w => w.status === "pending").length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const handlePaymentAction = async (paymentId: string, action: "approve" | "reject") => {
    setActionLoading(paymentId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token}` },
        body: JSON.stringify({ payment_id: paymentId, action }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      toast.success(`Pembayaran ${action === "approve" ? "disetujui" : "ditolak"}!`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: "approve" | "reject") => {
    setActionLoading(withdrawalId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-withdrawal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token}` },
        body: JSON.stringify({ withdrawal_id: withdrawalId, action }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      toast.success(`Withdraw ${action === "approve" ? "disetujui" : "ditolak"}!`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveProduct = async () => {
    const data = { name: productForm.name, price: Number(productForm.price), category: productForm.category, image_url: productForm.image_url || null, estimated_reward: Number(productForm.estimated_reward), affiliate_url: productForm.affiliate_url || null };
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
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produk dihapus");
    fetchAll();
  };

  const uploadQris = async () => {
    if (!qrisFile || !user) return;
    const ext = qrisFile.name.split(".").pop();
    const path = `qris_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, qrisFile, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("site_settings").update({ value: data.publicUrl } as any).eq("key", "qris_image_url");
    toast.success("QRIS berhasil diupload!");
    setQrisFile(null);
  };

  const updatePackagePrice = async (id: string, price: number, commission: number) => {
    await supabase.from("membership_packages").update({ price, referral_commission: commission } as any).eq("id", id);
    toast.success("Paket diperbarui");
    fetchAll();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-foreground to-foreground/90 px-4 pb-8 pt-6 text-background">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-light opacity-80">Superadmin Panel</p>
              <p className="text-lg font-bold">{profile?.name || "Admin"}</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadNotifs > 0 && (
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadNotifs}</span>
                </div>
              )}
              <button onClick={signOut} className="rounded-xl p-2 transition-colors hover:bg-background/10">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <Users className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">{totalMembers}</p>
              <p className="text-[11px] opacity-70">Members Aktif</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <TrendingUp className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">Rp {totalPendapatan.toLocaleString("id-ID")}</p>
              <p className="text-[11px] opacity-70">Total Pendapatan</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <CreditCard className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">{payments.filter(p => p.status === "PENDING").length}</p>
              <p className="text-[11px] opacity-70">Pembayaran Pending</p>
            </div>
            <div className="rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
              <Wallet className="mb-1 h-4 w-4 opacity-70" />
              <p className="text-xl font-extrabold">{pendingWithdraw}</p>
              <p className="text-[11px] opacity-70">Withdraw Pending</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <Tabs defaultValue="payments">
          <TabsList className="mb-4 w-full rounded-xl flex-wrap">
            <TabsTrigger value="payments" className="rounded-lg text-xs">Pembayaran</TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg text-xs">Withdraw</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg text-xs">Users</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg text-xs">Produk</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg text-xs">Pengaturan</TabsTrigger>
          </TabsList>

          {/* Payments */}
          <TabsContent value="payments">
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`border-0 text-[10px] font-bold uppercase ${p.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : p.status === "BERHASIL" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Membership {p.membership_level?.toUpperCase()}</p>
                  <p className="text-lg font-bold text-foreground">Rp {(p.amount || 0).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-muted-foreground">Via: {p.payment_channel || "-"}</p>
                  {p.proof_image_url && (
                    <a href={p.proof_image_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      <img src={p.proof_image_url} alt="Bukti" className="h-24 rounded-lg border border-border object-cover" />
                    </a>
                  )}
                  {p.status === "PENDING" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-lg text-xs" disabled={actionLoading === p.id} onClick={() => handlePaymentAction(p.id, "approve")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> ACC
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg text-xs" disabled={actionLoading === p.id} onClick={() => handlePaymentAction(p.id, "reject")}>
                        <XCircle className="mr-1 h-3 w-3" /> Tolak
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {payments.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pembayaran</p>}
            </div>
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals">
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("id-ID")}</p>
                    <Badge className={`border-0 text-[10px] font-bold uppercase ${w.status === "pending" ? "bg-yellow-100 text-yellow-700" : w.status === "berhasil" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{w.status}</Badge>
                  </div>
                  <p className="text-lg font-bold text-foreground">Rp {w.amount.toLocaleString("id-ID")}</p>
                  {w.bank_name && <p className="text-xs text-muted-foreground">{w.bank_name} - {w.account_number} ({w.account_holder})</p>}
                  {w.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="rounded-lg text-xs" disabled={actionLoading === w.id} onClick={() => handleWithdrawalAction(w.id, "approve")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> ACC
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg text-xs" disabled={actionLoading === w.id} onClick={() => handleWithdrawalAction(w.id, "reject")}>
                        <XCircle className="mr-1 h-3 w-3" /> Tolak
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {withdrawals.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada withdraw</p>}
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name || p.email}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                    <p className="text-[10px] text-muted-foreground">Saldo: Rp {(p.saldo_bisa_ditarik).toLocaleString("id-ID")} | Referral: {p.referral_code}</p>
                  </div>
                  <Badge className={`border-0 text-[10px] font-bold uppercase ${p.membership_level === "none" ? "bg-muted text-muted-foreground" : p.membership_level === "gold" ? "bg-gainmax-gold text-foreground" : p.membership_level === "diamond" ? "bg-primary text-primary-foreground" : "bg-gainmax-silver text-foreground"}`}>
                    {p.membership_level}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products">
            <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-foreground">{editingProduct ? "Edit Produk" : "Tambah Produk"}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1"><Label className="text-xs">Nama</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs">Harga</Label><Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs">Kategori</Label>
                  <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Umum", "Elektronik", "Fashion", "Rumah Tangga", "Kesehatan"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Est. Reward</Label><Input type="number" value={productForm.estimated_reward} onChange={e => setProductForm({ ...productForm, estimated_reward: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs">Image URL</Label><Input value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="text-xs">Affiliate URL</Label><Input value={productForm.affiliate_url} onChange={e => setProductForm({ ...productForm, affiliate_url: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSaveProduct} className="rounded-full text-xs font-bold">{editingProduct ? "Update" : "Tambah"}</Button>
                {editingProduct && <Button variant="outline" onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: "", category: "Umum", image_url: "", estimated_reward: "", affiliate_url: "" }); }} className="rounded-full text-xs">Batal</Button>}
              </div>
            </div>
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Rp {p.price.toLocaleString("id-ID")} | Reward: Rp {p.estimated_reward.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, price: String(p.price), category: p.category, image_url: p.image_url || "", estimated_reward: String(p.estimated_reward), affiliate_url: p.affiliate_url || "" }); }}>Edit</Button>
                    <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => deleteProduct(p.id)}>Hapus</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* QRIS Upload */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><ImageIcon className="h-4 w-4" /> Upload QRIS</h3>
                <input type="file" accept="image/*" onChange={(e) => setQrisFile(e.target.files?.[0] || null)} className="text-xs" />
                <Button onClick={uploadQris} disabled={!qrisFile} size="sm" className="rounded-full text-xs">Upload QRIS</Button>
              </div>

              {/* Package pricing */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Settings className="h-4 w-4" /> Harga Paket</h3>
                {packages.map(pkg => (
                  <div key={pkg.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span className="text-sm font-bold text-foreground w-20">{pkg.level.toUpperCase()}</span>
                    <Input type="number" defaultValue={pkg.price} className="rounded-xl w-28" id={`price-${pkg.id}`} />
                    <Input type="number" defaultValue={pkg.referral_commission} className="rounded-xl w-28" id={`comm-${pkg.id}`} />
                    <Button size="sm" className="rounded-lg text-xs" onClick={() => {
                      const price = Number((document.getElementById(`price-${pkg.id}`) as HTMLInputElement).value);
                      const comm = Number((document.getElementById(`comm-${pkg.id}`) as HTMLInputElement).value);
                      updatePackagePrice(pkg.id, price, comm);
                    }}>Simpan</Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
