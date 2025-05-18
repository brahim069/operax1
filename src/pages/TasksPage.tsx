import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Calendar, CheckCircle, CheckCircle2, ClipboardList, Clock, UserCheck, BadgeCheck, Award, Loader2, Clock4 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Task, Worker } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { AnimatedTable } from "@/components/ui/animated-table";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SearchFilter } from "@/components/ui/search-filter";

// Noms des mois en français
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Générer les années (année actuelle et les 5 suivantes)
const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);

// --- Enhanced Table Styles (from PresencePage) ---
const tableCardClass = "shadow-lg rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md hover:shadow-2xl transition-all duration-300";
const tableHeaderClass = "bg-gradient-to-r from-primary/10 to-blue-100 text-primary font-semibold text-base rounded-t-xl";
const tableRowHoverClass = "hover:bg-primary/5 transition-colors duration-200";
const tableCellClass = "py-3 px-4 text-gray-700 text-sm";
const tableHeadCellClass = "py-3 px-4 text-gray-600 text-xs tracking-wider uppercase";

export default function TasksPage() {
  const { tasks, workers, addTask, updateTask, deleteTask, toggleTaskCompletion, fetchTasks } = useApp();
  const { toast } = useToast();
  
  // État pour le filtrage et la pagination
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // État pour les dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // État pour les formulaires
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskWorkerId, setTaskWorkerId] = useState("");
  const [taskDay, setTaskDay] = useState("");
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, completed, pending
  const [workerFilter, setWorkerFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date"); // date, title, status
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Trouver le nom d'un ouvrier par son ID
  const getWorkerName = (workerId?: string) => {
    if (!workerId) return "Non assigné";
    const worker = workers.find(w => w.id === workerId);
    return worker ? `${worker.firstName} ${worker.lastName}` : "Inconnu";
  };
  
  // Obtenir les tâches filtrées par mois et année
  const filteredTasks = tasks.filter(
    (task) => 
      task.month.toString() === selectedMonth && 
      task.year.toString() === selectedYear
  );
  
  // Enhanced filtered tasks with search and additional filters
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Month and year filter
        const matchesMonthYear = 
          task.month.toString() === selectedMonth && 
          task.year.toString() === selectedYear;

        // Search query filter
        const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getWorkerName(task.workerId).toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = 
          statusFilter === "all" ||
          (statusFilter === "completed" && task.completed) ||
          (statusFilter === "pending" && !task.completed);

        // Worker filter
        const matchesWorker =
          workerFilter === "all" ||
          (workerFilter === "unassigned" && !task.workerId) ||
          task.workerId === workerFilter;

        return matchesMonthYear && matchesSearch && matchesStatus && matchesWorker;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date":
            return (
              new Date(a.year, a.month - 1, a.day).getTime() -
              new Date(b.year, b.month - 1, b.day).getTime()
            );
          case "title":
            return a.title.localeCompare(b.title);
          case "status":
            return (a.completed === b.completed) ? 0 : a.completed ? -1 : 1;
          default:
            return 0;
        }
      });
  }, [
    tasks,
    selectedMonth,
    selectedYear,
    searchQuery,
    statusFilter,
    workerFilter,
    sortBy
  ]);
  
  // Générer les jours du mois sélectionné
  const getDaysInMonth = () => {
    return new Date(
      parseInt(selectedYear),
      parseInt(selectedMonth) - 1, 
      0
    ).getDate();
  };
  
  // Reset du formulaire
  const resetForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskWorkerId("");
    setTaskDay("");
    setSelectedTask(null);
  };
  
  // Ouvrir la boîte de dialogue d'ajout
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  // Ouvrir la boîte de dialogue d'édition
  const handleOpenEditDialog = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskWorkerId(task.workerId || "");
    setTaskDay(task.day?.toString() || "");
    setIsEditDialogOpen(true);
  };
  
  // Ajouter une tâche
  const handleAddTask = async () => {
    if (!taskTitle || !taskDay) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    try {
      console.log("[DEBUG] Attempting to add task:", {
        title: taskTitle,
        description: taskDescription,
        workerId: taskWorkerId === "none" ? undefined : taskWorkerId || undefined,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        day: parseInt(taskDay),
      });
      await addTask({
        title: taskTitle,
        description: taskDescription || undefined,
        workerId: taskWorkerId === "none" ? undefined : taskWorkerId || undefined,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        day: parseInt(taskDay),
      });
      console.log("[DEBUG] Task added! Current tasks:", tasks);
      // If fetchTasks is available from context/hook, call it to force refresh
      if (typeof fetchTasks === 'function') {
        await fetchTasks();
        console.log("[DEBUG] Forced fetchTasks after add. Updated tasks:", tasks);
      }
      toast({
        title: "Tâche ajoutée",
        description: `La tâche "${taskTitle}" a été ajoutée avec succès`,
      });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('[DEBUG] Error adding task:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la tâche",
        variant: "destructive",
      });
    }
  };
  
  // Modifier une tâche
  const handleEditTask = async () => {
    if (!selectedTask || !taskTitle || !taskDay) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    await updateTask({
      ...selectedTask,
      title: taskTitle,
      description: taskDescription || undefined,
      workerId: taskWorkerId || undefined,
      month: parseInt(selectedMonth),
      year: parseInt(selectedYear),
      day: parseInt(taskDay),
    });
    
    toast({
      title: "Tâche modifiée",
      description: `La tâche "${taskTitle}" a été modifiée avec succès`,
    });
    
    resetForm();
    setIsEditDialogOpen(false);
  };
  
  // Supprimer une tâche
  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    
    toast({
      title: "Tâche supprimée",
      description: "La tâche a été supprimée avec succès",
    });
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Agenda des Tâches
              <HelpTooltip 
                content="Gérez et suivez toutes les tâches de l'atelier"
                side="right"
              />
            </h1>
            <div className="flex gap-2">
              <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Ajouter une tâche
              </Button>
            </div>
          </div>
          
          <div>
            <Card className={tableCardClass + " shadow-md border-primary/10 mb-6"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Agenda des tâches
                  <HelpTooltip 
                    content="Filtrez les tâches par mois et année"
                    side="right"
                  />
                </CardTitle>
                <CardDescription>Gestion des tâches pour les 12 mois de l'année</CardDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="month">Mois</Label>
                    <Select 
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Sélectionnez un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="year">Année</Label>
                    <Select 
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Sélectionnez une année" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SearchFilter
                  searchPlaceholder="Rechercher une tâche..."
                  onSearchChange={setSearchQuery}
                  filters={[
                    {
                      id: "sort",
                      label: "Trier par",
                      options: [
                        { value: "date", label: "Date" },
                        { value: "title", label: "Titre" },
                        { value: "status", label: "Statut" }
                      ],
                      value: sortBy,
                      onChange: setSortBy
                    },
                    {
                      id: "status",
                      label: "Statut",
                      options: [
                        { value: "all", label: "Tous" },
                        { value: "completed", label: "Terminées" },
                        { value: "pending", label: "En cours" }
                      ],
                      value: statusFilter,
                      onChange: setStatusFilter
                    },
                    {
                      id: "worker",
                      label: "Ouvrier assigné",
                      options: [
                        { value: "all", label: "Tous" },
                        { value: "unassigned", label: "Non assignées" },
                        ...workers.map(worker => ({
                          value: worker.id,
                          label: `${worker.firstName} ${worker.lastName}`
                        }))
                      ],
                      value: workerFilter,
                      onChange: setWorkerFilter
                    }
                  ]}
                  className="mt-4"
                />
              </CardHeader>
              <CardContent>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <Table>
                    <TableHeader className={tableHeaderClass}>
                      <TableRow>
                        <TableHead className={tableHeadCellClass}><Clock className="inline h-4 w-4 mr-1 text-blue-600" />Jour</TableHead>
                        <TableHead className={tableHeadCellClass}><ClipboardList className="inline h-4 w-4 mr-1 text-primary" />Titre</TableHead>
                        <TableHead className={tableHeadCellClass}><ClipboardList className="inline h-4 w-4 mr-1 text-primary" />Description</TableHead>
                        <TableHead className={tableHeadCellClass}><UserCheck className="inline h-4 w-4 mr-1 text-primary" />Assigné à</TableHead>
                        <TableHead className={tableHeadCellClass}><BadgeCheck className="inline h-4 w-4 mr-1 text-green-600" />Statut</TableHead>
                        <TableHead className={tableHeadCellClass}><Award className="inline h-4 w-4 mr-1 text-yellow-600" />Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="ml-2">Chargement...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredAndSortedTasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <ClipboardList className="h-8 w-8 mb-2" />
                              <p className="font-medium">{searchQuery ? "Aucun résultat trouvé" : "Aucune tâche trouvée"}</p>
                              <p className="text-sm mt-1">
                                {searchQuery 
                                  ? "Essayez de modifier vos critères de recherche"
                                  : "Commencez par ajouter des tâches à l'agenda"}
                              </p>
                              {!searchQuery && (
                                <Button onClick={handleOpenAddDialog} className="mt-4">
                                  Ajouter une tâche
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedTasks.map((task) => (
                          <TableRow key={task.id} className={tableRowHoverClass}>
                            <TableCell className={tableCellClass}>{task.day}</TableCell>
                            <TableCell className={tableCellClass + " font-medium"}>{task.title}</TableCell>
                            <TableCell className={tableCellClass}>{task.description || "-"}</TableCell>
                            <TableCell className={tableCellClass + " flex items-center gap-2"}>
                              <UserCheck className="h-4 w-4 text-primary" />
                              {getWorkerName(task.workerId)}
                            </TableCell>
                            <TableCell className={tableCellClass}>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-medium ${task.completed ? "bg-green-50 border-green-200 text-green-600" : "bg-yellow-50 border-yellow-200 text-yellow-600"}`}>
                                {task.completed ? <BadgeCheck className="h-4 w-4 animate-pulse text-green-600" /> : <Clock4 className="h-4 w-4 animate-bounce text-yellow-600" />}
                                {task.completed ? "Terminée" : "En cours"}
                              </span>
                            </TableCell>
                            <TableCell className={tableCellClass + " flex gap-2"}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(task)}
                                className="hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Cette action est irréversible. Cela supprimera définitivement la tâche.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MONTHS.map((month, index) => {
              const monthNumber = index + 1;
              const tasksCount = tasks.filter(
                task => task.month === monthNumber && task.year.toString() === selectedYear
              ).length;
              
              return (
                <Card 
                  key={monthNumber} 
                  className={`cursor-pointer hover:border-primary/30 transition-colors ${
                    parseInt(selectedMonth) === monthNumber ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedMonth(monthNumber.toString())}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>{month}</span>
                      <span className="text-sm px-2 py-1 bg-secondary rounded-full">
                        {tasksCount} tâches
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      
      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une tâche</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer une nouvelle tâche
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de la tâche</Label>
              <Input 
                id="title"
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Entrez le titre de la tâche"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input 
                id="description"
                value={taskDescription} 
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Entrez la description de la tâche"
              />
            </div>
            <div>
              <Label htmlFor="worker">Ouvrier (optionnel)</Label>
              <Select 
                value={taskWorkerId}
                onValueChange={setTaskWorkerId}
              >
                <SelectTrigger id="worker">
                  <SelectValue placeholder="Sélectionnez un ouvrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">Année</Label>
                <Select 
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="month">Mois</Label>
                <Select 
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="day">Jour</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max={getDaysInMonth()}
                  value={taskDay}
                  onChange={(e) => setTaskDay(e.target.value)}
                  placeholder={`Jour (1-${getDaysInMonth()})`}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTask}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la tâche</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la tâche
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Titre de la tâche</Label>
              <Input 
                id="edit-title"
                value={taskTitle} 
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Entrez le titre de la tâche"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (optionnel)</Label>
              <Input 
                id="edit-description"
                value={taskDescription} 
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Entrez la description de la tâche"
              />
            </div>
            <div>
              <Label htmlFor="edit-worker">Ouvrier (optionnel)</Label>
              <Select 
                value={taskWorkerId}
                onValueChange={setTaskWorkerId}
              >
                <SelectTrigger id="edit-worker">
                  <SelectValue placeholder="Sélectionnez un ouvrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-day">Jour</Label>
              <Input
                id="edit-day"
                type="number"
                min="1"
                max={getDaysInMonth()}
                value={taskDay}
                onChange={(e) => setTaskDay(e.target.value)}
                placeholder={`Entrez le jour (1-${getDaysInMonth()})`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditTask}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
