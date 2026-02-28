import { Shield, Zap, Clock, Globe } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "Private",
    description: "Your data stays safe"
  },
  {
    icon: Zap,
    title: "Instant",
    description: "Real-time delivery"
  },
  {
    icon: Clock,
    title: "Auto-delete",
    description: "Expires in 3 hours"
  },
  {
    icon: Globe,
    title: "No signup",
    description: "Use instantly"
  }
];

export function Features() {
  const reduceMotion = useReducedMotion();
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
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3"
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-120px" }}
    >
      {features.map((feature, index) => (
        <motion.div
          key={index}
          className="bento-card hover-lift flex flex-col items-center text-center py-6 sm:py-8 group cursor-default"
          variants={itemVariants}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3 transition-all duration-300 group-hover:bg-foreground group-hover:scale-110">
            <feature.icon className="w-4 h-4 text-muted-foreground transition-all duration-300 group-hover:text-background" />
          </div>
          <h3 className="font-semibold text-sm transition-colors duration-300">{feature.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 transition-colors duration-300">{feature.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
