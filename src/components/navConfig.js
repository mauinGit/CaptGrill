import {
  IconDashboard,
  IconBox,
  IconFlask,
  IconUtensils,
  IconWallet,
  IconReport,
  IconCalendarCheck,
  IconBanknote,
  IconUsers,
  IconCart,
  IconReceipt,
} from './icons';

// Urutan menu admin mengikuti spec (CaptGrill-Design-Spec §8.1), dikelompokkan
// supaya mudah dipindai. `short` = label ringkas untuk rail tablet & tab bar HP.
const ADMIN_GROUPS = [
  {
    title: 'Utama',
    items: [{ href: '/admin/dashboard', label: 'Dashboard', short: 'Dashboard', Icon: IconDashboard }],
  },
  {
    title: 'Operasional',
    items: [
      { href: '/admin/bahan', label: 'Manajemen Bahan', short: 'Bahan', Icon: IconBox },
      { href: '/admin/pembuatan-bahan', label: 'Pembuatan Bahan', short: 'Racikan', Icon: IconFlask },
      { href: '/admin/menu', label: 'Manajemen Menu', short: 'Menu', Icon: IconUtensils },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { href: '/admin/pengeluaran', label: 'Pengeluaran', short: 'Pengeluaran', Icon: IconWallet },
      { href: '/admin/laporan', label: 'Laporan', short: 'Laporan', Icon: IconReport },
    ],
  },
  {
    title: 'Karyawan',
    items: [
      { href: '/admin/absensi', label: 'Absensi Karyawan', short: 'Absensi', Icon: IconCalendarCheck },
      { href: '/admin/gaji', label: 'Gaji Karyawan', short: 'Gaji', Icon: IconBanknote },
      { href: '/admin/akun', label: 'Manajemen Akun', short: 'Akun', Icon: IconUsers },
    ],
  },
];

const KASIR_GROUPS = [
  {
    title: 'Menu Kasir',
    items: [
      { href: '/kasir/transaksi', label: 'Transaksi', short: 'Transaksi', Icon: IconCart },
      { href: '/kasir/bahan', label: 'Produksi Bahan', short: 'Bahan', Icon: IconFlask },
      { href: '/kasir/riwayat', label: 'Riwayat Hari Ini', short: 'Riwayat', Icon: IconReceipt },
      { href: '/kasir/absensi', label: 'Absensi', short: 'Absensi', Icon: IconCalendarCheck },
    ],
  },
];

// Tab bar HP: admin 4 menu harian + "Lainnya"; kasir 4 menu langsung.
const ADMIN_TABS = ['/admin/dashboard', '/admin/bahan', '/admin/absensi', '/admin/laporan'];

export function getNav(role) {
  const groups = role === 'ADMIN' ? ADMIN_GROUPS : KASIR_GROUPS;
  const all = groups.flatMap((g) => g.items);
  if (role !== 'ADMIN') return { groups, all, tabs: all, more: [] };
  const tabs = ADMIN_TABS.map((href) => all.find((i) => i.href === href));
  const more = all.filter((i) => !ADMIN_TABS.includes(i.href));
  return { groups, all, tabs, more };
}

export function isActivePath(pathname, href) {
  return pathname === href || pathname.startsWith(href + '/');
}
