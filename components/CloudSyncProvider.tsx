'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowserClient } from '@/services/supabase';
import { loadCloudSnapshot, pushLocalSnapshot } from '@/services/cloudSync';
import { useAppStore } from '@/store/useAppStore';

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, configured } = useAuth();
  const [ready, setReady] = useState(!configured);
  const syncing = useRef(false);
  const hasBootstrapped = useRef(false);

  const sync = useCallback(async () => {
    if (!user || syncing.current) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    syncing.current = true;
    try {
      const local = useAppStore.getState();
      const cloud = await loadCloudSnapshot(supabase, user.id);
      const cloudIsEmpty = cloud.tasks.length === 0 && cloud.logs.length === 0 && cloud.expenses.length === 0 && cloud.jobs.length === 0;

      if (cloudIsEmpty) {
        await pushLocalSnapshot(supabase, user.id, {
          categories: local.categories,
          tasks: local.tasks,
          logs: local.logs,
          expenses: local.expenses,
          jobs: local.jobs,
        });
      } else {
        useAppStore.getState().replaceFromCloud(cloud);
      }
      useAppStore.getState().setSyncStatus('synced');
    } catch (error) {
      console.error('YARE cloud sync failed', error);
      useAppStore.getState().setSyncStatus('error');
    } finally {
      syncing.current = false;
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (!configured) {
      setReady(true);
      return;
    }
    if (!user) {
      hasBootstrapped.current = false;
      setReady(true);
      return;
    }
    if (!hasBootstrapped.current) {
      hasBootstrapped.current = true;
      setReady(false);
      void sync();
    }
  }, [configured, user, sync]);

  useEffect(() => {
    if (!user || !configured) return;
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (!hasBootstrapped.current || syncing.current) return;
      if (state.tasks === previous.tasks && state.logs === previous.logs && state.expenses === previous.expenses && state.jobs === previous.jobs && state.categories === previous.categories) return;
      useAppStore.getState().setSyncStatus('pending');
      const timer = window.setTimeout(async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase || syncing.current) return;
        syncing.current = true;
        try {
          const current = useAppStore.getState();
          await pushLocalSnapshot(supabase, user.id, { categories: current.categories, tasks: current.tasks, logs: current.logs, expenses: current.expenses, jobs: current.jobs });
          useAppStore.getState().setSyncStatus('synced');
        } catch (error) {
          console.error('YARE autosync failed', error);
          useAppStore.getState().setSyncStatus('error');
        } finally {
          syncing.current = false;
        }
      }, 800);
      return () => window.clearTimeout(timer);
    });
    return unsubscribe;
  }, [user, configured]);

  if (!ready) return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-sm text-slate-500">Syncing your YARE data…</div>;
  return <>{children}</>;
}
