import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getGroupProducts, getGroups, getProducts } from '../../api/products';
import { SectionSurface } from '../../components/layout/SectionSurface';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Skeleton } from '../../components/ui/skeleton';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';
import type { Category, Product, ProductGroup, SectionStyle } from '../../types';

interface GroupSection {
  group: ProductGroup;
  products: Product[];
}

const TRUST_MESSAGES = [
  'Free shipping over $75',
  'Easy 30-day returns',
  'Secure checkout',
  'Real human support',
];

export function Home() {
  const { theme } = useTheme();
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupSections, setGroupSections] = useState<GroupSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProducts({ pageSize: 100 })
      .then((res) => {
        if (!cancelled) setAllProducts(res.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products');
      });

    getCategories()
      .then((res) => {
        if (!cancelled) setCategories(res.items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    getGroups()
      .then(async (res) => {
        const sections = await Promise.all(
          res.items.map(async (group) => {
            const productsRes = await getGroupProducts(group.id, { pageSize: 8 });
            return { group, products: productsRes.items };
          }),
        );
        if (!cancelled) setGroupSections(sections.filter((s) => s.products.length > 0));
      })
      .catch(() => {
        if (!cancelled) setGroupSections([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const featured = allProducts?.filter((p) => p.is_featured) ?? [];
  const bestsellers = allProducts?.filter((p) => p.is_bestseller) ?? [];
  const clearance = allProducts?.filter((p) => p.is_clearance) ?? [];

  const hasCategorizedContent =
    featured.length > 0 || bestsellers.length > 0 || clearance.length > 0 || groupSections.length > 0;
  const newIn = !hasCategorizedContent ? (allProducts ?? []).slice(0, 8) : [];

  const sectionStyles = theme?.section_styles;

  return (
    <div className="flex flex-col">
      <SectionSurface variant={sectionStyles?.hero ?? 'gradient'} className="relative overflow-hidden">
        <div className="container flex min-h-[60vh] flex-col justify-end gap-4 py-14 sm:min-h-[70vh] sm:py-20">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">New season</span>
          <h1 className="max-w-3xl font-display text-6xl uppercase leading-[0.88] tracking-normal sm:text-8xl">
            {theme?.brand_name ?? 'Welcome'}
          </h1>
          {theme?.tagline && <p className="max-w-md text-base opacity-90 sm:text-lg">{theme.tagline}</p>}
          <Link
            to="/products"
            className="mt-2 inline-flex h-12 w-fit items-center justify-center rounded-full bg-background px-8 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-opacity hover:opacity-80"
          >
            Shop now
          </Link>
        </div>
      </SectionSurface>

      <TrustStrip />

      {categories.length > 0 && <CategoryTiles categories={categories} />}

      {error && (
        <div className="container py-16">
          <ErrorMessage message={error} />
        </div>
      )}

      {allProducts === null && !error && (
        <div className="container py-16">
          <div className="grid grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </div>
      )}

      {newIn.length > 0 && (
        <div className="container py-16">
          <PlainSection title="New in" products={newIn} />
        </div>
      )}

      {featured.length > 0 && (
        <MerchBanner variant={sectionStyles?.featured ?? 'flat'} title="Featured" products={featured} />
      )}

      {(bestsellers.length > 0 || clearance.length > 0) && (
        <div className="container flex flex-col gap-20 py-16">
          {bestsellers.length > 0 && <PlainSection title="Bestsellers" products={bestsellers} />}
          {clearance.length > 0 && <PlainSection title="Clearance" products={clearance} />}
        </div>
      )}

      {groupSections.map(({ group, products }) => (
        <MerchBanner
          key={group.id}
          variant={sectionStyles?.groupBanner ?? 'gradient'}
          title={group.name}
          description={group.description}
          products={products}
        />
      ))}
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="w-full bg-foreground text-background">
      <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em]">
        {TRUST_MESSAGES.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="container py-16">
      <h2 className="mb-8 font-display text-2xl uppercase leading-none tracking-normal sm:text-3xl">
        Shop by category
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/category/${cat.slug}`}
            className={cn(
              'group relative flex aspect-[4/5] flex-col justify-end p-5 transition-opacity hover:opacity-90',
              i % 2 === 0 ? 'bg-foreground text-background' : 'bg-muted text-foreground',
            )}
          >
            <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 opacity-60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            <span className="font-display text-xl uppercase leading-[0.95] sm:text-2xl">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PlainSection({ title, products }: { title: string; products: Product[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <h2 className="font-display text-2xl uppercase leading-none tracking-normal sm:text-3xl">{title}</h2>
        <Link
          to="/products"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 transition-colors hover:text-brand hover:underline"
        >
          Shop all
        </Link>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}

function MerchBanner({
  variant,
  title,
  description,
  products,
}: {
  variant: SectionStyle;
  title: string;
  description?: string | null;
  products: Product[];
}) {
  return (
    <section>
      <SectionSurface variant={variant}>
        <div className="container flex flex-col gap-2 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl uppercase leading-[0.9] tracking-normal sm:text-5xl">{title}</h2>
            {description && <p className="max-w-lg opacity-90">{description}</p>}
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline"
          >
            Shop all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </SectionSurface>
      <div className="container py-10 sm:py-14">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
