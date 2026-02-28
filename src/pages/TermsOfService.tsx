import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";

const TermsOfService = () => {
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
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              Terms of Service
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
              <h2 className="text-xl font-bold mb-3">1. Penerimaan Ketentuan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dengan menggunakan layanan Temp Mail, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan ini.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">2. Deskripsi Layanan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Temp Mail menyediakan alamat email sementara untuk menerima email. Layanan ini gratis dan tidak memerlukan registrasi. Email yang diterima akan otomatis dihapus setelah 3 jam.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">3. Penggunaan yang Dilarang</h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda dilarang menggunakan layanan ini untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Aktivitas ilegal atau melanggar hukum</li>
                <li>Spam, phishing, atau penipuan</li>
                <li>Pelecehan atau ancaman terhadap orang lain</li>
                <li>Menyebarkan malware atau virus</li>
                <li>Melanggar hak cipta atau kekayaan intelektual</li>
                <li>Aktivitas yang dapat merusak reputasi layanan</li>
              </ul>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">4. Batasan Tanggung Jawab</h2>
              <p className="text-muted-foreground leading-relaxed">
                Layanan ini disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan layanan ini, termasuk kehilangan data atau gangguan layanan.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">5. Ketersediaan Layanan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami berusaha menjaga layanan tetap tersedia 24/7, namun tidak menjamin ketersediaan tanpa gangguan. Kami berhak memodifikasi atau menghentikan layanan kapan saja tanpa pemberitahuan.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">6. Hak Kekayaan Intelektual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Semua konten, desain, dan kode sumber Temp Mail adalah milik kami dan dilindungi oleh hukum hak cipta. Anda tidak diperkenankan menyalin, memodifikasi, atau mendistribusikan tanpa izin.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">7. Perubahan Ketentuan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami dapat mengubah syarat dan ketentuan ini kapan saja. Penggunaan berkelanjutan setelah perubahan berarti Anda menerima ketentuan yang diperbarui.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">8. Hukum yang Berlaku</h2>
              <p className="text-muted-foreground leading-relaxed">
                Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Segala sengketa akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
              </p>
            </motion.section>

            <motion.section variants={sectionVariants}>
              <h2 className="text-xl font-bold mb-3">9. Kontak</h2>
              <p className="text-muted-foreground leading-relaxed">
                Untuk pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui{" "}
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

export default TermsOfService;
