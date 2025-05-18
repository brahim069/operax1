import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../types';

// Simple verification function
const verifyTableConnection = async () => {
  try {
    // Try to select from the table
    const { data, error } = await supabase
      .from('tasks_web')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error connecting to tasks_web table:', error.message);
      return false;
    }

    console.log('Successfully connected to tasks_web table');
    return true;
  } catch (error) {
    console.error('Failed to verify table connection:', error);
    return false;
  }
};

// Run verification on module load
verifyTableConnection();

// Mock data
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Inspecter la machine 4",
    workerId: "1",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    day: new Date().getDate(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Vérifier la température",
    workerId: "1",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    day: new Date().getDate(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Remplacer l'opérateur zone B",
    workerId: "2",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    day: new Date().getDate(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks_web')
        .select(`
          *,
          ouvriers (
            id,
            first_name,
            last_name,
            rfid_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      // Transform the data to match our Task type
      const transformedTasks: Task[] = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        workerId: task.worker_id,
        month: task.month,
        year: task.year,
        day: task.day,
        completed: task.completed,
        createdAt: task.created_at
      })) || [];

      console.log('Fetched tasks:', transformedTasks);
      setTasks(transformedTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchTasks(); // Initial fetch

    // Subscribe to changes
    const subscription = supabase
      .channel('tasks_web_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks_web',
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh the entire task list when any change occurs
          await fetchTasks();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    try {
      setLoading(true);
      console.log('Adding task:', task);

      const taskData = {
        title: task.title,
        description: task.description,
        worker_id: task.workerId,
        month: task.month,
        year: task.year,
        day: task.day,
        completed: false,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('tasks_web')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        workerId: data.worker_id,
        month: data.month,
        year: data.year,
        day: data.day,
        completed: data.completed,
        createdAt: data.created_at
      };

      console.log('Added task:', newTask);
      return newTask;
    } catch (err) {
      console.error('Error in addTask:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (task: Task) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks_web')
        .update({
          title: task.title,
          description: task.description,
          worker_id: task.workerId,
          month: task.month,
          year: task.year,
          day: task.day,
          completed: task.completed
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        workerId: data.worker_id,
        month: data.month,
        year: data.year,
        day: data.day,
        completed: data.completed,
        createdAt: data.created_at
      };

      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tasks_web')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');

      const { data, error } = await supabase
        .from('tasks_web')
        .update({ completed: !task.completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        workerId: data.worker_id,
        month: data.month,
        year: data.year,
        day: data.day,
        completed: data.completed,
        createdAt: data.created_at
      };

      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task completion');
      throw err;
    }
  };

  return {
    tasks,
    isLoading: loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
  };
};
