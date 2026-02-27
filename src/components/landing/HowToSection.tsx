import { motion } from "framer-motion";
import { UserPlus, ShoppingBag, ExternalLink, Wallet } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Daftar & Login",
    desc: "Buat akun gratis dan masuk ke dashboard GainMax Anda.",
  },
  {
    icon: ShoppingBag,
    step: "02",
    title: "Pilih Produk Affiliate",
    desc: "Jelajahi marketplace dan temukan produk dengan estimasi cashback terbaik.",
  },
  {
    icon: ExternalLink,
    step: "03",
    title: "Belanja Lewat Link",
    desc: "Klik tombol beli dan selesaikan transaksi di marketplace resmi.",
  },
  {
    icon: Wallet,
    step: "04",
    title: "Reward Masuk ke Saldo",
    desc: "Setelah transaksi tervalidasi, reward otomatis masuk ke saldo Anda.",
  },
];

const HowToSection = () => {
  return (
    <section className="bg-background px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            Cara Kerja
          </h2>
          <h3 className="text-2xl font-extrabold text-foreground md:text-3xl">
            4 Langkah Dapat Cashback
          </h3>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
              <span className="absolute right-4 top-4 text-4xl font-extrabold text-primary/10">
                {item.step}
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-5 w-5 text-accent-foreground group-hover:text-primary-foreground" />
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

export default HowToSection;
