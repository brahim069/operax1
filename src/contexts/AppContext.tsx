import { createContext, useContext, ReactNode } from "react";
import { AppContextType, Worker, Task } from "@/types";
import { useWorkers } from "@/hooks/useWorkers";
import { useTasks } from "@/hooks/useTasks";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp doit être utilisé à l'intérieur d'un AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const {
    workers,
    loading: workersLoading,
    addWorker,
    updateWorker,
    deleteWorker,
  } = useWorkers();

  const {
    tasks,
    isLoading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    fetchTasks,
  } = useTasks();

  const isLoading = workersLoading || tasksLoading;

  const value: AppContextType = {
    workers,
    tasks,
    addWorker: async (worker: Omit<Worker, 'id' | 'createdAt'>) => {
      await addWorker(worker);
    },
    updateWorker: async (worker: Worker) => {
      await updateWorker(worker);
    },
    deleteWorker: async (id: string) => {
      await deleteWorker(id);
    },
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    fetchTasks,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
