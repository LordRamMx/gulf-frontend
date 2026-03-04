import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import MarketplaceHeader from "@/components/MarketplaceHeader";
import Footer from "@/components/Footer";
import { useMedusaCart } from "@/contexts/MedusaCartContext";
import { formatPrice } from "@/lib/medusa-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const {
    cart,
    isReady,
    refresh,
    setContactAndAddress,
    getShippingOptions,
    setShippingOption,
    getPaymentProviders,
    initPayment,
    complete,
  } = useMedusaCart();

  const items = cart?.items ?? [];
  const currency = cart?.currency_code || "mxn";
  const canCheckout = useMemo(() => items.length > 0, [items.length]);

  // form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("mx");

  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState<string>("");

  const [paymentProviders, setPaymentProviders] = useState<any[]>([]);
  const [paymentProviderId, setPaymentProviderId] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const discountTotal = (cart as any)?.discount_total ?? 0;

  useEffect(() => {
    if (!isReady) return;

    (async () => {
      await refresh();
      if (!cart?.id) return;

      try {
        const opts = await getShippingOptions();
        setShippingOptions(opts);
        if (opts?.length && !shippingOptionId) setShippingOptionId(opts[0].id);
      } catch (e) {
        console.error(e);
      }

      try {
        const prov = await getPaymentProviders();
        setPaymentProviders(prov);

        const mp = prov.find((p: any) => p.id === "mercadopago");
        const first = mp?.id || prov?.[0]?.id || "";
        if (!paymentProviderId) setPaymentProviderId(first);
      } catch (e) {
        console.error(e);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, [isReady]);

  const saveContactAndAddress = async () => {
    const e = email.trim();
    if (!e) throw new Error("Ingresa tu correo electrónico");
    if (!firstName.trim()) throw new Error("Ingresa tu nombre");
    if (!lastName.trim()) throw new Error("Ingresa tus apellidos");
    if (!address1.trim()) throw new Error("Ingresa tu dirección");
    if (!city.trim()) throw new Error("Ingresa tu ciudad");
    if (!province.trim()) throw new Error("Ingresa tu estado");
    if (!postalCode.trim()) throw new Error("Ingresa tu código postal");

    const shipping_address = {
      first_name: firstName,
      last_name: lastName,
      phone,
      address_1: address1,
      address_2: address2,
      city,
      province,
      postal_code: postalCode,
      country_code: countryCode,
    };

    await setContactAndAddress({
      email: e,
      shipping_address,
      billing_address: shipping_address,
    });
  };

  const onFinalize = async () => {
    if (!canCheckout) {
      toast.error("Tu carrito está vacío");
      return;
    }

    try {
      setSaving(true);

      // 1) Guardar contacto + dirección
      await saveContactAndAddress();

      // 2) Shipping
      if (!shippingOptionId) throw new Error("Selecciona un método de envío");
      await setShippingOption(shippingOptionId);

      // 3) Payment init
      if (!paymentProviderId) throw new Error("Selecciona un método de pago");

      const { redirectUrl } = await initPayment(paymentProviderId);

      if (paymentProviderId === "mercadopago") {
        if (!redirectUrl) {
          throw new Error(
            "Mercado Pago no devolvió URL de redirección. Revisa si el provider está configurado para redirect."
          );
        }
        window.location.href = redirectUrl;
        return;
      }

      // 4) Otros providers (manual/offline)
      await complete();
      toast.success("Orden creada correctamente");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e?.message || "No se pudo finalizar la compra");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Completa la información para finalizar tu compra.
            </p>
          </div>

          <Link to="/carrito" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al carrito
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <section className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first">Nombre</Label>
                    <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last">Apellidos</Label>
                    <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono (opcional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Shipping address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dirección de envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address1">Dirección</Label>
                  <Input id="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Calle, número" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address2">Colonia / Depto (opcional)</Label>
                  <Input id="address2" value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input id="state" value={province} onChange={(e) => setProvince(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal">Código postal</Label>
                    <Input id="postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País (ISO2)</Label>
                    <Input id="country" value={countryCode} onChange={(e) => setCountryCode(e.target.value.toLowerCase())} placeholder="mx" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opciones de envío</CardTitle>
              </CardHeader>
              <CardContent>
                {shippingOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay opciones de envío disponibles (revisa configuración en Medusa).
                  </p>
                ) : (
                  <RadioGroup value={shippingOptionId} onValueChange={setShippingOptionId} className="space-y-3">
                    {shippingOptions.map((opt: any) => {
                      const amount = opt.amount ?? 0;
                      return (
                        <div key={opt.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={opt.id} id={`ship-${opt.id}`} />
                            <Label htmlFor={`ship-${opt.id}`} className="font-medium">
                              {opt.name || "Envío"}
                            </Label>
                          </div>
                          <span className="text-sm font-semibold">
                            {amount === 0 ? "GRATIS" : formatPrice(amount, currency)}
                          </span>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Payment options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opciones de pago</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentProviders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay métodos de pago disponibles (revisa payment providers en la región).
                  </p>
                ) : (
                  <RadioGroup value={paymentProviderId} onValueChange={setPaymentProviderId} className="space-y-3">
                    {paymentProviders.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={p.id} id={`pay-${p.id}`} />
                          <Label htmlFor={`pay-${p.id}`} className="font-medium">
                            {p.name || p.id}
                          </Label>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.id}</span>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {paymentProviderId === "mercadopago" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Serás redirigido a Mercado Pago para completar el pago.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" onClick={onFinalize} disabled={!canCheckout || saving}>
                {saving ? "Procesando..." : "Finalizar compra"}
              </Button>
            </div>
          </section>

          {/* Right */}
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay productos en el carrito.</p>
                ) : (
                  <div className="space-y-4">
                    {items.map((item: any) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden border border-border bg-muted">
                          <img
                            src={item.thumbnail || "/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {item.quantity}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{item.title}</p>
                        </div>

                        <div className="text-sm font-medium">
                          {formatPrice(item.unit_price, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

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
                      {(cart?.shipping_total ?? 0) === 0 ? "—" : formatPrice(cart?.shipping_total ?? 0, currency)}
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
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}