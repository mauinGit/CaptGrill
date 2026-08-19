'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const mainTabs = [
  { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/admin/bahan', icon: '🧂', label: 'Bahan' },
  { href: '/kasir/transaksi', icon: '🛒', label: 'Kasir' },
  { href: '/admin/laporan', icon: '📋', label: 'Laporan' },
];

const moreMenuItems = [
  { href: '/admin/menu', icon: '🍔', label: 'Manajemen Menu' },
  { href: '/admin/pembuatan-bahan', icon: '🧪', label: 'Bahan Racikan' },
  { href: '/admin/pengeluaran', icon: '💸', label: 'Pengeluaran' },
  { href: '/admin/absensi', icon: '📅', label: 'Absensi' },
  { href: '/admin/gaji', icon: '💰', label: 'Gaji' },
  { href: '/admin/akun', icon: '👤', label: 'Akun' },
];

export default function AdminBottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef(null);

  // Check if any "more" item is active
  const isMoreActive = moreMenuItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Close sheet on outside click
  useEffect(() => {
    if (!sheetOpen) return;
    const handleClick = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setSheetOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sheetOpen]);

  return (
    <>
      <nav className="admin-bottom-tab-bar">
        {mainTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link key={tab.href} href={tab.href} className={`tab-item ${isActive ? 'active' : ''}`}>
              <div className="tab-icon-wrap">
                <span className="tab-icon">{tab.icon}</span>
              </div>
              <span className="tab-label">{tab.label}</span>
            </Link>
          );
        })}
        {/* Lainnya slot */}
        <button
          className={`tab-item ${isMoreActive ? 'active' : ''}`}
          onClick={() => setSheetOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <div className="tab-icon-wrap">
            <span className="tab-icon">⋯</span>
          </div>
          <span className="tab-label">Lainnya</span>
        </button>
      </nav>

      {/* Bottom Sheet */}
      {sheetOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div
            className="bottom-sheet"
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
              <div style={{
                width: '36px', height: '4px', borderRadius: '2px',
                background: 'var(--text-tertiary)', opacity: 0.4,
              }} />
            </div>

            {/* Grid menu */}
            <div className="bottom-sheet-grid">
              {moreMenuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`bottom-sheet-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSheetOpen(false)}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Logout — separated visually */}
            <div style={{ padding: '8px 16px 16px', borderTop: '1px solid var(--border-light)', marginTop: '8px' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)',
                  border: 'none', background: 'var(--danger-bg)', color: 'var(--danger)',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
