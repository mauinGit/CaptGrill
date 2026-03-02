'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { BluetoothProvider } from '@/components/BluetoothPrinter';

export default function KasirLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.role === 'KASIR') {
          setUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔥</div>
          <p style={{ color: 'var(--text-secondary)' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <BluetoothProvider>
          <div className="app-layout">
            <Sidebar role="KASIR" userName={user.name} />
            <main className="main-content animate-fade-in">
              {children}
            </main>
          </div>
        </BluetoothProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

