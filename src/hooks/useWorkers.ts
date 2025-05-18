import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Worker } from '../types';

export const useWorkers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ouvriers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Worker type
      const transformedWorkers: Worker[] = data?.map(worker => ({
        id: worker.id,
        firstName: worker.first_name,
        lastName: worker.last_name,
        rfidId: worker.rfid_id,
        createdAt: worker.created_at
      })) || [];

      setWorkers(transformedWorkers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();

    // Set up real-time subscription
    const channel = supabase
      .channel('workers_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ouvriers'
        },
        (payload) => {
          fetchWorkers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const addWorker = async (worker: Omit<Worker, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      const workerData = {
        first_name: worker.firstName,
        last_name: worker.lastName,
        rfid_id: worker.rfidId,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('ouvriers')
        .insert([workerData])
        .select()
        .single();
      if (error) throw error;
      const newWorker: Worker = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        rfidId: data.rfid_id,
        createdAt: data.created_at
      };
      setWorkers(prev => [newWorker, ...prev]);
      return newWorker;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add worker');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorker = async (worker: Worker) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ouvriers')
        .update({
          first_name: worker.firstName,
          last_name: worker.lastName,
          rfid_id: worker.rfidId,
        })
        .eq('id', worker.id)
        .select()
        .single();
      if (error) throw error;
      const updatedWorker: Worker = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        rfidId: data.rfid_id,
        createdAt: data.created_at
      };
      setWorkers(prev => prev.map(w => w.id === worker.id ? updatedWorker : w));
      return updatedWorker;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update worker');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('ouvriers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setWorkers(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete worker');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    workers,
    loading,
    error,
    addWorker,
    updateWorker,
    deleteWorker,
    refreshWorkers: fetchWorkers
  };
};
