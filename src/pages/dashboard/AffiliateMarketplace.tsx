import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

const AffiliateMarketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase.from("products").select("*");
      
      if (search) query = query.ilike("name", `%${search}%`);
      if (category !== "all") query = query.eq("category", category);
      if (sort === "reward") query = query.order("estimated_reward", { ascending: false });
      else if (sort === "price_low") query = query.order("price", { ascending: true });
      else query = query.order("created_at", { ascending: false });

      const { data } = await query;
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [search, category, sort]);

  const categories = ["all", "Elektronik", "Fashion", "Rumah Tangga", "Kesehatan", "Umum"];

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Affiliate Marketplace</h2>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full pl-10"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat === "all" ? "Semua" : cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mb-4 flex gap-2">
        {[
          { key: "newest", label: "Terbaru" },
          { key: "reward", label: "Reward ↑" },
          { key: "price_low", label: "Harga ↓" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              sort === s.key ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Belum ada produk tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="aspect-square bg-muted">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="mb-1 line-clamp-2 text-xs font-semibold text-foreground">{product.name}</p>
                <p className="mb-1 text-sm font-extrabold text-foreground">
                  Rp {product.price.toLocaleString("id-ID")}
                </p>
                <p className="mb-3 text-[10px] font-semibold text-primary">
                  Est. cashback Rp {product.estimated_reward.toLocaleString("id-ID")}
                </p>
                <a
                  href={product.affiliate_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full bg-primary py-2 text-center text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Beli & Dapat Reward
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AffiliateMarketplace;
