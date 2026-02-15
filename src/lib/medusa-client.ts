// Medusa.js client utilities and types
// Configure MEDUSA_BACKEND_URL to point to your Medusa backend

export const MEDUSA_BACKEND_URL =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";

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
  metadata?: Record<string, unknown>;
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

// API helpers
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

export async function getProducts(): Promise<Product[]> {
  const data = await medusaFetch<{ products: Product[] }>("/products");
  return data.products;
}

export async function getProduct(handle: string): Promise<Product> {
  const data = await medusaFetch<{ products: Product[] }>(`/products?handle=${handle}`);
  return data.products[0];
}

export async function getCollections(): Promise<ProductCollection[]> {
  const data = await medusaFetch<{ collections: ProductCollection[] }>("/collections");
  return data.collections;
}

export async function createCart(): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>("/carts", { method: "POST" });
  return data.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number = 1): Promise<Cart> {
  const data = await medusaFetch<{ cart: Cart }>(`/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  });
  return data.cart;
}

// Mock products for development (when Medusa backend is not available)
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    title: "Vitamina C 1000mg",
    handle: "vitamina-c-1000mg",
    description: "Refuerza tu sistema inmunológico con nuestra vitamina C de alta potencia. Fórmula de liberación prolongada.",
    thumbnail: null,
    variants: [{ id: "var_1", title: "60 cápsulas", prices: [{ amount: 1499, currency_code: "eur" }] }],
    collection: { id: "col_1", title: "Vitaminas", handle: "vitaminas" },
    metadata: { badge: "Más vendido" },
  },
  {
    id: "prod_2",
    title: "Magnesio Bisglicinato",
    handle: "magnesio-bisglicinato",
    description: "Magnesio de alta absorción para relajación muscular y mejor descanso nocturno.",
    thumbnail: null,
    variants: [{ id: "var_2", title: "90 cápsulas", prices: [{ amount: 1899, currency_code: "eur" }] }],
    collection: { id: "col_2", title: "Minerales", handle: "minerales" },
    metadata: { badge: "Nuevo" },
  },
  {
    id: "prod_3",
    title: "Omega-3 EPA/DHA",
    handle: "omega-3-epa-dha",
    description: "Aceite de pescado purificado con alta concentración de ácidos grasos esenciales para la salud cardiovascular.",
    thumbnail: null,
    variants: [{ id: "var_3", title: "120 cápsulas", prices: [{ amount: 2199, currency_code: "eur" }] }],
    collection: { id: "col_1", title: "Vitaminas", handle: "vitaminas" },
    metadata: {},
  },
  {
    id: "prod_4",
    title: "Zinc Picolinato 50mg",
    handle: "zinc-picolinato-50mg",
    description: "Zinc en su forma más biodisponible. Apoya la inmunidad, piel sana y función cognitiva.",
    thumbnail: null,
    variants: [{ id: "var_4", title: "60 cápsulas", prices: [{ amount: 999, currency_code: "eur" }] }],
    collection: { id: "col_2", title: "Minerales", handle: "minerales" },
    metadata: {},
  },
  {
    id: "prod_5",
    title: "Vitamina D3 + K2",
    handle: "vitamina-d3-k2",
    description: "Combinación sinérgica para la salud ósea y la absorción óptima del calcio.",
    thumbnail: null,
    variants: [{ id: "var_5", title: "90 cápsulas", prices: [{ amount: 1699, currency_code: "eur" }] }],
    collection: { id: "col_1", title: "Vitaminas", handle: "vitaminas" },
    metadata: { badge: "Popular" },
  },
  {
    id: "prod_6",
    title: "Hierro Quelado",
    handle: "hierro-quelado",
    description: "Hierro bisglicinato de fácil digestión. Ideal para combatir la fatiga y la anemia.",
    thumbnail: null,
    variants: [{ id: "var_6", title: "60 comprimidos", prices: [{ amount: 1299, currency_code: "eur" }] }],
    collection: { id: "col_2", title: "Minerales", handle: "minerales" },
    metadata: {},
  },
];
