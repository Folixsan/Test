import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";

const PrivacyPolicy = () => {
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
  const sectionVariants = {
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
  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.1,
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
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero */}
          <motion.div
            className="text-center space-y-4 py-8"
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            className="bento-card space-y-6"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
          >
            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">1. Informasi yang Kami Kumpulkan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Temp Mail dirancang dengan prinsip privasi. Kami hanya menyimpan data minimal yang diperlukan untuk layanan berfungsi:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Alamat email temporary yang dibuat</li>
                <li>Session token untuk akses inbox</li>
                <li>Email yang diterima (dihapus otomatis setelah 3 jam)</li>
              </ul>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">2. Penggunaan Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Data yang dikumpulkan hanya digunakan untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Menyediakan layanan email temporary</li>
                <li>Memungkinkan akses inbox dari berbagai perangkat</li>
                <li>Menerima dan menampilkan email yang masuk</li>
              </ul>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">3. Penyimpanan Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pesan email akan otomatis dihapus setelah 3 jam. Alamat email temporary tetap tersimpan sampai pengguna membuat alamat baru. Kami tidak menjual, menyewakan, atau membagikan data kepada pihak ketiga.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">4. Keamanan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menerapkan langkah-langkah keamanan untuk melindungi data, termasuk enkripsi dan akses berbasis token. Namun, tidak ada metode transmisi internet yang 100% aman.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">5. Cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menggunakan localStorage browser untuk menyimpan session token. Ini memungkinkan akses kembali ke inbox yang sama. Tidak ada cookie pelacakan pihak ketiga yang digunakan.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">6. Perubahan Kebijakan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan diposting di halaman ini dengan tanggal pembaruan baru.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">7. Kontak</h2>
              <p className="text-muted-foreground leading-relaxed">
                Jika ada pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui{" "}
                <a href="https://alamcode.tech" target="_blank" rel="noopener noreferrer" className="text-foreground link-underline font-medium">
                  alamcode.tech
                </a>
              </p>
            </motion.section>
          </motion.div>
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
            © {new Date().getFullYear()} Temp Mail. All rights reserved.
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default PrivacyPolicy;
