/**
 * Medusa.js v2 — Store API client
 *
 * Compatible with Medusa v2 (2.x).
 * Configure environment variables:
 *   VITE_MEDUSA_BACKEND_URL      → URL of your Medusa backend  (default: http://localhost:9000)
 *   VITE_MEDUSA_PUBLISHABLE_KEY  → Publishable API key from Medusa admin → Settings → API keys
 *
 * To switch from mock data to real Medusa, set USE_MOCK_DATA = false
 * (or just set both env vars and the helpers will call the real API).
 */

export const MEDUSA_BACKEND_URL =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";

export const MEDUSA_PUBLISHABLE_KEY =
  import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

/**
 * Optional: Sales Channel scoping.
 * If set, product requests will include `sales_channel_id[]` automatically.
 * This makes it easy to replicate the storefront by changing only this env var.
 */
export const MEDUSA_SALES_CHANNEL_ID =
  import.meta.env.VITE_MEDUSA_SALES_CHANNEL_ID || "";

let runtimeSalesChannelId: string | null = null;

/** Override the Sales Channel at runtime (e.g. based on domain). */
export function setMedusaSalesChannelId(id: string | null) {
  runtimeSalesChannelId = id;
}

/** Returns runtime override if set, otherwise env var. */
export function getMedusaSalesChannelId(): string {
  return (runtimeSalesChannelId ?? MEDUSA_SALES_CHANNEL_ID) || "";
}

// ─── Types (Medusa v2 shape) ──────────────────────────────────

export interface MoneyAmount {
  amount: number;
  currency_code: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  /** Medusa v2: calculated_price comes from the pricing module */
  calculated_price?: {
    calculated_amount: number;
    currency_code: string;
  };
  /** Legacy / direct prices array (also present in v2) */
  prices?: MoneyAmount[];
  inventory_quantity?: number;
  manage_inventory?: boolean;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  metadata?: Record<string, unknown>;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  parent_category?: ProductCategory | null;
  category_children?: ProductCategory[];
  rank?: number;
}

export interface ProductTag {
  id: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  thumbnail: string | null;
  images?: ProductImage[];
  variants: ProductVariant[];
  collection?: ProductCollection | null;
  categories?: ProductCategory[];
  tags?: ProductTag[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginatedProducts {
  products: Product[];
  count: number;
  offset: number;
  limit: number;
}

export interface ProductSearchParams {
  q?: string;
  collection_id?: string[];
  category_id?: string[];
  tag_id?: string[];
  /** Medusa v2 sort: e.g. "created_at", "-created_at", "variants.prices.amount" */
  order?: string;
  offset?: number;
  limit?: number;
  /** Region ID — required for calculated_price in v2 */
  region_id?: string;
  /** Currency code */
  currency_code?: string;
  /** Optional Sales Channel filter (Medusa store API supports sales_channel_id[]) */
  sales_channel_id?: string[];
}

// ─── Cart (Medusa v2) ─────────────────────────────────────────

export interface LineItem {
  id: string;
  title: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  variant_id: string;
  product_id: string;
}

export interface Cart {
  id: string;
  items: LineItem[];
  region_id: string | null;
  subtotal: number;
  total: number;
  tax_total: number;
  shipping_total: number;
  currency_code: string;

  discount_total?: number;
  discounts?: any[];
  promotions?: any[];
}

// ─── Regions ──────────────────────────────────────────────────

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: { iso_2: string; name: string }[];
}

export interface ShippingOption {
  id: string
  name?: string
  amount?: number
}

export interface PaymentProvider {
  id: string
  name?: string
}

// ─── Low-level fetch helper ───────────────────────────────────

async function medusaFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  // Medusa v2 requires the publishable API key on every store request
  if (MEDUSA_PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = MEDUSA_PUBLISHABLE_KEY;
  }

