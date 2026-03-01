import { useAuth } from "@/contexts/AuthContext";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, ShoppingBag, Users, History, Wallet, Home, Crown, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const membershipColors: Record<string, string> = {
  silver: "bg-gainmax-silver text-foreground",
  gold: "bg-gainmax-gold text-foreground",
  diamond: "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground",
  none: "bg-muted text-muted-foreground",
};

const MemberLayout = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const totalSaldo = (profile?.saldo_referral || 0) + (profile?.saldo_affiliate || 0) + (profile?.saldo_terkunci || 0);

  const menuItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: ShoppingBag, label: "Affiliate", path: "/dashboard/affiliate" },
    { icon: Users, label: "Referral", path: "/dashboard/referral" },
    { icon: History, label: "Riwayat", path: "/dashboard/history" },
    { icon: Wallet, label: "Withdraw", path: "/dashboard/withdraw" },
    { icon: CreditCard, label: "Bayar", path: "/dashboard/membership" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-4 pb-8 pt-6 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-light opacity-80">Selamat datang,</p>
              <p className="text-lg font-bold">{profile?.name || "Member"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${membershipColors[profile?.membership_level || "none"]} border-0 px-3 py-1 text-xs font-bold uppercase`}>
                <Crown className="mr-1 h-3 w-3" />
                {profile?.membership_level === "none" ? "Free" : profile?.membership_level}
              </Badge>
              <button onClick={signOut} className="rounded-xl p-2 transition-colors hover:bg-primary-foreground/10">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Saldo card */}
          <div className="rounded-2xl bg-primary-foreground/10 p-5 backdrop-blur-sm">
            <p className="mb-1 text-xs font-medium opacity-80">TOTAL SALDO</p>
            <p className="text-3xl font-extrabold">
              Rp {totalSaldo.toLocaleString("id-ID")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="opacity-70">Bisa Ditarik</p>
                <p className="font-bold">Rp {(profile?.saldo_bisa_ditarik || 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="opacity-70">Terkunci</p>
                <p className="font-bold">Rp {(profile?.saldo_terkunci || 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="opacity-70">Referral</p>
                <p className="font-bold">Rp {(profile?.saldo_referral || 0).toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="opacity-70">Affiliate</p>
                <p className="font-bold">Rp {(profile?.saldo_affiliate || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MemberLayout;
