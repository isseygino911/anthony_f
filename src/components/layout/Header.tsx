import { Heart, LogOut, Menu, Moon, Package, ShoppingCart, Sun, User as UserIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getGroups } from '../../api/products';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useTheme } from '../../hooks/useTheme';
import type { Category, ProductGroup } from '../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

export function Header() {
  const { theme, mode, toggleMode } = useTheme();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
    getGroups()
      .then((res) => setGroups(res.items))
      .catch(() => setGroups([]));
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            {theme?.logo_url ? (
              <img src={theme.logo_url} alt={theme.brand_name} className="h-8 w-8 rounded object-contain" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-brand-foreground">
                {(theme?.brand_name ?? 'S').charAt(0)}
              </span>
            )}
            <span>{theme?.brand_name ?? 'Storefront'}</span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link to="/" className="hover:text-brand">
              Home
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="hover:text-brand">
                {cat.name}
              </Link>
            ))}
            {groups.map((group) => (
              <Link key={group.id} to={`/group/${group.id}`} className="hover:text-brand">
                {group.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" asChild aria-label="Cart">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account/favorites">
                      <Heart className="mr-2 h-4 w-4" /> Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders">
                      <Package className="mr-2 h-4 w-4" /> Orders
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login">Log in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/register">Create account</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-2 border-t p-4 text-sm md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)}>
              {cat.name}
            </Link>
          ))}
          {groups.map((group) => (
            <Link key={group.id} to={`/group/${group.id}`} onClick={() => setMobileOpen(false)}>
              {group.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