  const res = await fetch(`${MEDUSA_BACKEND_URL}/store${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Products ─────────────────────────────────────────────────

/**
 * List / search products — Medusa v2 store endpoint.
 * Supports full-text search, collection/category filters, pagination and sorting.
 */
export async function getProducts(
  params: ProductSearchParams = {}
): Promise<PaginatedProducts> {
  const sp = new URLSearchParams();

  if (params.q) sp.set("q", params.q);
  if (params.offset !== undefined) sp.set("offset", String(params.offset));
  if (params.limit !== undefined) sp.set("limit", String(params.limit));
  if (params.order) sp.set("order", params.order);
  if (params.region_id) sp.set("region_id", params.region_id);
  if (params.currency_code) sp.set("currency_code", params.currency_code);

  params.collection_id?.forEach((id) => sp.append("collection_id[]", id));
  params.category_id?.forEach((id) => sp.append("category_id[]", id));
  params.tag_id?.forEach((id) => sp.append("tag_id[]", id));

  // Sales Channel scoping (explicit param wins; otherwise env/runtime)
  const scIds = params.sales_channel_id?.length
    ? params.sales_channel_id
    : (getMedusaSalesChannelId() ? [getMedusaSalesChannelId()] : undefined);
  scIds?.forEach((id) => sp.append("sales_channel_id[]", id));

  const qs = sp.toString();
  return medusaFetch<PaginatedProducts>(`/products${qs ? `?${qs}` : ""}`);
}

/** Get a single product by its handle */
export async function getProduct(handle: string): Promise<Product> {
  const sc = getMedusaSalesChannelId();
  const scQs = sc ? `&sales_channel_id[]=${encodeURIComponent(sc)}` : "";
  const data = await medusaFetch<PaginatedProducts>(
    `/products?handle=${encodeURIComponent(handle)}&fields=*variants,*images,*categories,*tags,*collection${scQs}`
  );
  if (!data.products.length) throw new Error(`Product not found: ${handle}`);
  return data.products[0];
}

// ─── Collections ──────────────────────────────────────────────

export async function getCollections(): Promise<ProductCollection[]> {
  const data = await medusaFetch<{
    collections: ProductCollection[];
  }>("/collections");
  return data.collections;
}

// ─── Categories ───────────────────────────────────────────────

/** Returns the full tree (parent → children) */
export async function getCategories(): Promise<ProductCategory[]> {
  const data = await medusaFetch<{
    product_categories: ProductCategory[];
  }>("/product-categories?include_descendants_tree=true&parent_category_id=null");
  return data.product_categories;
}

// ─── Cart (Medusa v2) ─────────────────────────────────────────

/** Create a new cart. Pass region_id to get correct taxes/currency. */
export async function createCart(regionId?: string): Promise<Cart> {
  const body = regionId ? JSON.stringify({ region_id: regionId }) : undefined;
  const data = await medusaFetch<{ cart: Cart }>("/carts", {
    method: "POST",
    body,
  });
  return data.cart;
}

export async function getCart(cartId: string): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}`);
  return data.cart;
}

/** Add a line item to an existing cart */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity = 1
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/carts/${cartId}/line-items`,
    {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, quantity }),
    }
  );
  return data.cart;
}

/** Update quantity of a line item */
export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/carts/${cartId}/line-items/${lineItemId}`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  );
  return data.cart;
}

/** Remove a line item from the cart */
export async function deleteLineItem(
  cartId: string,
  lineItemId: string
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(
    `/carts/${cartId}/line-items/${lineItemId}`,
    { method: "DELETE" }
  );
  return data.cart;
}

/** Apply one or more promotion codes to a cart */
export async function applyPromotions(cartId: string, promoCodes: string[]): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}/promotions`, {
    method: "POST",
    body: JSON.stringify({ promo_codes: promoCodes }),
  });
  return data.cart;
}

/** Remove one or more promotion codes from a cart */
export async function removePromotions(cartId: string, promoCodes: string[]): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}/promotions`, {
    method: "DELETE",
    body: JSON.stringify({ promo_codes: promoCodes }),
  });
  return data.cart;
}

export async function getRegions(): Promise<Region[]> {
  const data = await medusaFetch<{ regions: Region[] }>("/regions");
  return data.regions;
}

export async function updateCart(cartId: string, body: Record<string, any>): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  return data.cart
}

export async function listShippingOptions(cartId: string): Promise<ShippingOption[]> {
  const data = await medusaFetch<{ shipping_options: ShippingOption[] }>(
    `/shipping-options?cart_id=${encodeURIComponent(cartId)}`
  )
  return data.shipping_options
}

