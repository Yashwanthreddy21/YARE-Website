'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/services/supabase';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setNewPassword('');
      setMessage('Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-slate-500">Account</p>
        <h1 className="mb-6 text-3xl font-black">Demo mode</h1>
        <div className="card p-5">
          <p className="font-semibold">Cloud login is not configured yet.</p>
          <p className="mt-2 text-sm text-slate-500">Your data is still saved locally in this browser. Add the Supabase environment variables when you are ready for cross-device sync.</p>
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-slate-500">Checking your account…</p>;

  if (user) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-slate-500">Account</p>
        <h1 className="mb-6 text-3xl font-black">You’re signed in</h1>
        <div className="space-y-3">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="mt-1 font-semibold">{user.email}</p>
          </div>

          <form className="card p-5" onSubmit={changePassword}>
            <b>Change password</b>
            <p className="mt-1 text-sm text-slate-500">This also completes a password reset after you open the secure link from your email.</p>
            <input className="mt-4 w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700" type="password" minLength={6} required placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            {message && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p>}
            <button disabled={busy} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{busy ? 'Saving…' : 'Update password'}</button>
          </form>

          <button
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold dark:border-slate-700"
            onClick={async () => {
              await signOut();
              router.push('/account');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setBusy(false);
      return;
    }

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.push('/');
      } else if (mode === 'signup') {
        const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
        if (authError) throw authError;
        setMessage('Account created. Check your email if email confirmation is enabled in Supabase.');
      } else {
        const redirectTo = `${window.location.origin}/account`;
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (authError) throw authError;
        setMessage('Password reset email sent. Open the link, then set your new password on this page.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-sm text-slate-500">Account</p>
      <h1 className="mb-2 text-3xl font-black">{mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}</h1>
      <p className="mb-6 text-sm text-slate-500">{mode === 'forgot' ? 'We’ll email you a secure reset link.' : 'Your YARE data can sync securely across devices.'}</p>

      <form onSubmit={submit} className="card space-y-4 p-5">
        {mode === 'signup' && <label className="block text-sm font-medium">Name<input className="mt-2 w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" /></label>}
        <label className="block text-sm font-medium">Email<input className="mt-2 w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        {mode !== 'forgot' && <label className="block text-sm font-medium">Password<input className="mt-2 w-full rounded-2xl border border-slate-300 bg-transparent px-4 py-3 dark:border-slate-700" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>}

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p>}

        <button disabled={busy} className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset email'}</button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        {mode !== 'login' && <button onClick={() => setMode('login')} className="font-semibold">Log in</button>}
        {mode !== 'signup' && <button onClick={() => setMode('signup')} className="font-semibold">Create account</button>}
        {mode !== 'forgot' && <button onClick={() => setMode('forgot')} className="font-semibold">Forgot password?</button>}
      </div>
    </div>
  );
}
