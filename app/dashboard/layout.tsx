import DashboardShell from '@/components/layout/DashboardShell';
import { ModulesProvider } from '@/lib/hooks/use-modules';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModulesProvider>
      <DashboardShell>{children}</DashboardShell>
    </ModulesProvider>
  );
}
