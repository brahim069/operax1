import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { User } from "@/types";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  user: User | null;
  stats: {
    totalWorkers: number;
    completedTasks: number;
    pendingTasks: number;
    completionRate: number;
  };
}

export function HeroSection({ user, stats }: HeroSectionProps) {
  const [greeting, setGreeting] = useState("Bienvenue");
  const today = new Date();
  const formattedDate = format(today, "EEEE, d MMMM yyyy", { locale: fr });

  // Update greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Bonjour");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Bon après-midi");
    } else {
      setGreeting("Bonsoir");
    }
  }, []);

  return (
    <div className="relative w-full mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl" />
      
      <Card className="relative overflow-hidden border-none bg-transparent">
        <div className="p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Logo and Welcome Message */}
            <motion.img
              src="/-uploads/1b7efc57-798b-4499-b4ab-67637cc513aa.png"
              alt="Atelier Dattes Logo"
              className="w-24 h-24"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl font-bold text-primary">
                {greeting}{user?.email ? `, ${user.email}` : ' !'}
              </h1>
              <p className="text-muted-foreground mt-2 capitalize">{formattedDate}</p>
            </motion.div>

            {/* Animated Statistics */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <StatCard
                title="Ouvriers"
                value={stats.totalWorkers}
                gradient="from-blue-500/20 to-blue-600/20"
              />
              <StatCard
                title="Tâches Complétées"
                value={stats.completedTasks}
                gradient="from-green-500/20 to-green-600/20"
              />
              <StatCard
                title="Tâches en Attente"
                value={stats.pendingTasks}
                gradient="from-yellow-500/20 to-yellow-600/20"
              />
              <StatCard
                title="Taux de Complétion"
                value={stats.completionRate}
                suffix="%"
                gradient="from-purple-500/20 to-purple-600/20"
              />
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  gradient: string;
}

function StatCard({ title, value, suffix = "", gradient }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      className={`rounded-xl p-4 bg-gradient-to-br ${gradient}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className="text-sm font-medium text-foreground/80">{title}</h3>
      <p className="text-2xl font-bold mt-2">
        {displayValue}
        {suffix}
      </p>
    </motion.div>
  );
} 