import { AuthGuard } from "@/components/layout/AuthGuard";
import { ZenttoAppShell } from "@/components/layout/ZenttoAppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ZenttoAppShell>{children}</ZenttoAppShell>
    </AuthGuard>
  );
}
