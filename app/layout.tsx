import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { AuthProvider } from '@/components/AuthProvider';
import { CloudSyncProvider } from '@/components/CloudSyncProvider';

export const metadata: Metadata = {
  title: 'YARE — Personal OS',
  description: 'Your personal productivity, health, career and lifestyle operating system.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CloudSyncProvider>
            <Navigation />
            <main className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-6 md:ml-64 md:px-8 md:pb-10">
              {children}
            </main>
          </CloudSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