export async function addShippingMethod(cartId: string, optionId: string): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  })
  return data.cart
}

export async function listPaymentProviders(regionId: string): Promise<PaymentProvider[]> {
  const data = await medusaFetch<{ payment_providers: PaymentProvider[] }>(
    `/payment-providers?region_id=${encodeURIComponent(regionId)}`
  )
  return data.payment_providers
}

// Payment Collections / Sessions
export async function createPaymentCollection(cartId: string): Promise<any> {
  const data = await medusaFetch<{ payment_collection: any }>(`/payment-collections`, {
    method: "POST",
    body: JSON.stringify({ cart_id: cartId }),
  })
  return data.payment_collection
}

export async function initPaymentSession(paymentCollectionId: string, providerId: string): Promise<any> {
  const data = await medusaFetch<{ payment_collection: any }>(
    `/payment-collections/${paymentCollectionId}/sessions`,
    {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId }),
    }
  )
  return data.payment_collection
}

// (Opcional pero recomendado) autorizar sesión si tu proveedor lo requiere
export async function authorizePaymentSession(paymentCollectionId: string, sessionId: string): Promise<any> {
  return medusaFetch<any>(
    `/payment-collections/${paymentCollectionId}/sessions/${sessionId}/authorize`,
    { method: "POST" }
  )
}

export async function completeCart(cartId: string): Promise<any> {
  return medusaFetch<any>(`/carts/${cartId}/complete`, { method: "POST" })
}


// ─── Price helpers ────────────────────────────────────────────

/**
 * Extract the best displayable price from a variant.
 * Medusa v2 returns `calculated_price` when a region/currency is provided.
 * Falls back to first price in `prices[]` array.
 */
export function getVariantPrice(variant: ProductVariant): MoneyAmount | null {
  if (variant.calculated_price) {
    return {
      amount: variant.calculated_price.calculated_amount,
      currency_code: variant.calculated_price.currency_code,
    };
  }
  return variant.prices?.[0] ?? null;
}

export function formatPrice(
  amount: number,
  currencyCode = "MXN",
  locale = "es-MX"
): string {
  if (amount == null) return "$0.00";

  // Si el valor parece estar ya en pesos (ej: 50),
  // no lo dividimos. Si es mayor que 999, asumimos centavos (5000 → 50.00)
  const normalized =
    amount > 999 ? amount / 100 : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(normalized);
}

// ─── Mock data (development / Storybook) ─────────────────────
// Used when no Medusa backend is available. Remove / gate behind env var in production.

