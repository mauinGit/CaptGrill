'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Icon from './Icon';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { ToastProvider } from './Toast';
import { BluetoothProvider, useBluetooth } from './BluetoothPrinter';
import { getNav, isActivePath } from './navConfig';
import {
  IconLogout,
  IconMoon,
  IconSun,
  IconPrinter,
  IconLock,
  IconMore,
  IconChevronRight,
} from './icons';

/* =========================================================================
   AppShell: kerangka aplikasi untuk Admin & Kasir
   • Laptop (≥1280px)      : sidebar penuh
   • Tablet (768–1279px)   : sidebar ringkas (rail) ikon + label pendek
   • HP (<768px)           : top bar + bottom tab bar (+ sheet "Lainnya"/profil)
   ========================================================================= */

// Logo asli CaptGrill (foto) dari /public/assets/logo.png
function Logo({ className, sizes = '180px', priority = false }) {
  return (
    <Image
      src="/assets/logo.png"
      alt="CaptGrill"
      width={1681}
      height={748}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}

export function ShellLoading() {
  return (
    <div className="shell-loading" role="status" aria-live="polite">
      <Logo className="shell-loading-logo" sizes="200px" priority />
      <div className="shell-loading-bar"><span /></div>
      <p>Memuat CaptGrill…</p>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <IconLock size={18} />
      <span>
        <strong>Mode demo:</strong> akun ini hanya bisa melihat data. Menambah, mengubah, atau menghapus data tidak diizinkan.
      </span>
    </div>
  );
}

function printerState(bt) {
  if (bt.connecting) return 'busy';
  return bt.connected ? 'on' : 'off';
}

function PrinterCard({ bt }) {
  const state = printerState(bt);
  const toggle = bt.connected ? bt.disconnect : bt.connect;
  const statusText = state === 'busy' ? 'Menghubungkan…' : state === 'on' ? 'Terhubung' : 'Belum terhubung';

  return (
    <div className="shell-printer">
      <div className="shell-printer-row">
        <button
          type="button"
          className="shell-printer-icon"
          data-state={state}
          onClick={toggle}
          disabled={bt.connecting}
          title={`Printer: ${statusText}${state === 'on' ? '. Klik untuk memutus.' : state === 'off' ? '. Klik untuk menghubungkan.' : ''}`}
          aria-label={`Printer struk, ${statusText}`}
        >
          <IconPrinter size={18} />
          <span className={`status-dot ${state}`} />
        </button>
        <div className="shell-printer-text">
          <div className="shell-printer-name">{bt.connected ? bt.deviceName || 'Printer' : 'Printer struk'}</div>
          <div className="shell-printer-status">{statusText}</div>
        </div>
      </div>
      {bt.error && <div className="shell-printer-error">{bt.error}</div>}
      <button
        type="button"
        className={`shell-printer-btn${bt.connected ? ' secondary' : ''}`}
        onClick={toggle}
        disabled={bt.connecting}
      >
        {bt.connecting ? 'Menghubungkan…' : bt.connected ? 'Putuskan' : 'Hubungkan printer'}
      </button>
    </div>
  );
}

function Sheet({ label, onClose, children }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}

function Shell({ role, user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const bt = useBluetooth();
  const nav = getNav(role);
  const [sheet, setSheet] = useState(null); // null | 'more' | 'profile'

  const roleLabel = role === 'ADMIN' ? 'Admin' : 'Kasir';
  const current = nav.all.find((item) => isActivePath(pathname, item.href));
  const moreActive = nav.more.some((item) => isActivePath(pathname, item.href));

  // Tutup sheet saat pindah halaman
  useEffect(() => { setSheet(null); }, [pathname]);

  // Esc menutup sheet + kunci scroll halaman di belakangnya
  useEffect(() => {
    if (!sheet) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSheet(null); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
    }
  };

  const themeLabel = theme === 'dark' ? 'Mode terang' : 'Mode gelap';

  return (
    <div className="shell">
      {/* ===== Sidebar (laptop) / rail (tablet) ===== */}
      <aside className="shell-sidebar" aria-label="Navigasi utama">
        <Link href={nav.all[0].href} className="shell-brand" title="CaptGrill">
          <Logo className="shell-brand-logo" priority />
          <span className="shell-brand-text">
            <span className="shell-brand-role">Panel {roleLabel}</span>
          </span>
        </Link>

        <nav className="shell-nav">
          {nav.groups.map((group) => (
            <div className="shell-nav-group" key={group.title}>
              <div className="shell-nav-title">{group.title}</div>
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shell-nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={item.label}
                  >
                    <item.Icon size={20} />
                    <span className="shell-nav-label">{item.label}</span>
                    <span className="shell-nav-short">{item.short}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {bt && <PrinterCard bt={bt} />}

        <div className="shell-user">
          <span className="avatar" aria-hidden="true"><Icon name="user" /></span>
          <span className="shell-user-info">
            <span className="shell-user-name">{user.name}</span>
            <span className="shell-user-role">{roleLabel}{user.isDemo ? ' · Demo' : ''}</span>
          </span>
          <span className="shell-user-actions">
            <button type="button" className="shell-icon-btn" onClick={toggleTheme} title={themeLabel} aria-label={themeLabel}>
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
            <button type="button" className="shell-icon-btn danger" onClick={logout} title="Keluar" aria-label="Keluar">
              <IconLogout size={18} />
            </button>
          </span>
        </div>
      </aside>

      {/* ===== Top bar (HP) ===== */}
      <header className="shell-topbar">
        <Logo className="shell-topbar-logo" sizes="100px" priority />
        <div className="shell-topbar-text">
          <span className="shell-topbar-page">{current?.label ?? `Panel ${roleLabel}`}</span>
        </div>
        {bt && (
          <button
            type="button"
            className="shell-topbar-printer"
            data-state={printerState(bt)}
            onClick={() => setSheet('profile')}
            aria-label={`Printer ${bt.connected ? 'terhubung' : 'belum terhubung'}`}
          >
            <IconPrinter size={19} />
            <span className={`status-dot ${printerState(bt)}`} />
          </button>
        )}
        <button type="button" className="shell-avatar-btn" onClick={() => setSheet('profile')} aria-label="Akun & pengaturan">
          <span className="avatar"><Icon name="user" /></span>
        </button>
      </header>

      {/* ===== Konten halaman ===== */}
      <main className="shell-main" id="konten">
        {user.isDemo && <DemoBanner />}
        {children}
      </main>

      {/* ===== Bottom tab bar (HP) ===== */}
      <nav className="shell-bottomnav" aria-label="Navigasi bawah">
        {nav.tabs.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shell-tab${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="shell-tab-icon"><item.Icon size={22} /></span>
              <span className="shell-tab-label">{item.short}</span>
            </Link>
          );
        })}
        {nav.more.length > 0 && (
          <button
            type="button"
            className={`shell-tab${moreActive || sheet === 'more' ? ' active' : ''}`}
            onClick={() => setSheet('more')}
            aria-haspopup="dialog"
          >
            <span className="shell-tab-icon"><IconMore size={22} /></span>
            <span className="shell-tab-label">Lainnya</span>
          </button>
        )}
      </nav>

      {/* ===== Sheet: menu lainnya (admin HP) ===== */}
      {sheet === 'more' && (
        <Sheet label="Menu lainnya" onClose={() => setSheet(null)}>
          <div className="sheet-title">Menu lainnya</div>
          <div className="sheet-grid">
            {nav.more.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} className={`sheet-tile${active ? ' active' : ''}`}>
                  <span className="sheet-tile-icon"><item.Icon size={22} /></span>
                  <span className="sheet-tile-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="sheet-divider" />
          <button type="button" className="sheet-row danger" onClick={logout}>
            <span className="sheet-row-icon"><IconLogout size={20} /></span>
            <span className="sheet-row-text">Keluar</span>
          </button>
        </Sheet>
      )}

      {/* ===== Sheet: profil & pengaturan (HP) ===== */}
      {sheet === 'profile' && (
        <Sheet label="Akun & pengaturan" onClose={() => setSheet(null)}>
          <div className="sheet-profile">
            <span className="avatar avatar-lg"><Icon name="user" /></span>
            <div>
              <div className="sheet-profile-name">{user.name}</div>
              <div className="sheet-profile-role">{roleLabel}{user.isDemo ? ' · Akun demo' : ''}</div>
            </div>
          </div>

          {bt && (
            <div className="sheet-printer">
              <div className="sheet-row static">
                <span className="sheet-row-icon" data-state={printerState(bt)}><IconPrinter size={20} /></span>
                <span className="sheet-row-text">
                  {bt.connected ? bt.deviceName || 'Printer' : 'Printer struk'}
                  <small>
                    <span className={`status-dot ${printerState(bt)}`} />
                    {bt.connecting ? 'Menghubungkan…' : bt.connected ? 'Terhubung' : 'Belum terhubung'}
                  </small>
                </span>
                <button
                  type="button"
                  className={`btn btn-sm ${bt.connected ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={bt.connected ? bt.disconnect : bt.connect}
                  disabled={bt.connecting}
                >
                  {bt.connecting ? '…' : bt.connected ? 'Putuskan' : 'Hubungkan'}
                </button>
              </div>
              {bt.error && <p className="sheet-printer-error">{bt.error}</p>}
            </div>
          )}

          <button type="button" className="sheet-row" onClick={toggleTheme}>
            <span className="sheet-row-icon">{theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}</span>
            <span className="sheet-row-text">{themeLabel}</span>
            <IconChevronRight size={18} className="sheet-row-chevron" />
          </button>
          <div className="sheet-divider" />
          <button type="button" className="sheet-row danger" onClick={logout}>
            <span className="sheet-row-icon"><IconLogout size={20} /></span>
            <span className="sheet-row-text">Keluar</span>
          </button>
        </Sheet>
      )}
    </div>
  );
}

export default function AppShell({ role, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.user?.role === role) setUser(data.user);
        else router.replace('/login');
      })
      .catch(() => { if (!cancelled) router.replace('/login'); });
    return () => { cancelled = true; };
  }, [role, router]);

  if (!user) return <ShellLoading />;

  const shell = <Shell role={role} user={user}>{children}</Shell>;

  return (
    <ThemeProvider>
      <ToastProvider>
        {role === 'KASIR' ? <BluetoothProvider>{shell}</BluetoothProvider> : shell}
      </ToastProvider>
    </ThemeProvider>
  );
}
