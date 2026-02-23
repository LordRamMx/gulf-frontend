import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import ProductGridCard from "@/components/ProductGridCard";
import Footer from "@/components/Footer";
import type { ProductCategory, ProductSearchParams } from "@/lib/medusa-client";
import { useMedusaCategories, useMedusaCollections, useMedusaProducts } from "@/hooks/useMedusaStore";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "title", label: "Nombre A-Z" },
];

const ITEMS_PER_PAGE = 24;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("categoria") || "";
  const collectionParam = searchParams.get("coleccion") || "";

  const { data: categories } = useMedusaCategories();
  const { data: collections } = useMedusaCollections();

  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(
    collectionParam ? [collectionParam] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const findCategoryByHandle = (nodes: ProductCategory[], handle: string): ProductCategory | null => {
    for (const n of nodes) {
      if (n.handle === handle) return n;
      const child = n.category_children?.length ? findCategoryByHandle(n.category_children, handle) : null;
      if (child) return child;
    }
    return null;
  };

  const selectedCategoryId = useMemo(() => {
    if (!categoryParam) return "";
    const match = findCategoryByHandle(categories, categoryParam);
    return match?.id ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, categoryParam]);

  const medusaOrder = useMemo(() => {
    if (sort === "relevance") return undefined;
    if (sort === "price_asc") return "variants.prices.amount";
    if (sort === "price_desc") return "-variants.prices.amount";
    if (sort === "title") return "title";
    return undefined;
  }, [sort]);

  // Build search params for the Medusa API
  const searchConfig: ProductSearchParams = useMemo(() => ({
    q: query || undefined,
    collection_id: selectedCollections.length ? selectedCollections : undefined,
    category_id: selectedCategoryId ? [selectedCategoryId] : undefined,
    order: medusaOrder,
    offset: (page - 1) * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE,
  }), [query, selectedCollections, medusaOrder, selectedCategoryId, page]);

  const { data: productsRes } = useMedusaProducts(searchConfig);
  const { products, count } = productsRes;
  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCollections([]);
    setPriceRange([0, 100]);
    setSearchParams({});
    setPage(1);
  };

  const activeFilterCount = selectedCollections.length + (query ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            {query ? `Resultados para "${query}"` : categoryParam ? categoryParam : "Todos los productos"}
          </span>
        </nav>

        <div className="flex gap-6">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Filtros</h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Collections */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Categoría</h3>
              <div className="space-y-1.5">
                {collections.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(col.id)}
                      onChange={() => toggleCollection(col.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="text-sm text-muted-foreground">{col.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Precio</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>€{priceRange[0]}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="flex-1 accent-primary"
                />
                <span>€{priceRange[1]}</span>
              </div>
            </div>

            {/* Subcategories */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Subcategorías</h3>
              <div className="space-y-1">
                {categories.slice(0, 4).flatMap((cat) =>
                  (cat.category_children || []).slice(0, 2).map((sub) => (
                    <a
                      key={sub.id}
                      href={`/productos?categoria=${sub.handle}`}
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      {sub.name}
                    </a>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex lg:hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <span className="text-sm text-muted-foreground">
                  {count.toLocaleString("es-ES")} productos
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Ordenar:</span>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); setPage(1); }}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Active filters pills */}
            {activeFilterCount > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {query && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    Búsqueda: {query}
                    <button onClick={() => setSearchParams({})}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {selectedCollections.map((id) => {
                  const col = collections.find((c) => c.id === id);
                  return col ? (
                    <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      {col.title}
                      <button onClick={() => toggleCollection(id)}><X className="h-3 w-3" /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Product grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <ProductGridCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-lg text-muted-foreground">No se encontraron productos</p>
                <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductsPage;
