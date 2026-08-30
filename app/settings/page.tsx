'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { isSupabaseConfigured } from '@/services/supabase';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsPage() {
  const { user } = useAuth();
  const syncStatus = useAppStore((s) => s.syncStatus);

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
          <p className="mt-1 text-sm text-slate-500">The interface follows your device light or dark appearance automatically.</p>
        </div>

        <div className="card p-5">
          <b>Offline safety</b>
          <p className="mt-1 text-sm text-slate-500">Your tracker stays persisted in local browser storage. When signed in, changes are also synchronized to Supabase.</p>
        </div>
      </div>
    </div>
  );
}
