import { motion } from "framer-motion";
import { Shield, TrendingUp, Users } from "lucide-react";

const TrustSection = () => {
  return (
    <section className="bg-card px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            Kenapa GainMax?
          </h2>
          <h3 className="mb-8 text-2xl font-extrabold text-foreground md:text-3xl">
            Platform Affiliate Terpercaya
          </h3>
          <p className="mx-auto mb-12 max-w-2xl text-base font-light leading-relaxed text-muted-foreground">
            GainMax menghubungkan pengguna ke marketplace seperti Shopee melalui sistem affiliate resmi.
            Setiap transaksi yang tervalidasi menghasilkan reward yang masuk ke saldo akun Anda.
            GainMax tidak menjual produk — kami hanya menjadi penghubung untuk mendapatkan
            estimasi cashback dari aktivitas belanja Anda.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: "Aman & Terpercaya",
              desc: "Sistem affiliate resmi marketplace dengan keamanan data berlapis.",
            },
            {
              icon: TrendingUp,
              title: "Reward Transparan",
              desc: "Estimasi cashback ditampilkan jelas di setiap produk sebelum Anda belanja.",
            },
            {
              icon: Users,
              title: "Komunitas Bertumbuh",
              desc: "Dapatkan komisi tambahan dengan mengajak teman melalui sistem referral.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-2xl border border-border bg-background p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                <item.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-foreground">{item.title}</h4>
              <p className="text-sm font-light leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
