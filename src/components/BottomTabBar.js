'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/kasir/transaksi', icon: '🛒', label: 'Transaksi' },
  { href: '/kasir/bahan', icon: '🧂', label: 'Bahan' },
  { href: '/kasir/riwayat', icon: '📜', label: 'Riwayat' },
  { href: '/kasir/absensi', icon: '🗓️', label: 'Absensi' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => {
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
    </nav>
  );
}
