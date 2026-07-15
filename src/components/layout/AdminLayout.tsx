import { Menu, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AdminMobileSidebar, AdminSidebar } from '../admin/AdminSidebar';
import { NotificationBell } from '../admin/NotificationBell';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/button';

export function AdminLayout() {
  const { theme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/admin" className="min-w-0 truncate font-semibold">
          {theme?.brand_name ?? 'Storefront'} Admin
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <div aria-hidden="true" className="h-6 w-px bg-border" />
          <Link
            to="/"
            aria-label="Back to store"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Back to store</span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <AdminMobileSidebar open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
