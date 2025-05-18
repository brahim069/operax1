import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "next-themes";
import { PageTransition } from "@/components/PageTransition";
import { NavigationProgress } from "@/components/NavigationProgress";

// Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import WorkersPage from "./pages/WorkersPage";
import TasksPage from "./pages/TasksPage";
import PresencePage from "./pages/PresencePage";
import TestConnection from "./pages/TestConnection";
import AddManagerPage from "./pages/AddManagerPage";

const queryClient = new QueryClient();

// Composant pour protéger les routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      <NavigationProgress />
      <Routes>
        <Route path="/login" element={
          <PageTransition>
            {user ? <Navigate to="/" replace /> : <LoginPage />}
          </PageTransition>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <PageTransition>
              <HomePage />
            </PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageTransition>
              <DashboardPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/workers" element={
          <ProtectedRoute>
            <PageTransition>
              <WorkersPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/tasks" element={
          <ProtectedRoute>
            <PageTransition>
              <TasksPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/presence" element={
          <ProtectedRoute>
            <PageTransition>
              <PresencePage />
            </PageTransition>
          </ProtectedRoute>
        } />

        <Route path="/add_manager" element={
          <ProtectedRoute>
            <PageTransition>
              <AddManagerPage />
            </PageTransition>
          </ProtectedRoute>
        } />

        {/* Test connection route without protection */}
        <Route path="/test-connection" element={
          <PageTransition>
            <TestConnection />
          </PageTransition>
        } />
        
        {/* Redirect all unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <AppProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </AppProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
