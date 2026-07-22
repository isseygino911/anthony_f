import { Bell, FileText, Lightbulb, LayoutDashboard, Package, Palette, Receipt, Shapes, Sparkles, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/insights', label: 'AI Insights', icon: Sparkles },
    ],
  },
  {
    label: 'Catalog & sales',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/groups', label: 'Groups', icon: Shapes },
      { to: '/admin/orders', label: 'Orders', icon: Receipt },
      { to: '/admin/custom-neon-designs', label: 'Custom Neon', icon: Lightbulb },
      { to: '/admin/custom-neon-usage', label: 'Neon Usage', icon: Users },
    ],
  },
  {
    label: 'Site settings',
    items: [
      { to: '/admin/theme', label: 'Theme settings', icon: Palette },
      { to: '/admin/resources', label: 'Resources', icon: FileText },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-5 p-4">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </span>
          {group.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground',
                  isActive && 'bg-brand-tint-10 font-semibold text-brand',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** Always-visible sidebar for desktop viewports. */
export function AdminSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:block">
      <NavList />
    </aside>
  );
}

interface AdminMobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Slide-in drawer version of the sidebar for small viewports, reusing the shared Sheet primitive. */
export function AdminMobileSidebar({ open, onOpenChange }: AdminMobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 gap-0 p-0 sm:max-w-xs">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle>Admin menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <NavList onNavigate={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
