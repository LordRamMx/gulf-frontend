import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { toast } from "sonner";
import { storeApi } from "@/lib/medusa-store"
import {
  addLineItem,
  createCart,
  getCart,
  updateLineItem,
  deleteLineItem,
  applyPromotions,
  removePromotions,
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
  refresh: () => Promise<void>
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
            refresh,
        }}
        >
        {children}
        </MedusaCartContext.Provider>
    )
}