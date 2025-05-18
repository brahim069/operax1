import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList, Users, Loader2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, slideIn, scaleIn } from "@/lib/animations";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useEffect, useState, useCallback } from "react";
import { Task } from "@/types";
import { DashboardSummary } from "@/components/home/DashboardSummary";
import { HeroSection } from "@/components/home/HeroSection";

// Update the custom style classes
const gradientBgClass = "bg-gradient-to-br from-blue-50 via-white to-blue-100";
const cardHoverClass = "hover:shadow-xl hover:scale-[1.02] transition-all duration-300";
const statCardClass = "bg-white/80 backdrop-blur-sm border border-gray-200/50";
const taskItemClass = "bg-white/90 backdrop-blur-sm border border-gray-200/50 hover:border-primary/30";
const sectionSpacing = "mb-6"; // Add consistent spacing

export default function HomePage() {
  const { user } = useAuth();
  const { tasks, workers, toggleTaskCompletion, isLoading } = useApp();
  const navigate = useNavigate();
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate dashboard metrics
  const totalWorkers = workers.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasks = totalTasks - completedTasks;

  // Animation variants
  const containerVariants = fadeIn("up", "tween", 0, 0.5);
  const cardVariants = slideIn("up", "tween", 0.2, 0.5);

  // Update todaysTasks whenever tasks change
  useEffect(() => {
    const today = new Date();
    const filtered = tasks.filter(
      (task) =>
        task.day === today.getDate() &&
        task.month === today.getMonth() + 1 &&
        task.year === today.getFullYear()
    );
    setTodaysTasks(filtered);
  }, [tasks]);

  // Handle task completion toggle with loading state
  const handleToggleCompletion = useCallback(async (taskId: string) => {
    try {
      setIsUpdating(true);
      await toggleTaskCompletion(taskId);
    } finally {
      setIsUpdating(false);
    }
  }, [toggleTaskCompletion]);

  // Trouver le nom d'un ouvrier par son ID
  const getWorkerName = (workerId?: string) => {
    if (!workerId) return "Non assigné";
    const worker = workers.find(w => w.id === workerId);
    return worker ? `${worker.firstName} ${worker.lastName}` : "Inconnu";
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className={`min-h-screen ${gradientBgClass} flex flex-col`}
    >
      <AppHeader />

      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6"> {/* Add consistent vertical spacing */}
          {/* Hero Section with Stats */}
          <motion.div variants={cardVariants}>
            <HeroSection
              user={user}
              stats={{
                totalWorkers,
                completedTasks,
                pendingTasks,
                completionRate
              }}
            />
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div
            variants={cardVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" // Reduced gap
          >
            {/* Workers Stats Card */}
            <motion.div variants={scaleIn}>
              <Card className={`${statCardClass} ${cardHoverClass} h-full`}> {/* Added h-full */}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    Ouvriers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-full"> {/* Added h-full */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-4xl font-bold text-primary">{workers.length}</p>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-500">↑</span> 12%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Ouvriers actifs</p>
                    <Button 
                      onClick={() => navigate("/workers")}
                      className="mt-auto w-full bg-primary/10 hover:bg-primary/20 text-primary" // Added mt-auto
                    >
                      Gérer les ouvriers
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tasks Stats Card */}
            <motion.div variants={scaleIn}>
              <Card className={`${statCardClass} ${cardHoverClass} h-full`}> {/* Added h-full */}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <ClipboardList className="h-5 w-5 text-blue-500" />
                    </div>
                    Tâches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-full"> {/* Added h-full */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-4xl font-bold text-blue-500">{tasks.length}</p>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-500">↑</span> 8%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Tâches programmées</p>
                    <Button 
                      onClick={() => navigate("/tasks")}
                      className="mt-auto w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500" // Added mt-auto
                    >
                      Voir l'agenda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completion Rate Card */}
            <motion.div variants={scaleIn}>
              <Card className={`${statCardClass} ${cardHoverClass} h-full`}> {/* Added h-full */}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    Taux de complétion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-full"> {/* Added h-full */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-4xl font-bold text-green-500">{completionRate}%</p>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-500">↑</span> 5%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Tâches terminées</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Tasks Card */}
            <motion.div variants={scaleIn}>
              <Card className={`${statCardClass} ${cardHoverClass} h-full`}> {/* Added h-full */}
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    En attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-full"> {/* Added h-full */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-4xl font-bold text-yellow-500">{pendingTasks}</p>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-red-500">↓</span> 3%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Tâches en cours</p>
                    <Button 
                      onClick={() => navigate("/tasks")}
                      className="mt-auto w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500" // Added mt-auto
                    >
                      Voir les tâches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Today's Tasks Section */}
          <motion.div variants={cardVariants}>
            <Card className={`${statCardClass} ${cardHoverClass}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      Tâches du jour
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/tasks")}
                    className="bg-white/50 hover:bg-white/80"
                  >
                    Ajouter une tâche
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : todaysTasks.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      variants={containerVariants}
                      className="space-y-3"
                    >
                      {todaysTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          variants={scaleIn}
                          custom={index}
                          className={`${taskItemClass} flex items-center justify-between p-4 rounded-xl`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-4">
                            <Button
                              variant={task.completed ? "default" : "outline"}
                              size="icon"
                              className={`h-9 w-9 rounded-full ${
                                task.completed 
                                  ? 'bg-green-500 hover:bg-green-600' 
                                  : 'hover:bg-green-50 hover:text-green-500'
                              }`}
                              onClick={() => handleToggleCompletion(task.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            <div>
                              <p className={`font-medium ${
                                task.completed 
                                  ? 'line-through text-muted-foreground' 
                                  : 'text-foreground'
                              }`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {getWorkerName(task.workerId).split(' ').map(n => n[0]).join('')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {getWorkerName(task.workerId)}
                                </p>
                              </div>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground max-w-md line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <ClipboardList className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-2">Aucune tâche programmée pour aujourd'hui</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Commencez par ajouter des tâches à l'agenda
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/tasks")}
                      className="bg-white/50 hover:bg-white/80"
                    >
                      Ajouter une tâche
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
