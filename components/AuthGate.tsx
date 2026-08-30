'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, configured } = useAuth();

  if (!configured) return <>{children}</>;
  if (loading) return <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center text-sm text-slate-500">Checking your account…</div>;
  if (user || pathname === '/account') return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <div className="card w-full p-6 text-center">
        <div className="text-sm font-semibold text-slate-500">YARE account</div>
        <h1 className="mt-2 text-2xl font-black">Sign in to open your tracker</h1>
        <p className="mt-2 text-sm text-slate-500">This keeps cloud-synced personal data private on shared devices.</p>
        <Link className="btn-primary mt-5 inline-flex" href="/account">Continue to account</Link>
      </div>
    </div>
  );
}
