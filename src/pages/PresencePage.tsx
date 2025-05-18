import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { AppHeader } from "@/components/AppHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Calendar, Search, Filter, AlertCircle, CheckCircle2, Clock4, Info, Users, CreditCard, Loader2, UserCheck, UserX, BadgeCheck, BadgeAlert, BadgeDollarSign, CalendarDays, LogIn, LogOut, ScanLine, Award, TrendingUp, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, slideIn, staggerContainer } from "@/lib/animations";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Fix TypeScript error for jsPDF autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (...args: any[]) => jsPDF;
  }
}

// Mock data for worker presence
interface WorkerPresence {
  id: string;
  firstName: string;
  lastName: string;
  arrivalTime: Date;
  departureTime?: Date;
  hoursToday: number;
  feeToday: number;
  totalFeeMonth: number;
  status: 'present' | 'absent' | 'late';
}

// Define the type for pointages_rfid
interface PointageRFID {
  id: number;
  rfid_uid: string;
  nom_ouvrier: string;
  heure_arrivee: string;
  heure_sortie: string | null;
  paid: boolean;
  archived_at?: string | null;
}

// Updated getStatusFromArrival to match business rules
const getStatusFromArrival = (heure_arrivee) => {
  const arrival = new Date(heure_arrivee);
  const hour = arrival.getHours();
  const minute = arrival.getMinutes();

  if (hour < 8) return "absent";
  if (hour === 8 && minute <= 15) return "present";
  if ((hour === 8 && minute > 15) || (hour === 9 && minute === 0)) return "late";
  if (hour > 9 || (hour === 9 && minute > 0)) return "absent";
  return "absent";
};

// --- Enhanced Table Styles ---
// Add custom classes for modern look
const tableCardClass =
  "shadow-lg rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md hover:shadow-2xl transition-all duration-300";
const tableHeaderClass =
  "bg-gradient-to-r from-primary/10 to-blue-100 text-primary font-semibold text-base rounded-t-xl";
const tableRowHoverClass =
  "hover:bg-primary/5 transition-colors duration-200";
const tableCellClass =
  "py-3 px-4 text-gray-700 text-sm";
const tableHeadCellClass =
  "py-3 px-4 text-gray-600 text-xs tracking-wider uppercase";

