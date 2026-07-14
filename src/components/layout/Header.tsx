import {
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Search,
  ShoppingCart,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, getGroups } from '../../api/products';
import { AssistantDrawer } from '../assistant/AssistantDrawer';
import { CartDrawer } from '../cart/CartDrawer';
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
  const [cartOpen, setCartOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
  }

  function handleFavoritesClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/account/favorites');
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="container grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl uppercase tracking-tight">
          {theme?.logo_url ? (
            <img src={theme.logo_url} alt={theme.brand_name} className="h-8 w-8 object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm text-brand-foreground">
              {(theme?.brand_name ?? 'S').charAt(0)}
            </span>
          )}
          <span>{theme?.brand_name ?? 'Storefront'}</span>
        </Link>

        <nav className="hidden items-center justify-center gap-7 text-xs font-medium uppercase tracking-[0.12em] md:flex">
          <Link to="/" className="transition-colors hover:text-brand">
            Home
          </Link>
          <Link to="/resources" className="transition-colors hover:text-brand">
            Resources
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.slug}`} className="transition-colors hover:text-brand">
              {cat.name}
            </Link>
          ))}
          {groups.map((group) => (
            <Link key={group.id} to={`/group/${group.id}`} className="transition-colors hover:text-brand">
              {group.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1">
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="h-9 w-32 rounded-full border-none bg-muted py-2 pl-9 pr-4 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:w-40 xl:w-56"
            />
          </form>

          <Button variant="ghost" size="icon" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleFavoritesClick} aria-label="Favorites">
            <Heart className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setAssistantOpen(true)} aria-label="Product assistant">
            <MessageCircle className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-brand-foreground">
                {itemCount}
              </span>
            )}
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
        <nav className="flex flex-col gap-3 border-t border-border/70 p-5 text-xs font-medium uppercase tracking-[0.12em] md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative mb-1 md:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="h-10 w-full rounded-full border-none bg-muted py-2 pl-9 pr-4 text-xs normal-case tracking-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          <Link to="/resources" onClick={() => setMobileOpen(false)}>
            Resources
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
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <AssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  );
}
