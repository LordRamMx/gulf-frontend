import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  getCollections,
  getProducts,
  type PaginatedProducts,
  type Product,
  type ProductCategory,
  type ProductCollection,
  type ProductSearchParams,
  MOCK_CATEGORIES,
  MOCK_COLLECTIONS,
  MOCK_PRODUCTS,
  filterMockProducts,
} from "@/lib/medusa-client";

/**
 * Toggle mock data without changing code.
 * - VITE_USE_MOCK_DATA=true  -> always mock
 * - VITE_USE_MOCK_DATA=false -> always API
 * If undefined, we use API when backend url + publishable key are present.
 */
const USE_MOCK_DATA: boolean | null =
  typeof import.meta.env.VITE_USE_MOCK_DATA === "string"
    ? import.meta.env.VITE_USE_MOCK_DATA === "true"
    : null;

function shouldUseMock() {
  if (USE_MOCK_DATA !== null) return USE_MOCK_DATA;
  // Default behavior: keep current UX (project already uses mocks) unless user configures Medusa.
  const hasBackend = Boolean(import.meta.env.VITE_MEDUSA_BACKEND_URL);
  const hasKey = Boolean(import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY);
  return !(hasBackend && hasKey);
}

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  error: string | null;
};

function useAsync<T>(loader: () => Promise<T>, initial: T, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initial,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    loader()
      .then((data) => {
        if (!alive) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ data: initial, isLoading: false, error: String(err?.message ?? err) });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function useMedusaCategories() {
  const useMock = shouldUseMock();
  return useAsync<ProductCategory[]>(
    async () => (useMock ? MOCK_CATEGORIES : await getCategories()),
    [],
    [useMock]
  );
}

export function useMedusaCollections() {
  const useMock = shouldUseMock();
  return useAsync<ProductCollection[]>(
    async () => (useMock ? MOCK_COLLECTIONS : await getCollections()),
    [],
    [useMock]
  );
}

export function useMedusaProducts(params: ProductSearchParams) {
  const useMock = shouldUseMock();

  // stable dep (avoid rerenders when parent recreates object)
  const key = useMemo(() => JSON.stringify(params ?? {}), [params]);

  return useAsync<PaginatedProducts>(
    async () => {
      if (useMock) return filterMockProducts(params);
      return await getProducts(params);
    },
    { products: [], count: 0, offset: params.offset ?? 0, limit: params.limit ?? 24 },
    [useMock, key]
  );
}

/**
 * "Featured" is app-level logic.
 * - In Medusa you can model this via:
 *   - collection "featured"
 *   - tag "featured"
 *   - metadata flag
 * Here we implement a safe default: latest products.
 */
export function useFeaturedProducts(limit = 8) {
  const useMock = shouldUseMock();
  return useAsync<Product[]>(
    async () => {
      if (useMock) return MOCK_PRODUCTS.slice(0, limit);
      const res = await getProducts({ limit, order: "-created_at" });
      return res.products;
    },
    [],
    [useMock, limit]
  );
}
