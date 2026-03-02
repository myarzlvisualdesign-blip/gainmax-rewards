import { ShoppingBag, Users, History, Wallet, Crown, Package } from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  { icon: Crown, label: "Membership", desc: "Berlangganan paket", path: "/dashboard/membership", color: "bg-primary/10 text-primary" },
  { icon: Package, label: "Produk", desc: "Upload produk Anda", path: "/dashboard/products", color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300" },
  { icon: ShoppingBag, label: "Affiliate", desc: "Belanja & dapat reward", path: "/dashboard/affiliate", color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" },
  { icon: Users, label: "Referral", desc: "Ajak teman & dapat komisi", path: "/dashboard/referral", color: "bg-gainmax-gold/10 text-gainmax-gold" },
  { icon: History, label: "Riwayat", desc: "Lihat semua transaksi", path: "/dashboard/history", color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" },
  { icon: Wallet, label: "Withdraw", desc: "Cairkan saldo Anda", path: "/dashboard/withdraw", color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
];

const DashboardHome = () => {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-foreground">Menu</h2>
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
              <item.icon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;
