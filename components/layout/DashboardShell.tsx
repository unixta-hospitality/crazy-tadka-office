'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
