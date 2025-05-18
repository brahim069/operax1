import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface FormFeedbackProps {
  type: "error" | "success" | "info";
  message: string;
}

export function FormFeedback({ type, message }: FormFeedbackProps) {
  const variants = {
    error: {
      icon: AlertCircle,
      className: "text-destructive bg-destructive/10 border-destructive",
    },
    success: {
      icon: CheckCircle2,
      className: "text-green-500 bg-green-500/10 border-green-500",
    },
    info: {
      icon: Info,
      className: "text-blue-500 bg-blue-500/10 border-blue-500",
    },
  };

  const { icon: Icon, className } = variants[type];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`flex items-center gap-2 rounded-md border p-3 text-sm ${className}`}
    >
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </motion.div>
  );
} 