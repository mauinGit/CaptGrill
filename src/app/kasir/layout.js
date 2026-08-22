'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomTabBar from '@/components/BottomTabBar';
import ProfileSheet from '@/components/ProfileSheet';
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
          <div className="app-container">
            {/* Sidebar - Tampil HANYA di Laptop/Desktop (>= 1024px) */}
            <div className="sidebar-kasir">
              <Sidebar role="KASIR" userName={user.name} />
            </div>

            {/* Topbar - Tampil HANYA di Mobile & Tablet (< 1024px) */}
            <header className="kasir-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/assets/logo.png"
                  alt="CaptGrill"
                  onError={(e) => { e.target.style.display = 'none'; }}
                  style={{ height: '26px', width: 'auto', objectFit: 'contain' }}
                />
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>CaptGrill</span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <ProfileSheet userName={user.name} role="KASIR" />
              </div>
            </header>

            {/* Main Content */}
            <main className="kasir-content main-content animate-fade-in">
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
                  <span>Mode Demo : Akun ini hanya bisa melihat data (view-only). Tidak bisa menambah, mengubah, atau menghapus data.</span>
                </div>
              )}
              {children}
            </main>

            {/* Bottom Tab Bar - Tampil HANYA di Mobile & Tablet (< 1024px) */}
            <div className="bottom-tabbar-kasir">
              <BottomTabBar />
            </div>
          </div>
        </BluetoothProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
