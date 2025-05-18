
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  // Redirection vers la page d'accueil si l'utilisateur est connecté
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  // Redirection vers la page de connexion si l'utilisateur n'est pas connecté
  return <Navigate to="/login" replace />;
};

export default Index;
