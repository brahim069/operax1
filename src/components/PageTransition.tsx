import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ 
          opacity: 0,
          scale: 0.95,
          x: 20
        }}
        animate={{ 
          opacity: 1,
          scale: 1,
          x: 0
        }}
        exit={{ 
          opacity: 0,
          scale: 0.95,
          x: -20
        }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.3,
          scale: {
            type: "spring",
            stiffness: 200,
            damping: 20
          }
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 