import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const safeUser = {
    name: user.name,
    email: user.email,
    role: user.roleName,
    permissions: user.permissions,
    cro: user.cro || undefined,
    specialty: user.specialty || undefined,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar de navegação com RBAC */}
      <Sidebar user={safeUser} />

      {/* Área de conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={safeUser} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
