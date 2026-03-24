import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

const MERCADOPAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string;

const MEXICO_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

if (MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(MERCADOPAGO_PUBLIC_KEY, {
    locale: "es-MX",
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    cart,
    isReady,
    refresh,
    setContactAndAddress,
    getShippingOptions,
    setShippingOption,
    getPaymentProviders,
    initPayment,
    submitMercadoPagoBrick,
    complete,
    clearLocalCart,
  } = useMedusaCart();

  const items = cart?.items ?? [];
  const currency = cart?.currency_code || "mxn";
  const canCheckout = useMemo(() => items.length > 0, [items.length]);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode] = useState("mx");

  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState<string>("");

  const [paymentProviders, setPaymentProviders] = useState<any[]>([]);
  const [paymentProviderId, setPaymentProviderId] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [mpSessionId, setMpSessionId] = useState<string>("");
  const [mpReady, setMpReady] = useState(false);
  const [processingMp, setProcessingMp] = useState(false);

  const mpSubmittingRef = useRef(false);
  const finalizeRef = useRef(false);

  const discountTotal = (cart as any)?.discount_total ?? 0;

  useEffect(() => {
    if (!isReady) return;

    (async () => {
      try {
        await refresh();

        const opts = await getShippingOptions();
        setShippingOptions(opts);
        if (opts?.length && !shippingOptionId) {
          setShippingOptionId(opts[0].id);
        }

        const prov = await getPaymentProviders();
        setPaymentProviders(prov);
      } catch (e) {
        console.error("Checkout init error:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    const shipping = (cart as any)?.shipping_address;
    if (!shipping) return;

    setEmail((prev) => prev || (cart as any)?.email || "");
    setFirstName((prev) => prev || shipping.first_name || "");
    setLastName((prev) => prev || shipping.last_name || "");
    setPhone((prev) => prev || shipping.phone || "");
    setAddress1((prev) => prev || shipping.address_1 || "");
    setAddress2((prev) => prev || shipping.address_2 || "");
    setCity((prev) => prev || shipping.city || "");
    setProvince((prev) => prev || shipping.province || "");
    setPostalCode((prev) => prev || shipping.postal_code || "");
  }, [cart]);

  const saveContactAndAddress = async () => {
    const e = email.trim();
    if (!e) throw new Error("Ingresa tu correo electrónico");
    if (!firstName.trim()) throw new Error("Ingresa tu nombre");
    if (!lastName.trim()) throw new Error("Ingresa tus apellidos");
    if (!address1.trim()) throw new Error("Ingresa tu dirección");
    if (!city.trim()) throw new Error("Ingresa tu ciudad");
    if (!province.trim()) throw new Error("Selecciona tu estado");
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

  const customization: any = {
    paymentMethods: {
      creditCard: "all",
      debitCard: "all",
      prepaidCard: "all",
      mercadoPago: "all",
      bankTransfer: "all",
      ticket: "all",
      maxInstallments: 12,
    },
    visual: {
      style: {
        theme: "flat",
        customVariables: {
          baseColor: "#00BEEF",
          formBackgroundColor: "#FAF8F5",
          inputBackgroundColor: "#ffffff",
        },
      },
    },
  };

  const handlePaymentChange = (id: string) => {
    setPaymentProviderId(id);

    if (id !== "pp_mercadopago_mercadopago") {
      setMpReady(false);
      setMpSessionId("");
      mpSubmittingRef.current = false;
    }
  };

  const onSubmit = async ({ formData }: any) => {
    if (!mpSessionId) {
      throw new Error("No existe paymentSessionId para Mercado Pago");
    }

    if (mpSubmittingRef.current) return;

    try {
      mpSubmittingRef.current = true;
      setProcessingMp(true);

      const payload: any = {
        transaction_amount: Number(formData.transaction_amount ?? cart?.total ?? 0),
        payment_method_id: formData.payment_method_id,
        payer: {
          email: formData?.payer?.email || email,
        },
      };

      // Solo pagos con tarjeta tienen token/issuer/installments
      if (formData.token) {
        payload.token = formData.token;
        payload.issuer_id = formData.issuer_id;
        payload.installments = Number(formData.installments ?? 1);
      }

      if (
        formData?.payer?.identification?.type &&
        formData?.payer?.identification?.number
      ) {
        payload.payer.identification = {
          type: formData.payer.identification.type,
          number: formData.payer.identification.number,
        };
      }

      const paymentResult = await submitMercadoPagoBrick(mpSessionId, payload);

      const status = paymentResult?.status;
      const ticketUrl =
        paymentResult?.point_of_interaction?.transaction_data?.ticket_url ||
        paymentResult?.point_of_interaction?.transaction_data?.external_resource_url ||
        paymentResult?.transaction_details?.external_resource_url ||
        null;

      // Pagos en efectivo suelen quedar pending
      if (status === "pending") {
        clearLocalCart();
        navigate("/checkout/pending", {
          state: {
            paymentResult,
            ticketUrl,
            cartId: cart?.id,
          },
        });
        return;
      }

      toast.success("Pago enviado a Mercado Pago. Estamos confirmando...");
      navigate(`/checkout/return?cart_id=${cart?.id}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "No se pudo procesar el pago con Mercado Pago");
      mpSubmittingRef.current = false;
    } finally {
      setProcessingMp(false);
    }
  };

  const onFinalize = async () => {
    if (!canCheckout) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (finalizeRef.current) return;

    try {
      finalizeRef.current = true;
      setSaving(true);

      await saveContactAndAddress();

      if (!shippingOptionId) {
        throw new Error("Selecciona un método de envío");
      }

      await setShippingOption(shippingOptionId);

      if (!paymentProviderId) {
        throw new Error("Selecciona un método de pago");
      }

      const { paymentSessionId } = await initPayment(paymentProviderId);

      if (paymentProviderId === "pp_mercadopago_mercadopago") {
        if (!paymentSessionId) {
          throw new Error("No se pudo crear la payment session de Mercado Pago");
        }

        setMpSessionId(paymentSessionId);
        setMpReady(true);
        toast.success("Formulario de Mercado Pago listo");
        return;
      }

      const result = await complete();
      clearLocalCart();
      toast.success("Orden creada correctamente");
      navigate("/checkout/return", {
        state: { completedResult: result },
      });
    } catch (e: any) {
      toast.error(e?.message || "No se pudo finalizar la compra");
      console.error(e);
      finalizeRef.current = false;
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
          <section className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                  />
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dirección de envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input type="hidden" value={countryCode} readOnly />

                <div className="space-y-2">
                  <Label htmlFor="address1">Dirección</Label>
                  <Input
                    id="address1"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="Calle, número"
                  />
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
                    <select
                      id="state"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecciona un estado</option>
                      {MEXICO_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal">Código postal</Label>
                    <Input
                      id="postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="00000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                        <div
                          key={opt.id}
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opciones de pago</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentProviders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay métodos de pago disponibles.
                  </p>
                ) : (
                  <RadioGroup value={paymentProviderId} onValueChange={handlePaymentChange} className="space-y-3">
                    {paymentProviders.map((p: any) => {
                      const isMP = p.id === "pp_mercadopago_mercadopago";

                      return (
                        <div key={p.id} className="space-y-4">
                          <div
                            className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                              paymentProviderId === p.id ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full cursor-pointer">
                              <RadioGroupItem value={p.id} id={`pay-${p.id}`} />
                              <Label
                                htmlFor={`pay-${p.id}`}
                                className="flex items-center justify-between w-full font-medium cursor-pointer"
                              >
                                <span>{isMP ? "Mercado Pago" : (p.name || p.id)}</span>

                                {isMP && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground hidden md:inline">
                                      Paga con tarjeta o efectivo
                                    </span>
                                    <img
                                      src="assets/mp_logo.webp"
                                      alt="Mercado Pago"
                                      className="h-9 w-auto rounded-full"
                                    />
                                  </div>
                                )}
                              </Label>
                            </div>
                          </div>

                          {isMP && paymentProviderId === "pp_mercadopago_mercadopago" && (
                            <div className="mt-4 border rounded-lg min-h-[100px]">
                              {!mpReady ? (
                                <div className="flex flex-col items-center p-8 bg-muted/50 rounded-lg border-dashed border-2">
                                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">
                                    Primero haz clic en “Finalizar compra” para preparar el formulario seguro
                                  </p>
                                </div>
                              ) : !mpSessionId ? (
                                <div className="flex flex-col items-center p-8 bg-muted/50 rounded-lg border-dashed border-2">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">
                                    Estableciendo conexión segura...
                                  </p>
                                </div>
                              ) : (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                  <Payment
                                    initialization={{
                                      amount: Number(cart?.total ?? 0),
                                    }}
                                    customization={customization}
                                    onSubmit={onSubmit}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={onFinalize}
                disabled={!canCheckout || saving || processingMp}
              >
                {saving ? "Preparando pago..." : processingMp ? "Procesando pago..." : "Finalizar compra"}
              </Button>
            </div>
          </section>

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
                        <div className="relative h-14 w-14 shrink-0 border border-border bg-muted">
                          <img
                            src={item.thumbnail || "/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full rounded-md object-cover"
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