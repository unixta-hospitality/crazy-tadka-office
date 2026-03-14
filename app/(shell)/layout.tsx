import DashboardShell from '@/components/layout/DashboardShell';
import { ModulesProvider } from '@/lib/hooks/use-modules';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModulesProvider>
      <DashboardShell>{children}</DashboardShell>
    </ModulesProvider>
  );
}
