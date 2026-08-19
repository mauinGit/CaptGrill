'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

let useBluetooth;
try {
  useBluetooth = require('./BluetoothPrinter').useBluetooth;
} catch {
  useBluetooth = () => null;
}

const adminLinks = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/bahan', icon: '🧂', label: 'Manajemen Bahan' },
  { href: '/admin/pembuatan-bahan', icon: '🧪', label: 'Pembuatan Bahan' },
  { href: '/admin/menu', icon: '🍔', label: 'Manajemen Menu' },
  { href: '/admin/pengeluaran', icon: '💸', label: 'Pengeluaran' },
  { href: '/admin/laporan', icon: '📋', label: 'Laporan' },
  { href: '/admin/grafik', icon: '📈', label: 'Grafik Keuangan' },
  { href: '/admin/absensi', icon: '📅', label: 'Absensi Karyawan' },
  { href: '/admin/gaji', icon: '💰', label: 'Gaji Karyawan' },
  { href: '/admin/akun', icon: '👤', label: 'Manajemen Akun' },
  { href: '/admin/log', icon: '📝', label: 'Log Aktivitas' },
];

const kasirLinks = [
  { href: '/kasir/transaksi', icon: '🛒', label: 'Transaksi' },
  { href: '/kasir/bahan', icon: '🧪', label: 'Bahan' },
  { href: '/kasir/riwayat', icon: '📜', label: 'Riwayat Hari Ini' },
  { href: '/kasir/absensi', icon: '📅', label: 'Absensi' },
];

function BluetoothIcon({ connected, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.5 6.5L17.5 17.5L12 23V1L17.5 6.5L6.5 17.5"
        stroke={connected ? '#22c55e' : '#64748b'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {connected && (
        <>
          <circle cx="20" cy="7" r="2.5" fill="#22c55e" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="7" r="1" fill="#22c55e" />
        </>
      )}
    </svg>
  );
}

export default function Sidebar({ role, userName }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const bt = role === 'KASIR' ? useBluetooth() : null;
  const links = role === 'ADMIN' ? adminLinks : kasirLinks;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
      >
        ☰
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><img src="/assets/logo.png" alt="CaptGrill" onError={(e) => { e.target.style.display='none'; e.target.parentElement.textContent='🔥'; }} /></div>
          <div>
            <h1>CaptGrill</h1>
            <span>{role === 'ADMIN' ? 'Admin Panel' : 'Kasir Panel'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Menu</div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${
                  pathname === link.href ? 'active' : ''
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Bluetooth Printer Section - Kasir only */}
          {role === 'KASIR' && bt && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Printer</div>
              <div className="bt-status-card">
                <div className="bt-status-header">
                  <BluetoothIcon connected={bt.connected} size={22} />
                  <div className="bt-status-info">
                    {bt.connecting ? (
                      <>
                        <div className="bt-status-label">Menghubungkan...</div>
                        <div className="bt-status-detail">
                          <span className="bt-dot bt-dot-connecting"></span>
                          Mencari printer
                        </div>
                      </>
                    ) : bt.connected ? (
                      <>
                        <div className="bt-status-label">{bt.deviceName}</div>
                        <div className="bt-status-detail">
                          <span className="bt-dot bt-dot-connected"></span>
                          Terhubung
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bt-status-label">Tidak Terhubung</div>
                        <div className="bt-status-detail">
                          <span className="bt-dot bt-dot-disconnected"></span>
                          Offline
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {bt.error && (
                  <div className="bt-error">{bt.error}</div>
                )}

                <button
                  className={`bt-btn ${bt.connected ? 'bt-btn-disconnect' : 'bt-btn-connect'}`}
                  onClick={bt.connected ? bt.disconnect : bt.connect}
                  disabled={bt.connecting}
                >
                  {bt.connecting ? (
                    '⏳ Menghubungkan...'
                  ) : bt.connected ? (
                    '✕ Putuskan'
                  ) : (
                    <>
                      <BluetoothIcon connected={false} size={14} /> Hubungkan Printer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#fff',
                fontWeight: '700',
              }}>
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{userName}</div>
                <div style={{ fontSize: '11px', color: '#ffffff' }}>{role}</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
              style={{ width: '28px', height: '28px', fontSize: '14px', background: 'transparent', border: 'none', color: '#94a3b8' }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary w-full"
            style={{ fontSize: '13px', padding: '8px', background: '#fbd953', border: '1px solid rgba(255,255,255,0.1)', color: '#000000ff' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}

