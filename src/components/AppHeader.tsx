import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BellIcon, ClipboardListIcon, HomeIcon, LogOutIcon, UserIcon, Users, LayoutDashboard, Clock, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-accent text-accent-foreground p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold text-primary-foreground">Operax</h1>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant={isActivePath("/") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/")}
        >
          <HomeIcon size={18} />
          <span className="hidden md:inline">Accueil</span>
        </Button>
        <Button 
          variant={isActivePath("/dashboard") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/dashboard")}
        >
          <LayoutDashboard size={18} />
          <span className="hidden md:inline">Tableau de bord</span>
        </Button>
        <Button 
          variant={isActivePath("/workers") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/workers")}
        >
          <UserIcon size={18} />
          <span className="hidden md:inline">Ouvriers</span>
        </Button>
        <Button 
          variant={isActivePath("/tasks") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/tasks")}
        >
          <ClipboardListIcon size={18} />
          <span className="hidden md:inline">Tâches</span>
        </Button>
        <Button 
          variant={isActivePath("/presence") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/presence")}
        >
          <Clock size={18} />
          <span className="hidden md:inline">Présence</span>
        </Button>
        <Button 
          variant={isActivePath("/add_manager") ? "default" : "ghost"} 
          className="flex items-center gap-2" 
          onClick={() => navigate("/add_manager")}
        >
          <UserPlus size={18} />
          <span className="hidden md:inline">Chef</span>
        </Button>
        <ThemeToggle />
        <Button variant="outline" className="flex items-center gap-2" onClick={() => logout()}>
          <LogOutIcon size={18} />
          <span className="hidden md:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}
