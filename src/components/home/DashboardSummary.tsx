import { motion } from "framer-motion";
import { scaleIn } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, Clock } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface DashboardSummaryProps {
  totalWorkers: number;
  completionRate: number;
  pendingTasks: number;
  completedTasks: number;
}

export function DashboardSummary({ 
  totalWorkers, 
  completionRate, 
  pendingTasks,
  completedTasks
}: DashboardSummaryProps) {
  return (
    <motion.div
      variants={scaleIn}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
    >
      <Card className="bg-card shadow-sm border-primary/10">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground">Ouvriers</p>
              <HelpTooltip content="Nombre total d'ouvriers enregistrés" side="top" />
            </div>
            <h3 className="text-xl font-bold mt-1">{totalWorkers}</h3>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm border-primary/10">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground">Taux de complétion</p>
              <HelpTooltip content="Pourcentage de tâches complétées" side="top" />
            </div>
            <h3 className="text-xl font-bold mt-1">{completionRate}%</h3>
            <p className="text-xs text-muted-foreground">{completedTasks} tâches complétées</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-sm border-primary/10">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground">Tâches en attente</p>
              <HelpTooltip content="Nombre de tâches non complétées" side="top" />
            </div>
            <h3 className="text-xl font-bold mt-1">{pendingTasks}</h3>
          </div>
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
