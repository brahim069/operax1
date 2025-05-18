import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { KeyIcon, Eye, EyeOff, MailIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";

// Password strength checker
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.match(/[A-Z]/)) strength += 1;
  if (password.match(/[0-9]/)) strength += 1;
  if (password.match(/[^A-Za-z0-9]/)) strength += 1;
  return strength;
};

const getStrengthColor = (strength: number) => {
  switch (strength) {
    case 0: return "bg-red-500";
    case 1: return "bg-red-500";
    case 2: return "bg-yellow-500";
    case 3: return "bg-blue-500";
    case 4: return "bg-green-500";
    default: return "bg-gray-500";
  }
};

const getStrengthText = (strength: number) => {
  switch (strength) {
    case 0: return "Very Weak";
    case 1: return "Weak";
    case 2: return "Medium";
    case 3: return "Strong";
    case 4: return "Very Strong";
    default: return "";
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      // Success animation before navigation
      const element = document.querySelector('.login-card');
      if (element) {
        await new Promise<void>((resolve) => {
          element.classList.add('scale-105', 'opacity-0');
          element.addEventListener('transitionend', () => resolve(), { once: true });
        });
      }
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Erreur d'authentification",
        description: error instanceof Error ? error.message : "Identifiants incorrects",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Réinitialisation du mot de passe",
      description: "Cette fonctionnalité sera bientôt disponible.",
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-background"
      role="main"
      aria-label="Login page"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-md w-full p-4"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-8"
        >
          <img 
            src="/-uploads/1b7efc57-798b-4499-b4ab-67637cc513aa.png" 
            alt="Operax Logo" 
            className="w-32 h-32"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="login-card border-primary/20 shadow-lg transition-all duration-500">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <CardTitle className="text-2xl font-bold text-primary">Operax</CardTitle>
                <CardDescription>Connectez-vous pour accéder au système</CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <motion.div 
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.div 
                    className="grid gap-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        aria-required="true"
                        aria-label="Email"
                      />
                    </div>
                  </motion.div>
                  <motion.div 
                    className="grid gap-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <KeyIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        aria-required="true"
                        aria-label="Mot de passe"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading}
                        aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </motion.button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Force du mot de passe:</span>
                          <span className={`text-sm font-medium ${getStrengthColor(passwordStrength)}`}>
                            {getStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <Progress value={(passwordStrength / 4) * 100} className={`h-2 ${getStrengthColor(passwordStrength)}`} />
                      </div>
                    )}
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-between"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.6 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={isLoading}
                        aria-label="Se souvenir de moi"
                      />
                      <Label htmlFor="remember" className="text-sm">Se souvenir de moi</Label>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleForgotPassword}
                      className="px-0 font-normal text-primary hover:underline"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                      aria-label="Mot de passe oublié"
                    >
                      Mot de passe oublié ?
                    </motion.button>
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-10 relative" 
                      disabled={isLoading}
                      aria-label="Se connecter"
                    >
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <LoadingSpinner />
                          </motion.div>
                        ) : (
                          <motion.span
                            key="text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            Se connecter
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </CardContent>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <CardFooter className="text-center text-sm text-muted-foreground">
                <p className="w-full">Accès réservé au chef d'atelier</p>
              </CardFooter>
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