export const MOCK_CATEGORIES: ProductCategory[] = [
  {
    id: "cat_1", name: "Vitaminas", handle: "vitaminas",
    category_children: [
      { id: "cat_1a", name: "Vitamina A", handle: "vitamina-a" },
      { id: "cat_1b", name: "Vitamina B Complex", handle: "vitamina-b" },
      { id: "cat_1c", name: "Vitamina C", handle: "vitamina-c" },
      { id: "cat_1d", name: "Vitamina D", handle: "vitamina-d" },
      { id: "cat_1e", name: "Vitamina E", handle: "vitamina-e" },
      { id: "cat_1f", name: "Vitamina K", handle: "vitamina-k" },
      { id: "cat_1g", name: "Multivitamínicos", handle: "multivitaminicos" },
    ],
  },
  {
    id: "cat_2", name: "Minerales", handle: "minerales",
    category_children: [
      { id: "cat_2a", name: "Calcio", handle: "calcio" },
      { id: "cat_2b", name: "Magnesio", handle: "magnesio" },
      { id: "cat_2c", name: "Zinc", handle: "zinc" },
      { id: "cat_2d", name: "Hierro", handle: "hierro" },
      { id: "cat_2e", name: "Selenio", handle: "selenio" },
      { id: "cat_2f", name: "Potasio", handle: "potasio" },
    ],
  },
  {
    id: "cat_3", name: "Ácidos Grasos", handle: "acidos-grasos",
    category_children: [
      { id: "cat_3a", name: "Omega-3", handle: "omega-3" },
      { id: "cat_3b", name: "Omega-6", handle: "omega-6" },
      { id: "cat_3c", name: "Aceite de Krill", handle: "aceite-krill" },
    ],
  },
  {
    id: "cat_4", name: "Probióticos", handle: "probioticos",
    category_children: [
      { id: "cat_4a", name: "Lactobacillus", handle: "lactobacillus" },
      { id: "cat_4b", name: "Bifidobacterium", handle: "bifidobacterium" },
      { id: "cat_4c", name: "Prebióticos", handle: "prebioticos" },
    ],
  },
  {
    id: "cat_5", name: "Proteínas", handle: "proteinas",
    category_children: [
      { id: "cat_5a", name: "Whey Protein", handle: "whey" },
      { id: "cat_5b", name: "Proteína Vegana", handle: "proteina-vegana" },
      { id: "cat_5c", name: "Colágeno", handle: "colageno" },
    ],
  },
  {
    id: "cat_6", name: "Hierbas y Botánicos", handle: "hierbas",
    category_children: [
      { id: "cat_6a", name: "Ashwagandha", handle: "ashwagandha" },
      { id: "cat_6b", name: "Cúrcuma", handle: "curcuma" },
      { id: "cat_6c", name: "Equinácea", handle: "equinacea" },
    ],
  },
  {
    id: "cat_7", name: "Deportes", handle: "deportes",
    category_children: [
      { id: "cat_7a", name: "Pre-Entrenamiento", handle: "pre-entreno" },
      { id: "cat_7b", name: "Creatina", handle: "creatina" },
      { id: "cat_7c", name: "BCAAs", handle: "bcaas" },
    ],
  },
  {
    id: "cat_8", name: "Belleza", handle: "belleza",
    category_children: [
      { id: "cat_8a", name: "Cabello", handle: "cabello" },
      { id: "cat_8b", name: "Piel", handle: "piel" },
      { id: "cat_8c", name: "Uñas", handle: "unas" },
    ],
  },
];

export const MOCK_COLLECTIONS: ProductCollection[] = [
  { id: "col_1", title: "Vitaminas", handle: "vitaminas" },
  { id: "col_2", title: "Minerales", handle: "minerales" },
  { id: "col_3", title: "Ácidos Grasos", handle: "acidos-grasos" },
  { id: "col_4", title: "Probióticos", handle: "probioticos" },
  { id: "col_5", title: "Proteínas", handle: "proteinas" },
  { id: "col_6", title: "Hierbas y Botánicos", handle: "hierbas" },
  { id: "col_7", title: "Deportes", handle: "deportes" },
  { id: "col_8", title: "Belleza", handle: "belleza" },
];

