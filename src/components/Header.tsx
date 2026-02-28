import { Mail } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const reduceMotion = useReducedMotion();
  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : -12 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        delay: reduceMotion ? 0 : index * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <motion.header
      className="w-full py-4 sm:py-6 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center gap-2 group cursor-pointer"
          variants={itemVariants}
          custom={0}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-foreground flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="font-semibold text-base sm:text-lg tracking-tight">tempmail</span>
        </motion.div>
        
        <motion.div
          className="flex items-center gap-3"
          variants={itemVariants}
          custom={1}
        >
          <a
            href="https://alamcode.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground link-underline hover:text-foreground transition-colors duration-300"
          >
            by alamcode
          </a>
          <ThemeToggle />
        </motion.div>
      </div>
    </motion.header>
  );
}
