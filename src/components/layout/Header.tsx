import {
  ChevronDown,
  Heart,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveDesign } from '../../api/customNeon';
import { getCategories, getGroups } from '../../api/products';
import { AssistantDrawer } from '../assistant/AssistantDrawer';
import { CartDrawer } from '../cart/CartDrawer';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import type { Category, CustomNeonDesign, ProductGroup } from '../../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

function ProductsNavMenu({ categories, groups }: { categories: Category[]; groups: ProductGroup[] }) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  }

  function closeSoon() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  if (categories.length === 0 && groups.length === 0) {
    return (
      <Link to="/products" className="transition-colors hover:text-brand">
        Products
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        to="/products"
        className="flex items-center gap-1 transition-colors hover:text-brand"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Products
        <ChevronDown className="h-3 w-3" />
      </Link>
      <div
        className={cn(
          'absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 transition-all duration-150',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-popover p-4 normal-case tracking-normal text-popover-foreground shadow-lg">
          {categories.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Categories
              </span>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="rounded-md px-2 py-1.5 text-sm font-normal transition-colors hover:bg-muted hover:text-brand"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          {groups.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-border/70 pt-3">
              <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Collections
              </span>
              {groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/group/${group.id}`}
                  className="rounded-md px-2 py-1.5 text-sm font-normal transition-colors hover:bg-muted hover:text-brand"
                >
                  {group.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDesign, setActiveDesign] = useState<CustomNeonDesign | null>(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
    getGroups()
      .then((res) => setGroups(res.items))
      .catch(() => setGroups([]));
  }, []);

  // Site-wide "your neon preview is still generating" indicator — visible on
  // every storefront page (not just /custom-neon or My Designs), so closing
  // the tab or navigating away never leaves the user without a way to see
  // that their generation is still in progress.
  useEffect(() => {
    if (!user) {
      setActiveDesign(null);
      return;
    }
    let cancelled = false;
    function poll() {
      getActiveDesign()
        .then((res) => {
          if (!cancelled) setActiveDesign(res.design);
        })
        .catch(() => {
          // transient poll failure — next tick will retry
        });
    }
    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

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

  function handleAssistantClick() {
    if (!user) {
      navigate('/login');
      return;
    }
    setAssistantOpen(true);
  }

  function toggleMobileSearch() {
    setMobileOpen(false);
    setMobileSearchOpen((v) => !v);
  }

  function toggleMobileMenu() {
    setMobileSearchOpen(false);
    setMobileOpen((v) => !v);
  }

  function handleMobileSearchSubmit(e: FormEvent) {
    handleSearchSubmit(e);
    setMobileSearchOpen(false);
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
          <Link to="/company-insights" className="transition-colors hover:text-brand">
            Company
          </Link>
          <ProductsNavMenu categories={categories} groups={groups} />
          <Link to="/custom-neon" className="transition-colors hover:text-brand">
            Custom Neon
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-2">
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

          <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={handleFavoritesClick} aria-label="Favorites">
            <Heart className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={handleAssistantClick}
            aria-label="Product assistant"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileSearch}
            aria-label={mobileSearchOpen ? 'Close search' : 'Search'}
            aria-expanded={mobileSearchOpen}
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {activeDesign && (
            <Link
              to={`/custom-neon?designId=${activeDesign.id}`}
              className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
              Neon preview generating&hellip;
            </Link>
          )}

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
              <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="Account">
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
                  <DropdownMenuItem asChild>
                    <Link to="/account/designs">
                      <Sparkles className="mr-2 h-4 w-4" /> My Designs
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
            onClick={toggleMobileMenu}
            aria-label={mobileOpen ? 'Close menu' : 'Menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="border-t border-border/70 p-4 md:hidden">
          <form onSubmit={handleMobileSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              autoFocus
              className="h-10 w-full rounded-full border-none bg-muted py-2 pl-9 pr-4 text-xs normal-case tracking-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>
        </div>
      )}

      {mobileOpen && (
        <nav className="flex flex-col gap-3 border-t border-border/70 p-5 text-xs font-medium uppercase tracking-[0.12em] md:hidden">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          <Link to="/resources" onClick={() => setMobileOpen(false)}>
            Resources
          </Link>
          <Link to="/company-insights" onClick={() => setMobileOpen(false)}>
            Company
          </Link>
          <div className="flex flex-col gap-2">
            <Link to="/products" onClick={() => setMobileOpen(false)}>
              Products
            </Link>
            {(categories.length > 0 || groups.length > 0) && (
              <div className="flex flex-col gap-2 border-l border-border/70 pl-3 normal-case tracking-normal text-muted-foreground">
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)} className="text-xs">
                    {cat.name}
                  </Link>
                ))}
                {groups.map((group) => (
                  <Link key={group.id} to={`/group/${group.id}`} onClick={() => setMobileOpen(false)} className="text-xs">
                    {group.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/custom-neon" onClick={() => setMobileOpen(false)}>
            Custom Neon
          </Link>

          <div className="mt-1 flex flex-col gap-1 border-t border-border/70 pt-4">
            <span className="pb-1 text-[10px] normal-case tracking-normal text-muted-foreground">Preferences</span>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleFavoritesClick();
              }}
              className="flex items-center py-2 text-left"
            >
              <Heart className="mr-2 h-4 w-4" /> Favorites
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleAssistantClick();
              }}
              className="flex items-center py-2 text-left"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Ask the assistant
            </button>
          </div>

          <div className="flex flex-col gap-1 border-t border-border/70 pt-4">
            <span className="pb-1 text-[10px] normal-case tracking-normal text-muted-foreground">Account</span>
            {user ? (
              <>
                <span className="pb-1 text-[11px] normal-case tracking-normal text-foreground">{user.name}</span>
                <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="flex items-center py-2">
                  <Package className="mr-2 h-4 w-4" /> Orders
                </Link>
                <Link to="/account/designs" onClick={() => setMobileOpen(false)} className="flex items-center py-2">
                  <Sparkles className="mr-2 h-4 w-4" /> My Designs
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center py-2">
                    Admin panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center py-2 text-left"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center py-2">
                  <UserIcon className="mr-2 h-4 w-4" /> Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center py-2">
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
      </header>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <AssistantDrawer open={assistantOpen} onOpenChange={setAssistantOpen} />
    </>
  );
}
