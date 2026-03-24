import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, ShoppingBag, ArrowRight, Home, AlertCircle } from "lucide-react";

import MarketplaceHeader from "@/components/MarketplaceHeader";
import Footer from "@/components/Footer";
import { useMedusaCart } from "@/contexts/MedusaCartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ViewState = "loading" | "success" | "error";

export default function CheckoutReturnPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { refresh, complete, clearLocalCart } = useMedusaCart();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [statusText, setStatusText] = useState("Confirmando tu pago...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<any>(null);

  const inFlightRef = useRef(false);
  const finishedRef = useRef(false);

  const cartId = params.get("cart_id");

  useEffect(() => {
    if (!cartId) {
      setViewState("error");
      setStatusText("No pudimos identificar tu compra");
      setErrorMessage("No se encontró el identificador del carrito para confirmar la orden.");
      return;
    }

    (async () => {
      for (let attempt = 1; attempt <= 8; attempt++) {
        if (finishedRef.current) return;

        try {
          setStatusText(`Confirmando pago... (${attempt}/8)`);
          await refresh();

          if (inFlightRef.current) return;
          inFlightRef.current = true;

          const result = await complete();

          finishedRef.current = true;
          clearLocalCart();
          setCompletedResult(result);
          setViewState("success");
          setStatusText("¡Pago confirmado y orden creada!");
          return;
        } catch (e) {
          inFlightRef.current = false;
          await sleep(2500);
        }
      }

      setViewState("error");
      setStatusText("Pago pendiente de confirmación");
      setErrorMessage(
        "No pudimos confirmar el pago en este momento. Si el cargo ya fue realizado, espera unos segundos y vuelve a intentarlo."
      );
    })();
  }, [cartId, refresh, complete, clearLocalCart]);

  const orderId =
    completedResult?.order?.id ||
    completedResult?.id ||
    completedResult?.order_id ||
    null;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-border shadow-sm">
            <div className="bg-gradient-to-b from-muted/40 to-background px-6 py-8 md:px-10 md:py-10">
              {viewState === "loading" && (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>

                  <h1 className="mt-5 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    Confirmando tu compra
                  </h1>

                  <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
                    Estamos validando la confirmación del pago con Mercado Pago y creando tu orden.
                  </p>
                </div>
              )}

              {viewState === "success" && (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>

                  <h1 className="mt-5 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    ¡Gracias por tu compra!
                  </h1>

                  <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
                    Tu pago fue confirmado correctamente y tu pedido ya fue creado.
                  </p>

                  {orderId && (
                    <div className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground">
                      Pedido: <span className="font-medium">{orderId}</span>
                    </div>
                  )}
                </div>
              )}

              {viewState === "error" && (
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>

                  <h1 className="mt-5 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    No pudimos confirmar tu compra
                  </h1>

                  <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
                    {errorMessage ||
                      "Ocurrió un problema al confirmar el pago. Si el cargo fue realizado, vuelve a intentar en unos momentos."}
                  </p>
                </div>
              )}
            </div>

            <CardContent className="px-6 py-8 md:px-10">
              {viewState === "loading" && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border bg-muted/30 p-5">
                    <div className="flex items-start gap-3">
                      <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{statusText}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Este proceso puede tardar unos segundos mientras recibimos la confirmación final del pago.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="secondary" asChild>
                      <Link to="/carrito">Volver al carrito</Link>
                    </Button>
                  </div>
                </div>
              )}

              {viewState === "success" && (
                <div className="space-y-6">
                  <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-5 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Estado del pago</p>
                      <p className="mt-1 text-sm text-muted-foreground">Confirmado</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">Estado del pedido</p>
                      <p className="mt-1 text-sm text-muted-foreground">Creado correctamente</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Tu compra ya fue registrada</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Puedes seguir explorando la tienda o volver al inicio. Si más adelante quieres mostrar una
                          página de “Mi pedido”, aquí es donde mejor encaja ese enlace.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                      <Link to="/productos">
                        Seguir comprando
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>

                    <Button variant="secondary" size="lg" asChild>
                      <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        Ir al inicio
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {viewState === "error" && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                    <p className="font-medium text-foreground">{statusText}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {errorMessage ||
                        "No pudimos completar la confirmación automáticamente. Intenta nuevamente en unos segundos."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => window.location.reload()} size="lg">
                      Reintentar
                    </Button>

                    <Button variant="secondary" size="lg" asChild>
                      <Link to="/carrito">Volver al carrito</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}