// Medusa.js client utilities and types for marketplace (50K+ products)
// Configure MEDUSA_BACKEND_URL to point to your Medusa backend

export const MEDUSA_BACKEND_URL =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";

// ─── Types ───────────────────────────────────────────────────

export interface Price {
  amount: number;
  currency_code: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  prices: Price[];
  inventory_quantity?: number;
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
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  thumbnail: string | null;
  images?: { url: string }[];
  variants: ProductVariant[];
  collection?: ProductCollection | null;
  categories?: ProductCategory[];
  tags?: { id: string; value: string }[];
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  offset: number;
  limit: number;
}

export interface ProductSearchParams {
  q?: string;
  collection_id?: string[];
  category_id?: string[];
  tags?: string[];
  order?: string;
  offset?: number;
  limit?: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  region_id: string;
}

export interface CartItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  quantity: number;
  unit_price: number;
  variant: ProductVariant;
}

// ─── API helpers ─────────────────────────────────────────────

async function medusaFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Medusa API error: ${res.status}`);
  return res.json();
}

export async function getProducts(
  params: ProductSearchParams = {}
): Promise<{ products: Product[]; count: number }> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));
  if (params.order) searchParams.set("order", params.order);
  if (params.collection_id?.length) {
    params.collection_id.forEach((id) => searchParams.append("collection_id[]", id));
  }
  if (params.category_id?.length) {
    params.category_id.forEach((id) => searchParams.append("category_id[]", id));
  }

  const qs = searchParams.toString();
  const data = await medusaFetch<{ products: Product[]; count: number }>(
    `/products${qs ? `?${qs}` : ""}`
  );
  return data;
}

export async function getProduct(handle: string): Promise<Product> {
  const data = await medusaFetch<{ products: Product[] }>(`/products?handle=${handle}`);
  return data.products[0];
}

export async function getCollections(): Promise<ProductCollection[]> {
  const data = await medusaFetch<{ collections: ProductCollection[] }>("/collections");
  return data.collections;
}

export async function getCategories(): Promise<ProductCategory[]> {
  const data = await medusaFetch<{ product_categories: ProductCategory[] }>(
    "/product-categories?include_descendants_tree=true"
  );
  return data.product_categories;
}

export async function createCart(): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>("/carts", { method: "POST" });
  return data.cart;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number = 1
): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });
  return data.cart;
}

// ─── Mock data for development ───────────────────────────────

export const MOCK_CATEGORIES: ProductCategory[] = [
  { id: "cat_1", name: "Vitaminas", handle: "vitaminas", category_children: [
    { id: "cat_1a", name: "Vitamina A", handle: "vitamina-a" },
    { id: "cat_1b", name: "Vitamina B Complex", handle: "vitamina-b" },
    { id: "cat_1c", name: "Vitamina C", handle: "vitamina-c" },
    { id: "cat_1d", name: "Vitamina D", handle: "vitamina-d" },
    { id: "cat_1e", name: "Vitamina E", handle: "vitamina-e" },
    { id: "cat_1f", name: "Vitamina K", handle: "vitamina-k" },
    { id: "cat_1g", name: "Multivitamínicos", handle: "multivitaminicos" },
  ]},
  { id: "cat_2", name: "Minerales", handle: "minerales", category_children: [
    { id: "cat_2a", name: "Calcio", handle: "calcio" },
    { id: "cat_2b", name: "Magnesio", handle: "magnesio" },
    { id: "cat_2c", name: "Zinc", handle: "zinc" },
    { id: "cat_2d", name: "Hierro", handle: "hierro" },
    { id: "cat_2e", name: "Selenio", handle: "selenio" },
    { id: "cat_2f", name: "Potasio", handle: "potasio" },
  ]},
  { id: "cat_3", name: "Ácidos Grasos", handle: "acidos-grasos", category_children: [
    { id: "cat_3a", name: "Omega-3", handle: "omega-3" },
    { id: "cat_3b", name: "Omega-6", handle: "omega-6" },
    { id: "cat_3c", name: "Aceite de Krill", handle: "aceite-krill" },
  ]},
  { id: "cat_4", name: "Probióticos", handle: "probioticos", category_children: [
    { id: "cat_4a", name: "Lactobacillus", handle: "lactobacillus" },
    { id: "cat_4b", name: "Bifidobacterium", handle: "bifidobacterium" },
    { id: "cat_4c", name: "Prebióticos", handle: "prebioticos" },
  ]},
  { id: "cat_5", name: "Proteínas", handle: "proteinas", category_children: [
    { id: "cat_5a", name: "Whey Protein", handle: "whey" },
    { id: "cat_5b", name: "Proteína Vegana", handle: "proteina-vegana" },
    { id: "cat_5c", name: "Colágeno", handle: "colageno" },
  ]},
  { id: "cat_6", name: "Hierbas y Botánicos", handle: "hierbas", category_children: [
    { id: "cat_6a", name: "Ashwagandha", handle: "ashwagandha" },
    { id: "cat_6b", name: "Cúrcuma", handle: "curcuma" },
    { id: "cat_6c", name: "Equinácea", handle: "equinacea" },
  ]},
  { id: "cat_7", name: "Deportes", handle: "deportes", category_children: [
    { id: "cat_7a", name: "Pre-Entrenamiento", handle: "pre-entreno" },
    { id: "cat_7b", name: "Creatina", handle: "creatina" },
    { id: "cat_7c", name: "BCAAs", handle: "bcaas" },
  ]},
  { id: "cat_8", name: "Belleza", handle: "belleza", category_children: [
    { id: "cat_8a", name: "Cabello", handle: "cabello" },
    { id: "cat_8b", name: "Piel", handle: "piel" },
    { id: "cat_8c", name: "Uñas", handle: "unas" },
  ]},
];

function generateMockProducts(): Product[] {
  const names: [string, string, string, string][] = [
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

  const collections: Record<string, ProductCollection> = {
    col_1: { id: "col_1", title: "Vitaminas", handle: "vitaminas" },
    col_2: { id: "col_2", title: "Minerales", handle: "minerales" },
    col_3: { id: "col_3", title: "Ácidos Grasos", handle: "acidos-grasos" },
    col_4: { id: "col_4", title: "Probióticos", handle: "probioticos" },
    col_5: { id: "col_5", title: "Proteínas", handle: "proteinas" },
    col_6: { id: "col_6", title: "Hierbas y Botánicos", handle: "hierbas" },
    col_7: { id: "col_7", title: "Deportes", handle: "deportes" },
    col_8: { id: "col_8", title: "Belleza", handle: "belleza" },
  };

  const badges = ["Más vendido", "Nuevo", "Popular", "-20%", "Oferta", ""];

  return names.map(([title, handle, description, colId], i) => ({
    id: `prod_${i + 1}`,
    title,
    handle,
    description,
    thumbnail: null,
    variants: [{
      id: `var_${i + 1}`,
      title: `${30 + Math.floor(Math.random() * 90)} cápsulas`,
      prices: [{ amount: 799 + Math.floor(Math.random() * 2500), currency_code: "eur" }],
    }],
    collection: collections[colId],
    metadata: badges[i % badges.length] ? { badge: badges[i % badges.length] } : {},
  }));
}

export const MOCK_PRODUCTS = generateMockProducts();

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

// Helper: filter mock products locally (simulates Medusa API)
export function filterMockProducts(params: ProductSearchParams): { products: Product[]; count: number } {
  let filtered = [...MOCK_PRODUCTS];

  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }
  if (params.collection_id?.length) {
    filtered = filtered.filter((p) => p.collection && params.collection_id!.includes(p.collection.id));
  }
  if (params.order === "price_asc") {
    filtered.sort((a, b) => (a.variants[0]?.prices[0]?.amount || 0) - (b.variants[0]?.prices[0]?.amount || 0));
  } else if (params.order === "price_desc") {
    filtered.sort((a, b) => (b.variants[0]?.prices[0]?.amount || 0) - (a.variants[0]?.prices[0]?.amount || 0));
  } else if (params.order === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  const count = filtered.length;
  const offset = params.offset || 0;
  const limit = params.limit || 24;
  filtered = filtered.slice(offset, offset + limit);

  return { products: filtered, count };
}
