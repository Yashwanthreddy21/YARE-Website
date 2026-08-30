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

  const buildSnapshot = () => {
    const state = useAppStore.getState();
    return {
      categories: state.categories,
      tasks: state.tasks,
      logs: state.logs,
      expenses: state.expenses,
      jobs: state.jobs,
      scheduleItems: state.scheduleItems,
      goals: state.goals,
    };
  };

  const sync = useCallback(async () => {
    if (!user || syncing.current) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    syncing.current = true;
    try {
      const cloud = await loadCloudSnapshot(supabase, user.id);
      const cloudIsEmpty = cloud.tasks.length === 0 && cloud.logs.length === 0 && cloud.expenses.length === 0 && cloud.jobs.length === 0 && cloud.scheduleItems.length === 0 && cloud.goals.length === 0;
      if (cloudIsEmpty) await pushLocalSnapshot(supabase, user.id, buildSnapshot());
      else useAppStore.getState().replaceFromCloud(cloud);
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
    let timer: number | undefined;
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (!hasBootstrapped.current || syncing.current) return;
      const unchanged = state.tasks === previous.tasks && state.logs === previous.logs && state.expenses === previous.expenses && state.jobs === previous.jobs && state.categories === previous.categories && state.scheduleItems === previous.scheduleItems && state.goals === previous.goals;
      if (unchanged) return;
      useAppStore.getState().setSyncStatus('pending');
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase || syncing.current) return;
        syncing.current = true;
        try {
          await pushLocalSnapshot(supabase, user.id, buildSnapshot());
          useAppStore.getState().setSyncStatus('synced');
        } catch (error) {
          console.error('YARE autosync failed', error);
          useAppStore.getState().setSyncStatus('error');
        } finally {
          syncing.current = false;
        }
      }, 800);
    });
    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [user, configured]);

  if (!ready) return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-sm text-slate-500">Syncing your YARE data…</div>;
  return <>{children}</>;
}
