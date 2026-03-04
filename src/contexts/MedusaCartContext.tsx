import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { toast } from "sonner";
import { storeApi } from "@/lib/medusa-store"
import {
  addLineItem,
  createCart,
  updateCart,
  getCart,
  updateLineItem,
  deleteLineItem,
  applyPromotions,
  removePromotions,
  listShippingOptions,
  addShippingMethod,
  listPaymentProviders,
  createPaymentCollection,
  initPaymentSession,
  authorizePaymentSession,
  completeCart,
  ShippingOption,
  PaymentProvider,
  type Cart,
} from "@/lib/medusa-client";

const CART_ID_KEY = "medusa_cart_id"
const REGION_ID = import.meta.env.VITE_MEDUSA_REGION_ID as string

type MedusaCart = any

type Ctx = {
  cart: MedusaCart | null
  isReady: boolean
  count: number
  ensureCart: () => Promise<void>
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateQty: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;

  setContactAndAddress: (data: {
    email: string
    shipping_address: any
    billing_address?: any
  }) => Promise<void>

  getShippingOptions: () => Promise<ShippingOption[]>
  setShippingOption: (optionId: string) => Promise<void>

  getPaymentProviders: () => Promise<PaymentProvider[]>
  initPayment: (providerId: string) => Promise<{ redirectUrl?: string }>
  complete: () => Promise<any>
  refresh: () => Promise<void>

  clearLocalCart: () => void;
}

const MedusaCartContext = createContext<Ctx | null>(null)

export const useMedusaCart = () => {
  const ctx = useContext(MedusaCartContext)
  if (!ctx) throw new Error("useMedusaCart must be used within MedusaCartProvider")
  return ctx
}

export function MedusaCartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<MedusaCart | null>(null)
    const [isReady, setIsReady] = useState(false)

    const getCartId = () => localStorage.getItem(CART_ID_KEY)

    const refresh = useCallback(async () => {
        const id = getCartId()
        if (!id) return
        const { cart } = await storeApi.getCart(id)
        setCart(cart)
    }, [])

    const ensureCart = useCallback(async () => {
        const existing = getCartId()
        if (existing) {
        await refresh()
        return
        }

        if (!REGION_ID) {
        throw new Error("VITE_MEDUSA_REGION_ID no está configurado")
        }

        const { cart } = await storeApi.createCart({ region_id: REGION_ID })
        localStorage.setItem(CART_ID_KEY, cart.id)
        setCart(cart)
    }, [refresh])

    const addItem = useCallback(
        async (variantId: string, quantity = 1) => {
        await ensureCart()
        const id = getCartId()
        if (!id) throw new Error("No cart id")

        const { cart } = await storeApi.addLineItem(id, {
            variant_id: variantId,
            quantity,
        })

        setCart(cart)
        },
        [ensureCart]
    )

    const updateQty = useCallback(async (lineItemId: string, quantity: number) => {
    if (!lineItemId) return;
    try {
        await ensureCart()
        const id = getCartId()
        const updated =
        quantity <= 0
            ? await deleteLineItem(id, lineItemId)
            : await updateLineItem(id, lineItemId, quantity);
        setCart(updated);
    } catch (e) {
        console.error(e);
        toast.error("No se pudo actualizar la cantidad");
    }
    }, [ensureCart]);

    const removeItem = useCallback(async (lineItemId: string) => {
    if (!lineItemId) return;
    try {
        await ensureCart()
        const id = getCartId()
        const updated = await deleteLineItem(id, lineItemId);
        setCart(updated);
        toast.message("Producto eliminado");
    } catch (e) {
        console.error(e);
        toast.error("No se pudo eliminar el producto");
    }
    }, [ensureCart]);

    const applyCoupon = useCallback(async (code: string) => {
    const coupon = code.trim();
    if (!coupon) {
        toast.error("Ingresa un cupón");
        return;
    }
    try {
        await ensureCart()
        const id = getCartId()
        const updated = await applyPromotions(id, [coupon]);
        setCart(updated);
        toast.success("Cupón aplicado");
    } catch (e) {
        console.error(e);
        toast.error("Cupón inválido o no aplicable");
    }
    }, [ensureCart]);

    const removeCoupon = useCallback(async (code: string) => {
    const coupon = code.trim();
    if (!coupon) return;
    try {
        await ensureCart()
        const id = getCartId()
        const updated = await removePromotions(id, [coupon]);
        setCart(updated);
        toast.message("Cupón removido");
    } catch (e) {
        console.error(e);
        toast.error("No se pudo remover el cupón");
    }
    }, [ensureCart]);

    const setContactAndAddress = useCallback(async (data: any) => {
    try {
        await ensureCart();
        const id = getCartId()
        const updated = await updateCart(id, data);
        setCart(updated);
    } catch (e) {
        console.error(e);
        toast.error("No se pudo guardar la información de envío");
    }
    }, [ensureCart]);

    const getShippingOptions = useCallback(async () => {
        await ensureCart();
        const id = getCartId()
    return listShippingOptions(id);
    }, [ensureCart]);

    const setShippingOption = useCallback(async (optionId: string) => {
    try {
        await ensureCart();
        const id = getCartId()
        const updated = await addShippingMethod(id, optionId);
        setCart(updated);
    } catch (e) {
        console.error(e);
        toast.error("No se pudo aplicar el método de envío");
    }
    }, [ensureCart]);

    const getPaymentProviders = useCallback(async () => {
        const c = await ensureCart();
        if (REGION_ID) return [];
        return listPaymentProviders(REGION_ID);
    }, [ensureCart]);

    const initPayment = useCallback(async (providerId: string) => {
    
    const id = getCartId()
    // 1) obtener/crear payment collection
    const fresh = await getCart(id);
    const pcId =
        (fresh as any)?.payment_collection?.id
        ? (fresh as any).payment_collection.id
        : (await createPaymentCollection(id)).id;

    // 2) inicializar sesión
    const paymentCollection = await initPaymentSession(pcId, providerId);

    // 3) buscar redirectUrl (MercadoPago normalmente)
    const sessions =
        paymentCollection?.payment_sessions ||
        paymentCollection?.sessions ||
        [];

    const session = sessions.find((s: any) => s.provider_id === providerId);

    const redirectUrl =
        session?.data?.init_point ||
        session?.data?.redirect_url ||
        session?.data?.url;

    // refresca cart (por si tu backend actualiza el cart separado)
    await refresh();

    return { redirectUrl };
    }, [ensureCart, refresh]);

    const complete = useCallback(async () => {
    await ensureCart();
    const id = getCartId()
    return completeCart(id);
    }, [ensureCart]);

    const clearLocalCart = () => {
        localStorage.removeItem(CART_ID_KEY);
        setCart(null);
    };

    const count = useMemo(() => {
        const items = cart?.items ?? cart?.line_items ?? []
        return items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)
    }, [cart])

    useEffect(() => {
        ;(async () => {
        try {
            // Si ya hay cart_id en localStorage lo refrescamos
            await refresh()
        } finally {
            setIsReady(true)
        }
        })()
    }, [refresh])

    return (
        <MedusaCartContext.Provider
        value={{
            cart,
            isReady,
            count,
            ensureCart,
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
            complete,
            refresh,
            clearLocalCart
        }}
        >
        {children}
        </MedusaCartContext.Provider>
    )
}