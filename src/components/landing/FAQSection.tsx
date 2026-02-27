import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Berapa estimasi cashback yang bisa saya dapatkan?",
    a: "Estimasi cashback bervariasi tergantung produk dan kategori, umumnya berkisar antara 1-15% dari harga produk. Estimasi cashback ditampilkan di setiap card produk sebelum Anda melakukan pembelian.",
  },
  {
    q: "Bagaimana proses validasi transaksi?",
    a: "Setelah Anda berbelanja melalui link affiliate GainMax, transaksi akan berstatus 'Pending' selama proses validasi oleh marketplace (biasanya 7-30 hari). Setelah tervalidasi, reward akan masuk ke saldo Anda.",
  },
  {
    q: "Apa itu membership dan apakah wajib?",
    a: "Membership adalah paket berlangganan bulanan (Silver, Gold, Diamond) yang menentukan persentase komisi referral Anda. Membership aktif diperlukan agar saldo dapat dicairkan. Tanpa membership, reward tetap masuk namun disimpan sebagai saldo terkunci.",
  },
  {
    q: "Bagaimana cara mencairkan saldo?",
    a: "Anda bisa mengajukan penarikan saldo melalui menu Withdraw di dashboard. Syaratnya: membership aktif dan saldo mencukupi minimum penarikan. Proses pencairan akan diverifikasi oleh tim kami.",
  },
];

const FAQSection = () => {
  return (
    <section className="bg-card px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">
            FAQ
          </h2>
          <h3 className="text-2xl font-extrabold text-foreground md:text-3xl">
            Pertanyaan yang Sering Ditanyakan
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-2xl border border-border bg-background px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm font-light leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
