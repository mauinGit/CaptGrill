'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

let useBluetooth;
try {
  useBluetooth = require('./BluetoothPrinter').useBluetooth;
} catch {
  useBluetooth = () => null;
}

export default function ProfileSheet({ userName, role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const bt = useBluetooth?.();

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const initials = userName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{ position: 'relative' }} ref={sheetRef}>
      {/* Profile button — shown in top-right of each page */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          border: '2px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(35,114,39,0.3)',
          transition: 'transform 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title={`${userName} — ${role}`}
      >
        {initials}
      </button>

      {/* Sheet dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '44px',
          right: 0,
          width: '260px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          zIndex: 300,
          animation: 'slideDown 0.2s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}>
          {/* User info */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '16px', fontWeight: '700', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{role}</div>
            </div>
          </div>

          {/* Printer status */}
          {bt && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Printer Bluetooth</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: bt.connected ? 'var(--success)' : 'var(--text-tertiary)',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {bt.connecting ? 'Menghubungkan...' : bt.connected ? bt.deviceName || 'Terhubung' : 'Tidak Terhubung'}
                  </span>
                </div>
                <button
                  onClick={bt.connected ? bt.disconnect : bt.connect}
                  disabled={bt.connecting}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {bt.connecting ? '...' : bt.connected ? 'Putuskan' : 'Hubungkan'}
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fce7e7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
