import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function NavigationProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left"
        style={{ scaleX }}
      />
      {isNavigating && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </>
  );
} 