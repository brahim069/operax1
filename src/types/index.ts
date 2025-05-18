// Types pour l'application Gestion Atelier Dattes

// Type pour l'utilisateur (Chef d'atelier)
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Type pour un ouvrier
export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  rfidId: string;
  createdAt?: string;
}

// Type pour une tâche
export interface Task {
  id: string;
  title: string;
  description?: string;
  workerId?: string;
  month: number; // 1-12
  year: number;
  day?: number;
  completed: boolean;
  createdAt: string;
}

// Type pour le contexte d'authentification
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Type pour le contexte de l'application
export interface AppContextType {
  workers: Worker[];
  tasks: Task[];
  addWorker: (worker: Omit<Worker, 'id' | 'createdAt'>) => Promise<void>;
  updateWorker: (worker: Worker) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (id: string) => Promise<Task>;
  toggleTaskCompletion: (id: string) => Promise<Task>;
  fetchTasks?: () => Promise<void>;
  isLoading: boolean;
}
