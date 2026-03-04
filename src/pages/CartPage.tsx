import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";

import MarketplaceHeader from "@/components/MarketplaceHeader";
import Footer from "@/components/Footer";
import { useMedusaCart } from "@/contexts/MedusaCartContext";
import { formatPrice } from "@/lib/medusa-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQty, removeItem, applyCoupon, removeCoupon } = useMedusaCart();

  const items = cart?.items ?? [];

  const currency = cart?.currency_code || "mxn";

  const [couponInput, setCouponInput] = useState("");

  // Si tu backend devuelve promociones, intentamos leer algún código para mostrarlo
  const appliedCodes = useMemo(() => {
    const promos = (cart as any)?.promotions || (cart as any)?.discounts || [];
    // depende de tu backend/plugin; intentamos extraer algo legible
    const codes: string[] = [];
    for (const p of promos) {
      if (typeof p?.code === "string") codes.push(p.code);
      if (typeof p?.promotion_code === "string") codes.push(p.promotion_code);
    }
    return Array.from(new Set(codes));
  }, [cart]);

  const discountTotal = (cart as any)?.discount_total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Carrito</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra tus productos y finaliza tu compra.
            </p>
          </div>

          <Link to="/productos" className="text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Seguir comprando
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <section className="lg:col-span-2">
            <div className="hidden md:grid grid-cols-[1fr_220px_140px_40px] gap-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
              <div>Producto</div>
              <div className="text-center">Cantidad</div>
              <div className="text-right">Subtotal</div>
              <div />
            </div>

            {items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-semibold">Tu carrito está vacío</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Agrega productos para continuar.
                </p>
                <Button className="mt-6" onClick={() => navigate("/productos")}>
                  Ver productos
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const itemSubtotal = item.total ?? item.unit_price * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="py-5 grid grid-cols-1 md:grid-cols-[1fr_220px_140px_40px] gap-4 items-center"
                    >
                      {/* Product */}
                      <div className="flex gap-4">
                        <div className="h-20 w-20 shrink-0 rounded-md bg-muted overflow-hidden border border-border">
                          <img
                            src={item.thumbnail || "/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-snug line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatPrice(item.unit_price, currency)}
                          </p>
                        </div>
                      </div>

                      {/* Qty */}
                      <div className="flex items-center justify-start md:justify-center">
                        <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <div className="w-14 text-center text-sm font-medium">
                            {item.quantity}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="text-left md:text-right font-semibold text-foreground">
                        {formatPrice(itemSubtotal, currency)}
                      </div>

                      {/* Remove */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coupon */}
            {items.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Código del cupón"
                  className="sm:max-w-xs"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => applyCoupon(couponInput)}>
                    Aplicar cupón
                  </Button>
                  {appliedCodes.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => removeCoupon(appliedCodes[0])}
                    >
                      Quitar
                    </Button>
                  )}
                </div>

                {appliedCodes.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cupón activo: <span className="font-semibold">{appliedCodes[0]}</span>
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Summary */}
          <aside>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Total del carrito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(cart?.subtotal ?? 0, currency)}</span>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento</span>
                      <span className="font-medium">- {formatPrice(discountTotal, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-medium">
                      {(cart?.shipping_total ?? 0) === 0 ? "GRATIS" : formatPrice(cart?.shipping_total ?? 0, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span className="font-medium">{formatPrice(cart?.tax_total ?? 0, currency)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatPrice(cart?.total ?? 0, currency)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={items.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  Finalizar compra
                  <ArrowRight className="ml-0 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}