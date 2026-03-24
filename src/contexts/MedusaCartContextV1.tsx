import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  addLineItem,
  addShippingMethod,
  applyPromotions,
  completeCart,
  createCart,
  createPaymentCollection,
  deleteLineItem,
  getCart,
  initPaymentSession,
  listPaymentProviders,
  listShippingOptions,
  PaymentProvider,
  removePromotions,
  ShippingOption,
  submitMercadoPagoPayment,
  type Cart,
  updateCart,
  updateLineItem,
} from "@/lib/medusa-client";

const CART_ID_KEY = "medusa_cart_id";
const REGION_ID = import.meta.env.VITE_MEDUSA_REGION_ID as string | undefined;

export type MercadoPagoBrickPayload = {
  token?: string;
  issuer_id?: string;
  transaction_amount: number;
  installments?: number;
  payer: {
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_method_id: string;
};

type Ctx = {
  cart: Cart | null;
  count: number;
  isReady: boolean;

  ensureCart: () => Promise<Cart>;
  refresh: () => Promise<void>;

  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQty: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;

  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;

  setContactAndAddress: (data: {
    email: string;
    shipping_address: any;
    billing_address?: any;
  }) => Promise<void>;

  getShippingOptions: () => Promise<ShippingOption[]>;
  setShippingOption: (optionId: string) => Promise<void>;

  getPaymentProviders: () => Promise<PaymentProvider[]>;
  initPayment: (providerId: string) => Promise<{ paymentSessionId?: string; redirectUrl?: string }>;
  submitMercadoPagoBrick: (paymentSessionId: string, payload: MercadoPagoBrickPayload) => Promise<any>;
  complete: () => Promise<any>;

  clearLocalCart: () => void;
};

const MedusaCartContext = createContext<Ctx | null>(null);

export const useMedusaCart = () => {
  const ctx = useContext(MedusaCartContext);
  if (!ctx) throw new Error("useMedusaCart must be used within MedusaCartProvider");
  return ctx;
};

export function MedusaCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * Este ref invalida requests viejas del carrito.
   * Si limpiamos el carrito mientras una request está en vuelo,
   * evitamos que esa respuesta "reviva" el cart en memoria.
   */
  const cartRequestVersionRef = useRef(0);

  const getCartId = () => localStorage.getItem(CART_ID_KEY);

  const clearLocalCart = useCallback(() => {
    cartRequestVersionRef.current += 1;
    localStorage.removeItem(CART_ID_KEY);
    setCart(null);
  }, []);

  const refresh = useCallback(async () => {
    const id = getCartId();

    if (!id) {
      setCart(null);
      return;
    }

    const requestVersion = cartRequestVersionRef.current;

    try {
      const c = await getCart(id);

      // Si el carrito fue invalidado mientras esperábamos, ignoramos la respuesta
      if (cartRequestVersionRef.current !== requestVersion) return;
      if (getCartId() !== id) return;

      setCart(c);
    } catch {
      if (cartRequestVersionRef.current !== requestVersion) return;

      localStorage.removeItem(CART_ID_KEY);
      setCart(null);
    }
  }, []);

  const ensureCart = useCallback(async (): Promise<Cart> => {
    const existing = getCartId();

    if (existing) {
      const requestVersion = cartRequestVersionRef.current;
      const fresh = await getCart(existing);

      if (cartRequestVersionRef.current !== requestVersion) {
        throw new Error("El carrito cambió mientras se cargaba");
      }

      if (getCartId() !== existing) {
        throw new Error("El carrito dejó de ser válido");
      }

      setCart(fresh);
      return fresh;
    }

    if (!REGION_ID) {
      throw new Error("VITE_MEDUSA_REGION_ID no está configurado");
    }

    const requestVersion = cartRequestVersionRef.current;
    const fresh = await createCart(REGION_ID);

    if (cartRequestVersionRef.current !== requestVersion) {
      throw new Error("El carrito fue invalidado durante la creación");
    }

    localStorage.setItem(CART_ID_KEY, fresh.id);
    setCart(fresh);
    return fresh;
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      try {
        const c = await ensureCart();
        const updated = await addLineItem(c.id, variantId, quantity);
        setCart(updated);
        toast.success("Producto agregado al carrito");
      } catch (e) {
        console.error(e);
        toast.error("No se pudo agregar al carrito");
      }
    },
    [ensureCart]
  );

  const updateQty = useCallback(
    async (lineItemId: string, quantity: number) => {
      try {
        const c = await ensureCart();
        const updated =
          quantity <= 0
            ? await deleteLineItem(c.id, lineItemId)
            : await updateLineItem(c.id, lineItemId, quantity);
        setCart(updated);
      } catch (e) {
        console.error(e);
        toast.error("No se pudo actualizar la cantidad");
      }
    },
    [ensureCart]
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      try {
        const c = await ensureCart();
        const updated = await deleteLineItem(c.id, lineItemId);
        setCart(updated);
        toast.message("Producto eliminado");
      } catch (e) {
        console.error(e);
        toast.error("No se pudo eliminar el producto");
      }
    },
    [ensureCart]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      const coupon = code.trim();
      if (!coupon) {
        toast.error("Ingresa un cupón");
        return;
      }

      try {
        const c = await ensureCart();
        const updated = await applyPromotions(c.id, [coupon]);
        setCart(updated);
        toast.success("Cupón aplicado");
      } catch (e) {
        console.error(e);
        toast.error("Cupón inválido o no aplicable");
      }
    },
    [ensureCart]
  );

  const removeCoupon = useCallback(
    async (code: string) => {
      const coupon = code.trim();
      if (!coupon) return;

      try {
        const c = await ensureCart();
        const updated = await removePromotions(c.id, [coupon]);
        setCart(updated);
        toast.message("Cupón removido");
      } catch (e) {
        console.error(e);
        toast.error("No se pudo remover el cupón");
      }
    },
    [ensureCart]
  );

  const setContactAndAddress = useCallback(
    async (data: { email: string; shipping_address: any; billing_address?: any }) => {
      try {
        const c = await ensureCart();
        const updated = await updateCart(c.id, data);
        setCart(updated);
      } catch (e) {
        console.error(e);
        toast.error("No se pudo guardar la información de contacto/envío");
      }
    },
    [ensureCart]
  );

  const getShippingOptions = useCallback(async () => {
    const c = await ensureCart();
    return listShippingOptions(c.id);
  }, [ensureCart]);

  const setShippingOption = useCallback(
    async (optionId: string) => {
      try {
        const c = await ensureCart();
        const updated = await addShippingMethod(c.id, optionId);
        setCart(updated);
      } catch (e: any) {
        console.error(e);

        const msg =
          typeof e?.message === "string" ? e.message : "No se pudo aplicar el método de envío";

        if (msg.includes("do not have a price")) {
          toast.error("La opción de envío seleccionada no tiene precio configurado en Medusa.");
          return;
        }

        toast.error("No se pudo aplicar el método de envío");
      }
    },
    [ensureCart]
  );

  const getPaymentProviders = useCallback(async () => {
    const c = await ensureCart();
    const regionId = c.region_id || REGION_ID;
    if (!regionId) return [];
    return listPaymentProviders(regionId);
  }, [ensureCart]);

  const initPayment = useCallback(
    async (providerId: string) => {
      const c = await ensureCart();
      const fresh = await getCart(c.id);

      const pc = (fresh as any)?.payment_collection ?? (await createPaymentCollection(c.id));
      const pcId = pc.id;

      const paymentCollection = await initPaymentSession(pcId, providerId);

      const sessions = paymentCollection?.payment_sessions || paymentCollection?.sessions || [];

      const session = sessions.find((s: any) => s.provider_id === providerId) || sessions[0];

      await refresh();

      return {
        paymentSessionId: session?.id,
        redirectUrl:
          session?.data?.init_point ||
          session?.data?.sandbox_init_point ||
          session?.data?.redirect_url ||
          session?.data?.url,
      };
    },
    [ensureCart, refresh]
  );

  const submitMercadoPagoBrick = useCallback(
    async (paymentSessionId: string, payload: MercadoPagoBrickPayload) => {
        return submitMercadoPagoPayment(paymentSessionId, payload);
    },
    []
  );

  const complete = useCallback(async () => {
    const c = await ensureCart();
    return completeCart(c.id);
  }, [ensureCart]);

  const count = useMemo(() => {
    const items = cart?.items ?? [];
    return items.reduce((sum, i: any) => sum + (i.quantity || 0), 0);
  }, [cart]);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setIsReady(true);
      }
    })();
  }, [refresh]);

  return (
    <MedusaCartContext.Provider
      value={{
        cart,
        count,
        isReady,
        ensureCart,
        refresh,
        addItem,
        updateQty,
        removeItem,
        applyCoupon,
        removeCoupon,
        setContactAndAddress,
        getShippingOptions,
        setShippingOption,
        getPaymentProviders,
        initPayment,
        submitMercadoPagoBrick,
        complete,
        clearLocalCart,
      }}
    >
      {children}
    </MedusaCartContext.Provider>
  );
}