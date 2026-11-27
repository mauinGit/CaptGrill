'use client';

import AppShell from '@/components/AppShell';

export default function AdminLayout({ children }) {
  return <AppShell role="ADMIN">{children}</AppShell>;
}
