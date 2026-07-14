import { FileText, LayoutDashboard, Package, Palette, Receipt, Shapes, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/groups', label: 'Groups', icon: Shapes },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/theme', label: 'Theme settings', icon: Palette },
  { to: '/admin/resources', label: 'Resources', icon: FileText },
  { to: '/admin/insights', label: 'AI Insights', icon: Sparkles },
];

export function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-background">
      <nav className="flex flex-col gap-1 p-4">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                isActive && 'bg-brand-tint-10 text-brand',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
