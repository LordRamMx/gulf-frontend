const BACKEND_URL = import.meta.env.VITE_MEDUSA_BACKEND_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string;

async function medusaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Medusa ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export const storeApi = {
  createCart: (body: any) =>
    medusaFetch<{ cart: any }>(`/store/carts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getCart: (id: string) =>
    medusaFetch<{ cart: any }>(`/store/carts/${id}`),

  updateCart: (id: string, body: any) =>
    medusaFetch<{ cart: any }>(`/store/carts/${id}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addLineItem: (cartId: string, body: { variant_id: string; quantity: number }) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/line-items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLineItem: (cartId: string, lineId: string, body: { quantity: number }) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/line-items/${lineId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteLineItem: (cartId: string, lineId: string) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/line-items/${lineId}`, {
      method: "DELETE",
    }),

  listShippingOptions: (cartId: string) =>
    medusaFetch<{ shipping_options: any[] }>(`/store/shipping-options?cart_id=${cartId}`),

  addShippingMethod: (cartId: string, body: { option_id: string }) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/shipping-methods`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  addPromotions: (cartId: string, promo_codes: string[]) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/promotions`, {
      method: "POST",
      body: JSON.stringify({ promo_codes }),
    }),

  removePromotions: (cartId: string, promo_codes: string[]) =>
    medusaFetch<{ cart: any }>(`/store/carts/${cartId}/promotions`, {
      method: "DELETE",
      body: JSON.stringify({ promo_codes }),
    }),

  // Payment (la ruta exacta puede variar según tu setup v2/provider)
  createPaymentCollection: (cartId: string) =>
    medusaFetch<{ payment_collection: any }>(`/store/payment-collections`, {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    }),

  initPaymentSession: (paymentCollectionId: string, provider_id: string) =>
    medusaFetch<{ payment_collection: any }>(`/store/payment-collections/${paymentCollectionId}/sessions`, {
      method: "POST",
      body: JSON.stringify({ provider_id }),
    }),

  completeCart: (cartId: string) =>
    medusaFetch<any>(`/store/carts/${cartId}/complete`, { method: "POST" }),
};