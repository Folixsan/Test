import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const fadeUpVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-muted"
      initial="hidden"
      animate="visible"
      variants={fadeUpVariants}
    >
      <motion.div className="text-center" variants={fadeUpVariants}>
        <motion.h1 className="mb-4 text-4xl font-bold" variants={fadeUpVariants}>
          404
        </motion.h1>
        <motion.p className="mb-4 text-xl text-muted-foreground" variants={fadeUpVariants}>
          Oops! Page not found
        </motion.p>
        <motion.a
          href="/"
          className="text-primary underline hover:text-primary/90"
          variants={fadeUpVariants}
        >
          Return to Home
        </motion.a>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;
