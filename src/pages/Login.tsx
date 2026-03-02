import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Users, User } from "lucide-react";

const roles = [
  { key: "admin", label: "Superadmin", icon: Shield, desc: "Pemilik website" },
  { key: "staff", label: "Staff", icon: Users, desc: "Pengelola tim" },
  { key: "member", label: "Member", icon: User, desc: "Anggota biasa" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email dan password harus diisi"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: data.user.id });

      if (roleData === "admin") navigate("/admin");
      else if (roleData === "staff") navigate("/staff");
      else navigate("/dashboard");

      toast.success("Login berhasil!");
    } catch (err: any) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-extrabold text-foreground">
            Gain<span className="text-primary">Max</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Masuk ke akun Anda</p>
        </div>

        {/* Role selector */}
        <div className="mb-6 grid grid-cols-3 gap-2">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRole(r.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                selectedRole === r.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <r.icon className="h-5 w-5" />
              <span className="text-[11px] font-bold">{r.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full font-bold uppercase tracking-wider">
            {loading ? "Memproses..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">Daftar Sekarang</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
