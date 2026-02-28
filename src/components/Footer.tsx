import { Heart, HelpCircle, Code } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

export function Footer() {
  const reduceMotion = useReducedMotion();
  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.footer
      className="py-6 sm:py-8 px-4 sm:px-6"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-3 sm:gap-4">
        {/* Links */}
        <motion.div
          className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap justify-center"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
        >
          <motion.div variants={itemVariants}>
            <Link 
              to="/faq" 
              className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-300"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="link-underline">FAQ</span>
            </Link>
          </motion.div>
          <span className="text-border hidden sm:inline">•</span>
          <motion.div variants={itemVariants}>
            <Link 
              to="/api-docs" 
              className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-300"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="link-underline">API Docs</span>
            </Link>
          </motion.div>
          <span className="text-border hidden sm:inline">•</span>
          <motion.div variants={itemVariants}>
            <Link 
              to="/privacy" 
              className="link-underline hover:text-foreground transition-colors duration-300"
            >
              Privacy Policy
            </Link>
          </motion.div>
          <span className="text-border hidden sm:inline">•</span>
          <motion.div variants={itemVariants}>
            <Link 
              to="/terms" 
              className="link-underline hover:text-foreground transition-colors duration-300"
            >
              Terms of Service
            </Link>
          </motion.div>
        </motion.div>

        {/* Credits */}
        <motion.p
          className="text-sm text-muted-foreground flex items-center gap-1.5"
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.1 }}
        >
          Made with 
          <Heart className="w-3.5 h-3.5 text-destructive animate-pulse-soft" fill="currentColor" />
          by 
          <a 
            href="https://alamcode.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link-underline text-foreground font-medium hover:text-foreground/80 transition-colors duration-300"
          >
            alamcode
          </a>
        </motion.p>
        <motion.p
          className="text-xs text-muted-foreground/60"
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.2 }}
        >
          © {new Date().getFullYear()} All rights reserved
        </motion.p>
      </div>
    </motion.footer>
  );
}
