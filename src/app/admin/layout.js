'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && data.user.role === 'ADMIN') {
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
        <div className="app-layout">
          <Sidebar role="ADMIN" userName={user.name} />
          <main className="main-content animate-fade-in">
            {user.isDemo && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6b35, #f7c948)',
                color: '#1a1a2e',
                padding: '10px 20px',
                borderRadius: '10px',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: '600',
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
              }}>
                <span style={{ fontSize: '18px' }}>🔒</span>
                <span>Mode Demo — Akun ini hanya bisa melihat data (view-only). Tidak bisa menambah, mengubah, atau menghapus data.</span>
              </div>
            )}
            {children}
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
