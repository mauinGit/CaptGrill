import './globals.css';

export const metadata = {
  title: 'CaptGrill - Sistem Manajemen Penjualan',
  description: 'Sistem Informasi Manajemen Penjualan CaptGrill - Kebab, Burger & Drinks',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
