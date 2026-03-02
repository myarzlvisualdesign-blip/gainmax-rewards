import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Upload } from "lucide-react";

interface UserProduct {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  shopee_link: string | null;
  buy_link: string | null;
  created_at: string;
}

const UserProductsPage = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Umum", shopee_link: "", buy_link: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const membershipActive = profile?.membership_level !== "none" && profile?.membership_expired_at && new Date(profile.membership_expired_at) > new Date();

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_products").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProducts((data as UserProduct[]) || []);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const handleSubmit = async () => {
    if (!user || !form.title) { toast.error("Judul wajib diisi"); return; }
    setLoading(true);
    try {
      let image_url = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const { error } = await supabase.from("user_products").insert({
        user_id: user.id,
        title: form.title,
        description: form.description || null,
        category: form.category,
        shopee_link: form.shopee_link || null,
        buy_link: form.buy_link || null,
        image_url,
      } as any);
      if (error) throw error;
      toast.success("Produk berhasil ditambahkan!");
      setForm({ title: "", description: "", category: "Umum", shopee_link: "", buy_link: "" });
      setImageFile(null);
      setShowForm(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan produk");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("user_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Produk dihapus"); fetchProducts(); }
  };

  if (!membershipActive) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Anda harus memiliki membership aktif untuk upload produk.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => window.location.href = "/dashboard/membership"}>
          Aktifkan Membership
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Produk Saya</h2>
        <Button size="sm" className="rounded-full text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-3 w-3" /> Tambah
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Kategori</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Umum", "Elektronik", "Fashion", "Rumah Tangga", "Kesehatan", "Makanan"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Foto Produk</Label>
            <div onClick={() => fileRef.current?.click()} className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground hover:border-primary/50">
              <Upload className="h-4 w-4" />
              {imageFile ? imageFile.name : "Klik untuk upload"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Judul Produk</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Deskripsi</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" rows={3} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Link Shopee</Label>
            <Input value={form.shopee_link} onChange={e => setForm({ ...form, shopee_link: e.target.value })} className="rounded-xl" placeholder="https://shopee.co.id/..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Link Beli (Custom)</Label>
            <Input value={form.buy_link} onChange={e => setForm({ ...form, buy_link: e.target.value })} className="rounded-xl" placeholder="https://..." />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full rounded-full font-bold">
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Belum ada produk</p>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex gap-3">
                {p.image_url && <img src={p.image_url} alt={p.title} className="h-16 w-16 rounded-xl object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                  {p.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {p.shopee_link && (
                    <a href={p.shopee_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      <ExternalLink className="h-3 w-3" /> Shopee
                    </a>
                  )}
                  {p.buy_link && (
                    <a href={p.buy_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      <ExternalLink className="h-3 w-3" /> Beli
                    </a>
                  )}
                </div>
                <button onClick={() => deleteProduct(p.id)} className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProductsPage;
