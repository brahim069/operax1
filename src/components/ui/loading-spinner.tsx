import { motion } from "framer-motion";

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="h-2 w-2 rounded-full bg-white"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.5, 1],
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-white"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
          times: [0, 0.5, 1],
        }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-white"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
          times: [0, 0.5, 1],
        }}
      />
    </div>
  );
}; 