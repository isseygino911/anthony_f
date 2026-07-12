import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGroupProducts, getGroups, getProducts } from '../../api/products';
import { SectionSurface } from '../../components/layout/SectionSurface';
import { ErrorMessage } from '../../components/layout/AsyncState';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Skeleton } from '../../components/ui/skeleton';
import { useTheme } from '../../hooks/useTheme';
import type { Product, ProductGroup } from '../../types';

interface GroupSection {
  group: ProductGroup;
  products: Product[];
}

export function Home() {
  const { theme } = useTheme();
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);
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

  const sectionStyles = theme?.section_styles;

  return (
    <div className="flex flex-col">
      <SectionSurface variant={sectionStyles?.hero ?? 'gradient'}>
        <div className="container flex flex-col items-center gap-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{theme?.brand_name ?? 'Welcome'}</h1>
          {theme?.tagline && <p className="max-w-xl text-lg opacity-90">{theme.tagline}</p>}
          <Link
            to="/products"
            className="mt-2 rounded-md bg-background px-6 py-2 font-medium text-foreground hover:opacity-90"
          >
            Shop now
          </Link>
        </div>
      </SectionSurface>

      <div className="container flex flex-col gap-12 py-12">
        {error && <ErrorMessage message={error} />}

        {allProducts === null && !error && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        )}

        {featured.length > 0 && (
          <Section title="Featured" style={sectionStyles?.featured ?? 'flat'} products={featured} />
        )}
        {bestsellers.length > 0 && <Section title="Bestsellers" style="flat" products={bestsellers} />}
        {clearance.length > 0 && <Section title="Clearance" style="flat" products={clearance} />}

        {groupSections.map(({ group, products }) => (
          <div key={group.id} className="flex flex-col gap-4">
            <SectionSurface variant={sectionStyles?.groupBanner ?? 'gradient'} className="rounded-lg">
              <div className="flex flex-col gap-1 px-6 py-8">
                <h2 className="text-2xl font-semibold">{group.name}</h2>
                {group.description && <p className="opacity-90">{group.description}</p>}
              </div>
            </SectionSurface>
            <ProductGrid products={products} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  style,
  products,
}: {
  title: string;
  style: 'gradient' | 'flat';
  products: Product[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionSurface variant={style} className="rounded-lg px-6 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </SectionSurface>
      <ProductGrid products={products} />
    </div>
  );
}