export default function PresencePage() {
  const { workers } = useApp();
  const [workerPresences, setWorkerPresences] = useState<WorkerPresence[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pointages, setPointages] = useState<PointageRFID[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedOuvrier, setSelectedOuvrier] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingPayRow, setPendingPayRow] = useState<any>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveData, setArchiveData] = useState<PointageRFID[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSearch, setArchiveSearch] = useState("");
  // Add timer to force re-render every 1 second for live hour counting
  const [, setNow] = useState(Date.now());

  // Initialize worker presences with mock data
  useEffect(() => {
    const today = new Date();
    today.setHours(8, 0, 0, 0); // Set to 8:00 AM

    const mockPresences: WorkerPresence[] = workers.map(worker => {
      const arrivalTime = new Date(today);
      const departureTime = new Date(today);
      departureTime.setHours(16, 0, 0, 0); // Set to 4:00 PM
      const currentTime = new Date();
      
      // Determine status based on current time
      let status: 'present' | 'absent' | 'late' = 'absent';
      const currentHour = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      
      if (currentHour < 8 || (currentHour === 8 && currentMinutes <= 15)) {
        status = 'present';
      } else if (currentHour < 9 || (currentHour === 9 && currentMinutes === 0)) {
        status = 'late';
      } else {
        status = 'absent';
      }

      return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        arrivalTime,
        departureTime,
        hoursToday: 0,
        feeToday: 0,
        totalFeeMonth: Math.floor(Math.random() * 1000) + 500,
        status
      };
    });

    // Simulate loading
    setTimeout(() => {
      setWorkerPresences(mockPresences);
      setIsLoading(false);
    }, 1000);
  }, [workers]);

  // Update hours, fees, and status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkerPresences(prevPresences => 
        prevPresences.map(presence => {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          
          // Update status based on current time
          let status = presence.status;
          if (currentHour < 8 || (currentHour === 8 && currentMinutes <= 15)) {
            status = 'present';
          } else if (currentHour < 9 || (currentHour === 9 && currentMinutes === 0)) {
            status = 'late';
          } else {
            status = 'absent';
          }

          // Only calculate hours and fees if worker is present or late
          let hoursToday = 0;
          let feeToday = 0;
          
          if (status !== 'absent') {
            const hoursDiff = (now.getTime() - presence.arrivalTime.getTime()) / (1000 * 60 * 60);
            hoursToday = Math.max(0, Math.min(8, hoursDiff)); // Max 8 hours per day
            feeToday = hoursToday * 5; // 5 TND per hour
          }

          return {
            ...presence,
            status,
            hoursToday: Number(hoursToday.toFixed(2)),
            feeToday: Number(feeToday.toFixed(2)),
          };
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Filter workers based on search and status
  const filteredWorkers = workerPresences.filter(presence => {
    const matchesSearch = 
      presence.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      presence.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      presence.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group pointages by worker for today, and only use the earliest valid pointage between 8:00 and 9:00
  const today = selectedDate;
  const todayStr = today.toISOString().slice(0, 10);
  const pointagesByWorker = {};

  pointages.forEach((p) => {
      const arrivee = new Date(p.heure_arrivee);
    const status = getStatusFromArrival(p.heure_arrivee);
    if (
      !p.paid &&
      (status === "present" || status === "late")
    ) {
      if (!pointagesByWorker[p.nom_ouvrier]) {
        pointagesByWorker[p.nom_ouvrier] = [];
      }
      pointagesByWorker[p.nom_ouvrier].push(p);
    }
  });

  const remunerationByOuvrier = Object.entries(pointagesByWorker).map(([nom_ouvrier, pointages]) => {
    const pointagesArr = pointages as PointageRFID[];
    const earliest = pointagesArr.reduce((min, p) => {
      return new Date(p.heure_arrivee) < new Date(min.heure_arrivee) ? p : min;
    });
    const arrivee = new Date(earliest.heure_arrivee);
    // Use selectedDate for current time if no sortie time is set and selectedDate is not today
    let sortie;
    if (earliest.heure_sortie) {
      sortie = new Date(earliest.heure_sortie);
    } else {
      // If selectedDate is today, use real current time; otherwise, use end of selectedDate (e.g., 23:59)
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      if (isToday) {
        sortie = now;
      } else {
        sortie = new Date(selectedDate);
        sortie.setHours(23, 59, 59, 999);
      }
    }
    const hours = (sortie.getTime() - arrivee.getTime()) / (1000 * 60 * 60);
    const fee = hours > 0 ? hours * 5 : 0;
    return {
      nom_ouvrier,
      totalHoursToday: hours > 0 ? hours : 0,
      totalFeeToday: fee,
      totalFeeMonth: fee,
      statusToday: getStatusFromArrival(earliest.heure_arrivee)
    };
  });

  // Calculate totals directly from remunerationByOuvrier (fee table)
  const totalHours = remunerationByOuvrier.reduce((sum, r) => sum + r.totalHoursToday, 0);
  const totalFees = remunerationByOuvrier.reduce((sum, r) => sum + r.totalFeeToday, 0);
  const totalMonthlyFees = remunerationByOuvrier.reduce((sum, r) => sum + r.totalFeeMonth, 0);

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'present':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle2 className="h-4 w-4 animate-pulse" />,
          text: 'Présent',
          pulse: 'animate-pulse'
        };
      case 'late':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <Clock4 className="h-4 w-4 animate-bounce" />,
          text: 'En retard',
          pulse: 'animate-pulse'
        };
      case 'absent':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Absent',
          pulse: ''
        };
      default:
        return {
          color: '',
          bgColor: '',
          borderColor: '',
          icon: null,
          text: '',
          pulse: ''
        };
    }
  };

  useEffect(() => {
    // Fetch initial data
    const fetchPointages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pointages_rfid")
        .select("*")
        .order("heure_arrivee", { ascending: false });
      if (!error && data) setPointages(data as PointageRFID[]);
      setIsLoading(false);
    };
    fetchPointages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("public:pointages_rfid")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pointages_rfid" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPointages((prev) => [payload.new as PointageRFID, ...prev]);
          }
          if (payload.eventType === "UPDATE") {
            setPointages((prev) =>
              prev.map((p) =>
                p.id === (payload.new as PointageRFID).id
                  ? (payload.new as PointageRFID)
                  : p
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Group pointages by nom_ouvrier and get the latest entry for each
  const latestPresenceByOuvrier = Object.values(
    pointages.reduce((acc, p) => {
      if (
        !acc[p.nom_ouvrier] ||
        new Date(p.heure_arrivee) > new Date(acc[p.nom_ouvrier].heure_arrivee)
      ) {
        acc[p.nom_ouvrier] = p;
      }
      return acc;
    }, {} as Record<string, PointageRFID>)
  );

  // PDF export function for remuneration table
  const exportRemunerationToPDF = () => {
    try {
      const doc = new jsPDF();
      const logoUrl = '/logo.png';
      const img = new window.Image();
      img.src = logoUrl;
      img.onload = function () {
        doc.addImage(img, 'PNG', 10, 8, 24, 24);
        doc.setFontSize(16);
        doc.text('Détails des Rémunérations', 40, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const columns = [
          { header: 'Ouvrier', dataKey: 'nom_ouvrier' },
          { header: 'Heures travaillées', dataKey: 'totalHoursToday' },
          { header: 'Frais', dataKey: 'totalFeeToday' }
        ];
        const rows = remunerationByOuvrier.map(r => ({
          nom_ouvrier: r.nom_ouvrier,
          totalHoursToday: r.totalHoursToday.toFixed(2) + ' h',
          totalFeeToday: r.totalFeeToday.toFixed(2) + ' TND'
        }));
        doc.autoTable({
          columns,
          body: rows,
          startY: 36,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 255, 244] },
          margin: { left: 10, right: 10 }
        });
        doc.save('remunerations.pdf');
      };
      img.onerror = function () {
        // Fallback: export without logo
        doc.setFontSize(16);
        doc.text('Détails des Rémunérations', 14, 16);
        doc.setFontSize(10);
        doc.setTextColor(100);
        const columns = [
          { header: 'Ouvrier', dataKey: 'nom_ouvrier' },
          { header: 'Heures travaillées', dataKey: 'totalHoursToday' },
          { header: 'Frais', dataKey: 'totalFeeToday' }
        ];
        const rows = remunerationByOuvrier.map(r => ({
          nom_ouvrier: r.nom_ouvrier,
          totalHoursToday: r.totalHoursToday.toFixed(2) + ' h',
          totalFeeToday: r.totalFeeToday.toFixed(2) + ' TND'
        }));
        doc.autoTable({
          columns,
          body: rows,
          startY: 24,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [46, 204, 113], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 255, 244] },
          margin: { left: 10, right: 10 }
        });
        doc.save('remunerations.pdf');
      };
    } catch (err) {
      alert('Erreur lors de l\'export PDF. Veuillez vérifier la console.');
      console.error('PDF export error:', err);
    }
  };

  // Pay handler
  const handlePay = async (r) => {
    setIsPaying(true);
    try {
      // Insert payment record
      await supabase.from('payments').insert({
        nom_ouvrier: r.nom_ouvrier,
        hours_paid: r.totalHoursToday,
        fee_paid: r.totalFeeToday
      });
      // Fetch all unpaid pointages for this ouvrier
      const { data: unpaidPointages, error: fetchError } = await supabase
        .from('pointages_rfid')
        .select('id')
        .eq('nom_ouvrier', r.nom_ouvrier)
        .eq('paid', false);
      if (fetchError) {
        toast({ title: 'Erreur', description: 'Erreur lors de la récupération des pointages à mettre à jour.', variant: 'destructive' });
        console.error('Fetch error:', fetchError);
      }
      if (unpaidPointages && unpaidPointages.length > 0) {
        const ids = unpaidPointages.map(p => p.id);
        console.log('Updating pointages with ids:', ids);
        const { error: updateError } = await supabase
          .from('pointages_rfid')
          .update({ paid: true })
          .in('id', ids);
        if (updateError) {
          toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour des pointages.', variant: 'destructive' });
          console.error('Update error:', updateError);
        }
      }
      // Refetch pointages and log them
      const { data, error } = await supabase
        .from("pointages_rfid")
        .select("*")
        .order("heure_arrivee", { ascending: false });
      if (!error && data) {
        console.log("Fetched pointages after payment:", data);
        // Debug: show any unpaid pointages for this ouvrier
        const unpaid = data.filter(p => p.nom_ouvrier.trim().toLowerCase() === r.nom_ouvrier.trim().toLowerCase() && !p.paid);
        console.log('Unpaid pointages for', r.nom_ouvrier, unpaid);
        setPointages(data);
        toast({ title: 'Paiement effectué', description: 'Le paiement a été enregistré et les heures ont été réinitialisées.', variant: 'default' });
      } else {
        toast({ title: 'Erreur', description: 'Erreur lors de la récupération des pointages.', variant: 'destructive' });
        console.error('Fetch error:', error);
      }
    } finally {
      setIsPaying(false);
    }
  };

  // View payment history
  const handleViewHistory = async (nom_ouvrier) => {
    setSelectedOuvrier(nom_ouvrier);
    setHistoryModalOpen(true);
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('nom_ouvrier', nom_ouvrier)
      .order('paid_at', { ascending: false });
    setPaymentHistory(data || []);
  };

  // Add fetch function for archived pointages (outside the component or inside, as you prefer)
  async function fetchArchivedPointages() {
    const { data, error } = await supabase
      .from('pointages_rfid_archive')
      .select('*')
      .order('heure_arrivee', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Helper for archive status
  function getArchiveStatus(heure_arrivee: string) {
    const arrival = new Date(heure_arrivee);
    const hour = arrival.getHours();
    const minute = arrival.getMinutes();

    if (hour === 8 && minute <= 15) {
      return {
        label: "Présent",
        color: "text-green-700",
        bg: "bg-green-100",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
      };
    } else if ((hour === 8 && minute > 15) || (hour === 9 && minute === 0)) {
      return {
        label: "Retard",
        color: "text-yellow-700",
        bg: "bg-yellow-100",
        icon: <Clock4 className="h-4 w-4 text-yellow-500 mr-1" />
      };
    } else {
      return {
        label: "Absent",
        color: "text-red-700",
        bg: "bg-red-100",
        icon: <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
      };
    }
  }

  // Add timer to force re-render every 1 second for live hour counting
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000); // update every 1 second
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-background"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <AppHeader />
      
      <div className="flex-1 container mx-auto p-6 space-y-6">
        {/* Filters and Search */}
        <motion.div variants={slideIn("up", "tween", 0.2, 1)}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un ouvrier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="present">Présent</SelectItem>
                    <SelectItem value="late">En retard</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar size={16} />
                  {format(selectedDate, 'PPP', { locale: fr })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          <motion.div variants={fadeIn("up", "tween", 0.2, 1)}>
            <Card className="hover:shadow-md transition-shadow h-full group hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 group-hover:animate-spin" />
                  Heures totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {totalHours.toFixed(2)}h
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ProgressBar value={(totalHours / (workers.length * 8)) * 100} max={100} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeIn("up", "tween", 0.4, 1)}>
            <Card className="hover:shadow-md transition-shadow h-full group hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 group-hover:animate-pulse" />
                  Frais journaliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  {totalFees.toFixed(2)} TND
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Moyenne: {(totalFees / (workers.length || 1)).toFixed(2)} TND/ouvrier
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeIn("up", "tween", 0.6, 1)}>
            <Card className="hover:shadow-md transition-shadow h-full group hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 group-hover:animate-bounce" />
                  Total mensuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  {totalMonthlyFees.toFixed(2)} TND
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Progression: {((totalMonthlyFees / (totalMonthlyFees * 1.2)) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Two tables side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Status Table */}
          <motion.div variants={fadeIn("up", "tween", 0.8, 1)}>
            <Card className={tableCardClass + " h-full"}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCheck className="h-5 w-5 text-primary" />
                  État de Présence
                  <HelpTooltip content="Statut de présence actuel des ouvriers" />
                </CardTitle>
                <CardDescription className="text-gray-500">Suivi des présences en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <Table>
                      <TableHeader className={tableHeaderClass}>
                        <TableRow>
                          <TableHead className={tableHeadCellClass}><UserCheck className="inline h-4 w-4 mr-1 text-primary" />Ouvrier</TableHead>
                          <TableHead className={tableHeadCellClass}><BadgeCheck className="inline h-4 w-4 mr-1 text-green-600" />Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestPresenceByOuvrier.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className={tableCellClass + " text-center py-6 text-gray-400"}>
                              Aucun pointage trouvé.
                            </TableCell>
                          </TableRow>
                        ) : (
                          latestPresenceByOuvrier.map((p) => {
                            const status = getStatusFromArrival(p.heure_arrivee);
                            return (
                              <TableRow key={p.id} className={tableRowHoverClass}>
                                <TableCell className={tableCellClass + " font-semibold flex items-center gap-2"}>
                                  <span className="inline-block w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                                    <UserCheck className="h-5 w-5" />
                                  </span>
                                  {p.nom_ouvrier}
                                </TableCell>
                                <TableCell className={tableCellClass}>
                                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-medium ${status === "present" ? "bg-green-50 border-green-200 text-green-600" : status === "late" ? "bg-yellow-50 border-yellow-200 text-yellow-600" : "bg-red-50 border-red-200 text-red-500"}`}>
                                    {status === "present" ? <BadgeCheck className="h-4 w-4 animate-pulse text-green-600" /> : status === "late" ? <Clock4 className="h-4 w-4 animate-bounce text-yellow-600" /> : <BadgeAlert className="h-4 w-4 text-red-500" />}
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* RFID Entry Times Table */}
          <motion.div variants={fadeIn("up", "tween", 0.8, 1)}>
            <Card className={tableCardClass + " h-full"}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Pointages RFID</CardTitle>
                </div>
                <Button
                  onClick={async () => {
                    setShowArchive(true);
                    setLoadingArchive(true);
                    setArchiveError(null);
                    try {
                      const data = await fetchArchivedPointages();
                      console.log('ARCHIVE FETCH RESULT:', data);
                      setArchiveData(data);
                    } catch (e) {
                      setArchiveError("Erreur lors du chargement des archives.");
                      console.error('ARCHIVE FETCH ERROR:', e);
                    } finally {
                      setLoadingArchive(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow px-4 py-2 flex items-center gap-2"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Afficher Archives
                </Button>
              </CardHeader>
              <CardDescription className="text-gray-500 px-6">Enregistrements des pointages</CardDescription>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={tableHeaderClass}>
                        <tr>
                          <th className={tableHeadCellClass}><UserCheck className="inline h-4 w-4 mr-1 text-primary" />Ouvrier</th>
                          <th className={tableHeadCellClass}><LogIn className="inline h-4 w-4 mr-1 text-green-600" />Heure d'arrivée</th>
                          <th className={tableHeadCellClass}><LogOut className="inline h-4 w-4 mr-1 text-red-500" />Heure de sortie</th>
                          <th className={tableHeadCellClass}><Award className="inline h-4 w-4 mr-1 text-blue-600" />ID RFID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointages.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={tableCellClass + " text-center py-6 text-gray-400"}>
                              Aucun pointage trouvé.
                            </td>
                          </tr>
                        ) : (
                          pointages.map((p) => (
                            <tr key={p.id} className={tableRowHoverClass}>
                              <td className={tableCellClass + " font-semibold flex items-center gap-2"}><UserCheck className="h-4 w-4 text-primary" />{p.nom_ouvrier}</td>
                              <td className={tableCellClass}><LogIn className="h-4 w-4 text-green-600 mr-1 inline" />{new Date(p.heure_arrivee).toLocaleString()}</td>
                              <td className={tableCellClass}><LogOut className="h-4 w-4 text-red-500 mr-1 inline" />{p.heure_sortie ? new Date(p.heure_sortie).toLocaleString() : <span className="text-green-500 font-bold">-</span>}</td>
                              <td className={tableCellClass + " text-blue-600 font-mono flex items-center gap-2"}><Award className="h-4 w-4 text-blue-600" />{p.rfid_uid}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Fees Table at the bottom */}
        <motion.div variants={fadeIn("up", "tween", 1, 1)}>
          <Card className={tableCardClass}>
            <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Détails des Rémunérations</CardTitle>
                <HelpTooltip content="Calcul des frais et heures travaillées" />
              </div>
              <Button
                onClick={exportRemunerationToPDF}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-full shadow-md px-6 py-2 flex items-center gap-2 hover:scale-105 hover:from-green-500 hover:to-blue-600 transition-all duration-200"
                style={{ minWidth: 180 }}
              >
                <Award className="h-5 w-5 mr-1" />
                Exporter en PDF
              </Button>
            </CardHeader>
            <CardDescription className="text-gray-500 px-6">Récapitulatif des rémunérations par ouvrier</CardDescription>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <Table>
                    <TableHeader className={tableHeaderClass}>
                      <TableRow className="hover:bg-muted/50">
                        <TableHead className={tableHeadCellClass + " font-semibold"}><UserCheck className="inline h-4 w-4 mr-1 text-primary" />Ouvrier</TableHead>
                        <TableHead className={tableHeadCellClass + " font-semibold"}><Clock className="inline h-4 w-4 mr-1 text-blue-600" />Heures Travaillées</TableHead>
                        <TableHead className={tableHeadCellClass + " font-semibold"}><BadgeDollarSign className="inline h-4 w-4 mr-1 text-green-600" />Frais Journaliers</TableHead>
                        <TableHead className={tableHeadCellClass + " font-semibold"}><TrendingUp className="inline h-4 w-4 mr-1 text-blue-600" />Total du Mois</TableHead>
                        <TableHead className={tableHeadCellClass + " font-semibold"}><Award className="inline h-4 w-4 mr-1 text-yellow-600" />Progression</TableHead>
                        <TableHead className={tableHeadCellClass + " font-semibold"}><Award className="inline h-4 w-4 mr-1 text-yellow-600" />Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remunerationByOuvrier.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className={tableCellClass + " text-center py-6 text-gray-400"}>
                            Aucun pointage trouvé.
                          </TableCell>
                        </TableRow>
                      ) : (
                        remunerationByOuvrier.map((r) => (
                          <TableRow key={r.nom_ouvrier} className={tableRowHoverClass}>
                            <TableCell className={tableCellClass + " font-semibold flex items-center gap-2"}>
                              <UserCheck className="h-4 w-4 text-primary" />
                              <span className="inline-block w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-base">
                                {r.nom_ouvrier.split("*")[1] || r.nom_ouvrier[0]}
                              </span>
                              {r.nom_ouvrier}
                            </TableCell>
                            <TableCell className={tableCellClass}><Clock className="h-4 w-4 text-blue-600 mr-1 inline" />
                              {r.totalHoursToday.toFixed(2)}h
                            </TableCell>
                            <TableCell className={tableCellClass}><BadgeDollarSign className="h-4 w-4 text-green-600 mr-1 inline" />{r.totalFeeToday.toFixed(2)} TND</TableCell>
                            <TableCell className={tableCellClass}><TrendingUp className="h-4 w-4 text-blue-600 mr-1 inline" />{r.totalFeeMonth.toFixed(2)} TND</TableCell>
                            <TableCell className={tableCellClass}>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${r.totalFeeMonth > 0 ? (r.totalFeeToday / r.totalFeeMonth) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 ml-2 align-middle">
                                <Award className="h-4 w-4 text-yellow-600 mr-1 inline" />
                                {r.totalFeeMonth > 0
                                  ? ((r.totalFeeToday / r.totalFeeMonth) * 100).toFixed(1) + "%"
                                  : "0%"}
                              </span>
                            </TableCell>
                            <TableCell className={tableCellClass + " flex gap-2"}>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center gap-1 shadow"
                                disabled={isPaying || r.totalHoursToday === 0}
                                onClick={() => { setPendingPayRow(r); setConfirmPayOpen(true); }}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Payer
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleViewHistory(r.nom_ouvrier)}>
                                Historique
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historique des paiements - {selectedOuvrier}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Heures payées</th>
                  <th className="px-4 py-2">Frais payés</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-4">Aucun paiement trouvé.</td></tr>
                ) : paymentHistory.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{new Date(p.paid_at).toLocaleString()}</td>
                    <td className="px-4 py-2 font-bold text-blue-700">
                      {Number(p.hours_paid).toFixed(2)} <span className="text-xs font-semibold bg-blue-100 text-blue-700 rounded px-2 py-0.5 ml-1">h</span>
                    </td>
                    <td className="px-4 py-2 font-bold text-green-700">
                      {Number(p.fee_paid).toFixed(2)}
                      <span className="text-xs font-semibold bg-green-100 text-green-700 rounded px-2 py-0.5 ml-1">TND</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Confirmation Dialog */}
      <Dialog open={confirmPayOpen} onOpenChange={setConfirmPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Êtes-vous sûr de vouloir payer <b>{pendingPayRow?.nom_ouvrier}</b> pour <b>{pendingPayRow?.totalHoursToday?.toFixed(2)} h</b> et <b>{pendingPayRow?.totalFeeToday?.toFixed(2)} TND</b> ?
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmPayOpen(false)}>Annuler</Button>
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold flex items-center gap-1"
              disabled={isPaying}
              onClick={async () => {
                setConfirmPayOpen(false);
                await handlePay(pendingPayRow);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add the archive modal at the bottom of the JSX, but inside the PresencePage return */}
      <Dialog open={showArchive} onOpenChange={setShowArchive}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archives des Pointages RFID</DialogTitle>
          </DialogHeader>
          {loadingArchive ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : archiveError ? (
            <div className="text-red-500">{archiveError}</div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <input
                type="text"
                placeholder="Rechercher par RFID ou nom..."
                value={archiveSearch}
                onChange={e => setArchiveSearch(e.target.value)}
                className="mb-4 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFID UID</TableHead>
                    <TableHead>Nom Ouvrier</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Archivé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(archiveData.filter(row =>
                    row.rfid_uid.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                    row.nom_ouvrier.toLowerCase().includes(archiveSearch.toLowerCase())
                  )).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Aucune archive trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    archiveData.filter(row =>
                      row.rfid_uid.toLowerCase().includes(archiveSearch.toLowerCase()) ||
                      row.nom_ouvrier.toLowerCase().includes(archiveSearch.toLowerCase())
                    ).map((row) => {
                      const status = getArchiveStatus(row.heure_arrivee);
                      return (
                        <TableRow key={row.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="font-mono">{row.rfid_uid}</TableCell>
                          <TableCell>{row.nom_ouvrier}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center font-semibold px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {row.archived_at ? new Date(row.archived_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 