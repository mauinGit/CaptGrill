import { Inter, Roboto_Slab } from 'next/font/google';
import './globals.css';

// Inter untuk teks UI, Roboto Slab untuk judul & nama brand (senada dengan logo)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const slab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-slab',
  display: 'swap',
});

export const metadata = {
  title: 'CaptGrill',
  description: 'Kasir, stok bahan, dan absensi karyawan CaptGrill',
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
  appleWebApp: { capable: true, title: 'CaptGrill', statusBarStyle: 'black-translucent' },
};

export const viewport = {
  themeColor: '#0f3b1f',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${slab.variable}`}>
      <body>{children}</body>
    </html>
  );
}
