import { useApp } from "@/contexts/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Users, CheckCircle2, Clock, TrendingUp, Activity } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { motion } from "framer-motion";
import { fadeIn, slideIn } from "@/lib/animations";
import { HelpTooltip } from "@/components/ui/help-tooltip";

export default function DashboardPage() {
  const { workers, tasks } = useApp();

  // Calculate statistics
  const totalWorkers = workers.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = totalTasks - completedTasks;

  // Calculate worker performance
  const workerPerformance = workers.map(worker => {
    const workerTasks = tasks.filter(task => task.workerId === worker.id);
    const completed = workerTasks.filter(task => task.completed).length;
    const total = workerTasks.length;
    const performance = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      name: `${worker.firstName} ${worker.lastName}`,
      performance,
      tasksCompleted: completed,
      totalTasks: total,
    };
  });

  // Prepare data for the completion trend chart
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: format(date, 'dd/MM', { locale: fr }),
      completed: tasks.filter(task => 
        task.completed && 
        task.day === date.getDate() &&
        task.month === date.getMonth() + 1 &&
        task.year === date.getFullYear()
      ).length,
      total: tasks.filter(task => 
        task.day === date.getDate() &&
        task.month === date.getMonth() + 1 &&
        task.year === date.getFullYear()
      ).length,
    };
  }).reverse();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-background flex flex-col"
    >
      <AppHeader />
      
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.h1 
            variants={slideIn}
            className="text-2xl font-bold text-foreground mb-6"
          >
            Tableau de Bord
            <HelpTooltip 
              content="Vue d'ensemble des performances et des tâches de l'atelier"
              side="right"
            />
          </motion.h1>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricsCard
              title="Total Ouvriers"
              value={totalWorkers}
              icon={Users}
              description="Ouvriers actifs"
            />
            
            <MetricsCard
              title="Tâches Totales"
              value={totalTasks}
              icon={CalendarIcon}
              description="Tâches planifiées"
            />
            
            <MetricsCard
              title="Taux de Complétion"
              value={`${completionRate}%`}
              icon={CheckCircle2}
              description={`${completedTasks} tâches complétées`}
              trend={{
                value: 5, // Example trend value
                isPositive: true
              }}
            />
            
            <MetricsCard
              title="Tâches en Attente"
              value={pendingTasks}
              icon={Clock}
              description="À compléter"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Calendar and Recent Tasks */}
            <motion.div 
              variants={slideIn}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Calendrier
                    <HelpTooltip content="Calendrier des tâches planifiées" />
                  </CardTitle>
                  <CardDescription>Vue du mois en cours</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={new Date()}
                    className="rounded-md border"
                    locale={fr}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Tâches Récentes
                    <HelpTooltip content="Les 5 dernières tâches ajoutées ou modifiées" />
                  </CardTitle>
                  <CardDescription>Les dernières tâches ajoutées ou modifiées</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.length > 0 ? (
                      tasks
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                        .map((task, index) => (
                          <motion.div
                            key={task.id}
                            variants={slideIn}
                            custom={index}
                            className="flex items-center justify-between border-b pb-2"
                          >
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Jour {task.day}, {task.month}/{task.year}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              task.completed 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {task.completed ? "Complété" : "En attente"}
                            </div>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Aucune tâche disponible
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div 
              variants={slideIn}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendance de Complétion
                    <HelpTooltip content="Évolution du nombre de tâches complétées sur les 7 derniers jours" />
                  </CardTitle>
                  <CardDescription>Tâches complétées sur les 7 derniers jours</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" name="Complétées" />
                      <Line type="monotone" dataKey="total" stroke="#6b7280" name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance des Ouvriers
                    <HelpTooltip content="Taux de complétion des tâches par ouvrier" />
                  </CardTitle>
                  <CardDescription>Taux de complétion par ouvrier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workerPerformance.length > 0 ? (
                      workerPerformance.map((worker, index) => (
                        <motion.div
                          key={index}
                          variants={slideIn}
                          custom={index}
                          className="space-y-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{worker.name}</span>
                            <span>{worker.performance}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${worker.performance}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {worker.tasksCompleted} sur {worker.totalTasks} tâches complétées
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Aucun ouvrier disponible
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </motion.div>
  );
} 