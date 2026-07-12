import { Link, Outlet } from 'react-router-dom';
import { AdminSidebar } from '../admin/AdminSidebar';
import { NotificationBell } from '../admin/NotificationBell';
import { useTheme } from '../../hooks/useTheme';

export function AdminLayout() {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <Link to="/admin" className="font-semibold">
          {theme?.brand_name ?? 'Storefront'} Admin
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link to="/" className="text-sm text-muted-foreground hover:text-brand">
            Back to store
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