function generateMockProducts(): Product[] {
  const defs: [string, string, string, string][] = [
    ["Vitamina C 1000mg", "vitamina-c-1000mg", "Refuerza tu sistema inmunológico con vitamina C de alta potencia.", "col_1"],
    ["Magnesio Bisglicinato", "magnesio-bisglicinato", "Magnesio de alta absorción para relajación muscular.", "col_2"],
    ["Omega-3 EPA/DHA", "omega-3-epa-dha", "Aceite de pescado purificado con alta concentración de ácidos grasos.", "col_3"],
    ["Zinc Picolinato 50mg", "zinc-picolinato", "Zinc en su forma más biodisponible para inmunidad.", "col_2"],
    ["Vitamina D3 + K2", "vitamina-d3-k2", "Combinación sinérgica para la salud ósea.", "col_1"],
    ["Hierro Quelado", "hierro-quelado", "Hierro bisglicinato de fácil digestión.", "col_2"],
    ["Complejo B Ultra", "complejo-b-ultra", "Todas las vitaminas del grupo B en una cápsula.", "col_1"],
    ["Probiótico 50 Billones", "probiotico-50b", "Flora intestinal equilibrada con 12 cepas.", "col_4"],
    ["Colágeno Hidrolizado", "colageno-hidrolizado", "Péptidos de colágeno tipo I y III para piel y articulaciones.", "col_5"],
    ["Ashwagandha KSM-66", "ashwagandha-ksm66", "Adaptógeno premium para estrés y energía.", "col_6"],
    ["Cúrcuma + Pimienta Negra", "curcuma-pimienta", "Máxima biodisponibilidad antiinflamatoria.", "col_6"],
    ["Creatina Monohidrato", "creatina-mono", "Rendimiento deportivo y fuerza muscular.", "col_7"],
    ["Proteína Whey Isolate", "whey-isolate", "90% proteína pura de suero de leche.", "col_5"],
    ["Melatonina 3mg", "melatonina-3mg", "Mejora la calidad del sueño de forma natural.", "col_6"],
    ["Biotina 10000mcg", "biotina-10000", "Para cabello, piel y uñas más fuertes.", "col_8"],
    ["Calcio + Vitamina D", "calcio-vit-d", "Soporte completo para huesos fuertes.", "col_2"],
    ["Aceite de Krill", "aceite-krill", "Omega-3 con astaxantina natural.", "col_3"],
    ["Multivitamínico Completo", "multivitaminico", "22 vitaminas y minerales esenciales.", "col_1"],
    ["L-Glutamina", "l-glutamina", "Recuperación muscular y salud intestinal.", "col_7"],
    ["Vitamina E 400 UI", "vitamina-e-400", "Antioxidante potente para la piel.", "col_1"],
    ["Selenio 200mcg", "selenio-200", "Mineral esencial para la tiroides.", "col_2"],
    ["BCAA 2:1:1", "bcaa-211", "Aminoácidos ramificados para rendimiento.", "col_7"],
    ["Ácido Fólico", "acido-folico", "Esencial durante el embarazo.", "col_1"],
    ["Coenzima Q10", "coenzima-q10", "Energía celular y salud cardiovascular.", "col_6"],
  ];

  const collectionsMap: Record<string, ProductCollection> = {};
  MOCK_COLLECTIONS.forEach((c) => (collectionsMap[c.id] = c));

  const badges = ["Más vendido", "Nuevo", "Popular", "-20%", "Oferta", ""];

  // Use a seeded-like deterministic approach to avoid re-renders changing prices
  return defs.map(([title, handle, description, colId], i) => ({
    id: `prod_${i + 1}`,
    title,
    handle,
    description,
    thumbnail: null,
    variants: [
      {
        id: `var_${i + 1}`,
        title: `${30 + ((i * 17 + 7) % 90)} cápsulas`,
        prices: [
          {
            amount: 799 + ((i * 313 + 99) % 2500),
            currency_code: "mxn",
          },
        ],
      },
    ],
    collection: collectionsMap[colId],
    metadata: badges[i % badges.length]
      ? { badge: badges[i % badges.length] }
      : {},
  }));
}

export const MOCK_PRODUCTS: Product[] = generateMockProducts();

/**
 * filterMockProducts — simulates Medusa v2 API filtering locally.
 * Replace calls to this with `getProducts()` once your backend is live.
 */
export function filterMockProducts(
  params: ProductSearchParams
): PaginatedProducts {
  let filtered = [...MOCK_PRODUCTS];

  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }

  if (params.collection_id?.length) {
    filtered = filtered.filter(
      (p) => p.collection && params.collection_id!.includes(p.collection.id)
    );
  }

  // Medusa v2 sort field format: "variants.prices.amount" / "-variants.prices.amount"
  if (params.order === "variants.prices.amount" || params.order === "price_asc") {
    filtered.sort(
      (a, b) =>
        (a.variants[0]?.prices?.[0]?.amount ?? 0) -
        (b.variants[0]?.prices?.[0]?.amount ?? 0)
    );
  } else if (params.order === "-variants.prices.amount" || params.order === "price_desc") {
    filtered.sort(
      (a, b) =>
        (b.variants[0]?.prices?.[0]?.amount ?? 0) -
        (a.variants[0]?.prices?.[0]?.amount ?? 0)
    );
  } else if (params.order === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title, "es"));
  } else if (params.order === "-created_at") {
    // newest first — mock keeps insertion order as "newest"
    filtered.reverse();
  }

  const count = filtered.length;
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 24;

  return {
    products: filtered.slice(offset, offset + limit),
    count,
    offset,
    limit,
  };
}
