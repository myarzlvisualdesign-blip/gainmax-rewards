import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background px-4 pb-16 pt-24 md:pt-32 md:pb-24">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -left-20 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center md:text-left"
          >
            <h1 className="mb-4 text-4xl font-extrabold uppercase leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              LEVEL UP YOUR{" "}
              <span className="text-primary">SHOPPING GAME</span>
            </h1>
            <p className="mb-8 text-lg font-light text-muted-foreground md:text-xl">
              Dapatkan reward dari setiap belanja online melalui GainMax.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                Daftar Sekarang
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-primary px-8 text-sm font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                Login
              </Link>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 blur-2xl" />
              <div className="relative flex h-[320px] w-[280px] items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 shadow-2xl shadow-primary/20 md:h-[400px] md:w-[340px]">
                {/* Phone mockup */}
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-card p-6 shadow-inner">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Total Saldo</p>
                  <p className="mb-6 text-2xl font-extrabold text-foreground">Rp 2.450.000</p>
                  <div className="grid w-full grid-cols-2 gap-2">
                    {["Affiliate", "Referral", "Riwayat", "Withdraw"].map((item) => (
                      <div key={item} className="flex flex-col items-center gap-1 rounded-xl bg-secondary p-3">
                        <div className="h-6 w-6 rounded-lg bg-primary/10" />
                        <span className="text-[10px] font-medium text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
