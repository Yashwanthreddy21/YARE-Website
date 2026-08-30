'use client';

import Link from 'next/link';
import { Download, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isSupabaseConfigured } from '@/services/supabase';
import { useTheme, type ThemePreference } from '@/components/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const syncStatus = useAppStore((state) => state.syncStatus);

  const statusLabel = !isSupabaseConfigured
    ? 'Local demo mode'
    : !user
      ? 'Cloud available — not signed in'
      : syncStatus === 'synced'
        ? 'Cloud synced'
        : syncStatus === 'pending'
          ? 'Changes waiting to sync'
          : syncStatus === 'error'
            ? 'Sync needs attention'
            : 'Local data';

  function exportData() {
    const state = useAppStore.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      tasks: state.tasks,
      logs: state.logs,
      expenses: state.expenses,
      jobApplications: state.jobs,
      scheduleItems: state.scheduleItems,
      goals: state.goals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function resetDemo() {
    if (isSupabaseConfigured || user) return;
    if (!confirm('Reset all local demo data? This cannot be undone unless you exported a backup first.')) return;
    window.localStorage.removeItem('yare-personal-os-v1');
    window.location.reload();
  }

  return (
    <div>
      <p className="text-sm text-slate-500">Preferences & data</p>
      <h1 className="mb-6 text-3xl font-black">Settings</h1>
      <div className="space-y-3">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <b>Data & sync</b>
              <p className="mt-1 text-sm text-slate-500">{statusLabel}</p>
              {user && <p className="mt-1 text-xs text-slate-400">{user.email}</p>}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{isSupabaseConfigured ? 'Cloud ready' : 'Local'}</span>
          </div>
          <Link href="/account" className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">
            {user ? 'Manage account' : 'Sign in / create account'}
          </Link>
        </div>

        <div className="card p-5">
          <b>Theme</b>
          <p className="mt-1 text-sm text-slate-500">Choose your appearance. System follows your phone or computer automatically.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['system', 'light', 'dark'] as ThemePreference[]).map((value) => (
              <button key={value} onClick={() => setTheme(value)} className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize ${theme === value ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800'}`}>{value}</button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <b>Offline safety</b>
          <p className="mt-1 text-sm text-slate-500">Changes are saved to this browser immediately. Signed-in data retries cloud sync automatically when your connection returns.</p>
        </div>

        <div className="card p-5">
          <b>Data export</b>
          <p className="mt-1 text-sm text-slate-500">Download a readable JSON backup containing tasks, history, expenses, applications, routines, and goals.</p>
          <button onClick={exportData} className="btn-secondary mt-4"><Download size={17} /> Export backup</button>
        </div>

        {!isSupabaseConfigured && (
          <div className="card p-5">
            <b>Reset demo data</b>
            <p className="mt-1 text-sm text-slate-500">Returns this browser to the original example tasks and schedule.</p>
            <button onClick={resetDemo} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 dark:border-red-900"><RotateCcw size={17} /> Reset local demo</button>
          </div>
        )}
      </div>
    </div>
  );
}
