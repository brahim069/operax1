import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, CreditCard, User, Loader2, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Worker } from "@/types";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { AnimatedTable } from "@/components/ui/animated-table";
import { FormFeedback } from "@/components/ui/form-feedback";
import { SearchFilter } from "@/components/ui/search-filter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Add these custom table style classes after the imports
const tableCardClass = "shadow-lg rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md hover:shadow-2xl transition-all duration-300";
const tableHeaderClass = "bg-gradient-to-r from-primary/10 to-blue-100 text-primary font-semibold text-base rounded-t-xl";
const tableRowHoverClass = "hover:bg-primary/5 transition-colors duration-200";
const tableCellClass = "py-3 px-4 text-gray-700 text-sm";
const tableHeadCellClass = "py-3 px-4 text-gray-600 text-xs tracking-wider uppercase";

export default function WorkersPage() {
  const { workers, addWorker, updateWorker, deleteWorker, tasks } = useApp();
  const { toast } = useToast();
  
  console.log('WorkersPage component mounted');
  console.log('Workers data from context:', workers);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rfidId, setRfidId] = useState("");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, date
  const [hasTasksFilter, setHasTasksFilter] = useState("all"); // all, with-tasks, without-tasks
  
  // Filtered and sorted workers
  const filteredWorkers = useMemo(() => {
    console.log('Recalculating filtered workers');
    console.log('Current search query:', searchQuery);
    console.log('Current sort by:', sortBy);
    console.log('Current hasTasksFilter:', hasTasksFilter);
    console.log('Initial workers for filtering:', workers);
    return workers
      .filter(worker => {
        const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
          worker.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          worker.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          worker.rfidId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTaskFilter = 
          hasTasksFilter === "all" ||
          (hasTasksFilter === "with-tasks" && tasks.some(t => t.workerId === worker.id)) ||
          (hasTasksFilter === "without-tasks" && !tasks.some(t => t.workerId === worker.id));

        return matchesSearch && matchesTaskFilter;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        } else if (sortBy === "date") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [workers, searchQuery, sortBy, hasTasksFilter, tasks]);
  
  console.log('Filtered workers:', filteredWorkers);
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const simulateRFIDScan = () => {
    const randomRFID = `RF-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setRfidId(randomRFID);
    
    toast({
      title: "Badge RFID détecté",
      description: `Badge ID: ${randomRFID}`,
      duration: 3000,
    });
  };
  
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setRfidId("");
    setSelectedWorker(null);
  };
  
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };
  
  const handleOpenEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setFirstName(worker.firstName);
    setLastName(worker.lastName);
    setRfidId(worker.rfidId);
    setIsEditDialogOpen(true);
  };
  
  const handleAddWorker = async () => {
    if (!firstName || !lastName || !rfidId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    if (workers.some(w => w.rfidId === rfidId)) {
      toast({
        title: "Erreur",
        description: "Ce badge RFID est déjà attribué à un ouvrier",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addWorker({
        firstName,
        lastName,
        rfidId,
      });
      
      toast({
        title: "Ouvrier ajouté",
        description: `${firstName} ${lastName} a été ajouté avec succès`,
      });
      
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };
  
  const handleEditWorker = async () => {
    if (!selectedWorker || !firstName || !lastName || !rfidId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    if (workers.some(w => w.rfidId === rfidId && w.id !== selectedWorker.id)) {
      toast({
        title: "Erreur",
        description: "Ce badge RFID est déjà attribué à un autre ouvrier",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateWorker({
        ...selectedWorker,
        firstName,
        lastName,
        rfidId,
      });
      
      toast({
        title: "Ouvrier modifié",
        description: `${firstName} ${lastName} a été modifié avec succès`,
      });
      
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteWorker = async (id: string) => {
    const hasAssignedTasks = tasks.some(task => task.workerId === id);
    
    await deleteWorker(id);
    
    if (hasAssignedTasks) {
      toast({
        title: "Ouvrier supprimé",
        description: "L'ouvrier et ses tâches assignées ont été supprimés",
      });
    } else {
      toast({
        title: "Ouvrier supprimé",
        description: "L'ouvrier a été supprimé avec succès",
      });
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      return 'Date non définie';
    }
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Date invalide';
    }
  };
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workerToDeleteId, setWorkerToDeleteId] = useState<string | null>(null);
  
  return (
    <div
      className="min-h-screen bg-background flex flex-col"
    >
      <AppHeader />
      
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex justify-between items-center mb-6"
          >
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Gestion des Ouvriers
              <HelpTooltip 
                content="Gérez les ouvriers et leurs badges RFID"
                side="right"
              />
            </h1>
            <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Ajouter un ouvrier
            </Button>
          </div>
          
          <div>
            <Card className={`${tableCardClass} shadow-md border-primary/10`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Liste des ouvriers
                  <HelpTooltip 
                    content="Consultez et gérez la liste des ouvriers de l'atelier"
                    side="right"
                  />
                </CardTitle>
                <CardDescription>Gestion des ouvriers et de leurs badges RFID</CardDescription>
                <SearchFilter
                  searchPlaceholder="Rechercher un ouvrier..."
                  onSearchChange={setSearchQuery}
                  filters={[
                    {
                      id: "sort",
                      label: "Trier par",
                      options: [
                        { value: "name", label: "Nom" },
                        { value: "date", label: "Date d'ajout" }
                      ],
                      value: sortBy,
                      onChange: setSortBy
                    },
                    {
                      id: "tasks",
                      label: "Tâches assignées",
                      options: [
                        { value: "all", label: "Tous" },
                        { value: "with-tasks", label: "Avec tâches" },
                        { value: "without-tasks", label: "Sans tâches" }
                      ],
                      value: hasTasksFilter,
                      onChange: setHasTasksFilter
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
                        <TableHead className={tableHeadCellClass}>Nom</TableHead>
                        <TableHead className={tableHeadCellClass}>Prénom</TableHead>
                        <TableHead className={tableHeadCellClass}>Badge RFID</TableHead>
                        <TableHead className={tableHeadCellClass}>Date d'ajout</TableHead>
                        <TableHead className={`${tableHeadCellClass} text-right`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <span className="ml-2">Chargement...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredWorkers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <Users className="h-8 w-8 mb-2" />
                              <p className="font-medium">{searchQuery ? "Aucun résultat trouvé" : "Aucun ouvrier trouvé"}</p>
                              <p className="text-sm mt-1">
                                {searchQuery 
                                  ? "Essayez de modifier vos critères de recherche"
                                  : "Commencez par ajouter des ouvriers à l'atelier"}
                              </p>
                              {!searchQuery && (
                                <Button onClick={handleOpenAddDialog} className="mt-4">
                                  Ajouter un ouvrier
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWorkers.map((worker) => (
                          <TableRow key={worker.id} className={tableRowHoverClass}>
                            <TableCell className={tableCellClass}>{worker.lastName}</TableCell>
                            <TableCell className={tableCellClass}>{worker.firstName}</TableCell>
                            <TableCell className={tableCellClass}>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span>{worker.rfidId}</span>
                              </div>
                            </TableCell>
                            <TableCell className={tableCellClass}>{formatDate(worker.createdAt)}</TableCell>
                            <TableCell className={`${tableCellClass} text-right`}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setWorkerToDeleteId(worker.id);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

          {/* Add Worker Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel ouvrier</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouvel ouvrier
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rfid">Badge RFID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rfid"
                      value={rfidId}
                      onChange={(e) => setRfidId(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={simulateRFIDScan}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddWorker}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Worker Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier un ouvrier</DialogTitle>
                <DialogDescription>
                  Modifiez les informations de l'ouvrier
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editLastName">Nom</Label>
                  <Input
                    id="editLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editFirstName">Prénom</Label>
                  <Input
                    id="editFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editRfid">Badge RFID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="editRfid"
                      value={rfidId}
                      onChange={(e) => setRfidId(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={simulateRFIDScan}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditWorker}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation AlertDialog (controlled by state) */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Cela supprimera définitivement l'ouvrier
                  et toutes ses tâches assignées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (workerToDeleteId) {
                      handleDeleteWorker(workerToDeleteId);
                    }
                    setIsDeleteDialogOpen(false);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}
