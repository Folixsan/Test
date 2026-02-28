import { ArrowLeft, Mail, Copy, Key, RefreshCw, Clock, Shield, Zap, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";

const faqs = [
  {
    question: "Apa itu Temp Mail?",
    answer: "Temp Mail adalah layanan email sementara yang memungkinkan kamu menerima email tanpa perlu mendaftar atau memberikan informasi pribadi. Cocok untuk verifikasi akun, menghindari spam, dan menjaga privasi."
  },
  {
    question: "Berapa lama email saya aktif?",
    answer: "Alamat email kamu tidak akan expired dan tetap aktif sampai kamu generate alamat baru. Namun, pesan yang masuk akan otomatis terhapus setelah 3 jam."
  },
  {
    question: "Bagaimana cara menggunakan di device lain?",
    answer: "Klik tombol kunci (🔑) di samping alamat email, lalu copy Session Token. Di device lain, buka Temp Mail, klik tombol kunci, pilih tab 'Use Token', dan paste token tersebut."
  },
  {
    question: "Apakah saya bisa mengirim email?",
    answer: "Tidak, Temp Mail hanya untuk menerima email. Kamu tidak bisa mengirim email dari alamat temporary ini."
  },
  {
    question: "Apakah email saya aman?",
    answer: "Ya, email kamu hanya bisa diakses menggunakan Session Token yang unik. Pastikan untuk tidak membagikan token ini ke orang lain jika kamu ingin menjaga privasi inbox."
  },
  {
    question: "Bagaimana cara mendapatkan alamat email baru?",
    answer: "Klik tombol refresh (🔄) di samping alamat email. Perhatikan bahwa ini akan menghapus semua email di inbox dan alamat email lama tidak bisa digunakan lagi."
  }
];

const steps = [
  {
    icon: Mail,
    title: "1. Dapatkan Email",
    description: "Buka website dan alamat email temporary akan otomatis dibuat untukmu."
  },
  {
    icon: Copy,
    title: "2. Copy & Gunakan",
    description: "Copy alamat email dan gunakan untuk mendaftar di website atau layanan apapun."
  },
  {
    icon: Clock,
    title: "3. Tunggu Email",
    description: "Email akan muncul di inbox secara otomatis dalam beberapa detik."
  },
  {
    icon: Key,
    title: "4. Akses di Mana Saja",
    description: "Gunakan Session Token untuk mengakses inbox yang sama di device lain."
  }
];

const Faq = () => {
  const reduceMotion = useReducedMotion();
  const headerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };
  const headerItemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : -12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };
  const fadeUpVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        ease: "easeOut" as const,
      },
    },
  };
  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.45,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <div className="min-h-screen grid-background flex flex-col">
      {/* Header */}
      <motion.header
        className="w-full py-6 px-6"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <motion.div variants={headerItemVariants}>
            <Link to="/" className="flex items-center gap-2 group">
              <Button variant="ghost" size="icon" className="hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-lg tracking-tight">Back to Temp Mail</span>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Hero */}
          <motion.div
            className="text-center space-y-4 py-8"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              Cara Penggunaan
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Panduan lengkap menggunakan Temp Mail untuk menjaga privasi emailmu.
            </p>
          </motion.div>

          {/* How to Use */}
          <motion.section
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <h2 className="text-2xl font-bold mb-6">Langkah Penggunaan</h2>
            <motion.div
              className="grid md:grid-cols-2 gap-4"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
            >
              {steps.map((step, index) => (
                <motion.div 
                  key={index}
                  className="bento-card hover-lift flex gap-4"
                  variants={itemVariants}
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Features */}
          <motion.section
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <h2 className="text-2xl font-bold mb-6">Fitur Utama</h2>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
            >
              {[
                { icon: Shield, title: "Private", desc: "Tanpa registrasi" },
                { icon: Zap, title: "Instant", desc: "Real-time" },
                { icon: Clock, title: "Auto-delete", desc: "3 jam" },
                { icon: Globe, title: "Multi-device", desc: "Sync token" },
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bento-card hover-lift flex flex-col items-center text-center py-6"
                  variants={itemVariants}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                    <feature.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* FAQ */}
          <motion.section
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <h2 className="text-2xl font-bold mb-6">Pertanyaan Umum (FAQ)</h2>
            <motion.div
              className="space-y-4"
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-120px" }}
            >
              {faqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  className="bento-card hover-lift"
                  variants={itemVariants}
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* CTA */}
          <motion.section
            className="text-center py-8"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <Link to="/">
              <Button size="lg" className="gap-2 press-effect hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
                Mulai Gunakan Temp Mail
              </Button>
            </Link>
          </motion.section>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="py-8 px-6"
        variants={fadeUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-120px" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Made with ❤️ by{" "}
            <a 
              href="https://alamcode.tech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-underline text-foreground font-medium"
            >
              alamcode
            </a>
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default Faq;
