import { Link, useLocation } from "react-router-dom";
import {
  Clock3,
  ReceiptText,
  ExternalLink,
  Download,
  Home,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";

import MarketplaceHeader from "@/components/MarketplaceHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Mapeo de paymentPointId → label y tiempo límite
// Basado en paymentPoints del Brick de Mercado Pago para México
const PAYMENT_POINTS: Record<string, { label: string; hours: number }> = {
  oxxo:         { label: "OXXO",            hours: 48 },
  "7_eleven":   { label: "7-Eleven",         hours: 1  },
  santander:    { label: "Santander",         hours: 1  },
  bbva:         { label: "BBVA",             hours: 24 },
  citibanamex:  { label: "Citibanamex",      hours: 1  },
  telecomm:     { label: "Telecomm",         hours: 1  },
  farmacias_yza:{ label: "Farmacias Yza",    hours: 1  },
  circle_k:     { label: "Circle K",         hours: 1  },
  extra:        { label: "Extra",            hours: 1  },
  kiosko:       { label: "Kiosko",           hours: 1  },
  soriana:      { label: "Soriana",          hours: 1  },
  casa_ley:     { label: "Casa Ley",         hours: 1  },
  chedraul:     { label: "Chedraui",         hours: 1  },
  calimax:      { label: "Calimax",          hours: 1  },
};

// Fallback por payment_method_id cuando no hay paymentPointId
const METHOD_LABELS: Record<string, string> = {
  oxxo:     "OXXO",
  paycash:  "7-Eleven / Farmacias / Tiendas de conveniencia",
  bancomer: "BBVA",
  banamex:  "Citibanamex",
  serfin:   "Santander",
};

function getPointInfo(
  paymentPointId?: string | null,
  paymentMethodId?: string | null
): { label: string; hours: number } {
  if (paymentPointId) {
    return PAYMENT_POINTS[paymentPointId.toLowerCase()] ?? { label: paymentPointId, hours: 48 };
  }
  const label = METHOD_LABELS[paymentMethodId?.toLowerCase() ?? ""] ?? "punto autorizado";
  return { label, hours: 48 };
}

function getExpiryLabel(hours: number): string {
  if (hours < 1) return "menos de 1 hora";
  if (hours === 1) return "1 hora";
  if (hours === 24) return "24 horas (1 día)";
  return `${hours} horas`;
}

export default function CheckoutPendingPage() {
  const location = useLocation();

  const state = (location.state || {}) as {
    paymentResult?: any;
    ticketUrl?: string | null;
    cartId?: string | null;
    order?: any;
    paymentMethodId?: string | null;
    paymentPointId?: string | null;
  };

  // Intentar obtener ticketUrl de todas las fuentes posibles
  const ticketUrl =
    state.ticketUrl ||
    state.paymentResult?.point_of_interaction?.transaction_data?.ticket_url ||
    state.paymentResult?.point_of_interaction?.transaction_data?.external_resource_url ||
    state.paymentResult?.transaction_details?.external_resource_url ||
    null;

  const paymentMethodId = state.paymentMethodId ?? null;
  const paymentPointId  = state.paymentPointId  ?? null;
  const { label: methodLabel, hours } = getPointInfo(paymentPointId, paymentMethodId);
  const expiryLabel = getExpiryLabel(hours);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-border shadow-sm">

            {/* ── Header ── */}
            <div className="bg-gradient-to-b from-muted/40 to-background px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock3 className="h-8 w-8 text-primary animate-pulse" />
                </div>

                <h1 className="mt-5 text-2xl md:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2 justify-center">
                  <Clock3 className="h-6 w-6 text-primary shrink-0" />
                  Tu pago está pendiente
                </h1>

                <p className="mt-3 max-w-xl text-sm md:text-base text-muted-foreground">
                  Tu pedido fue registrado correctamente. Solo falta completar el pago
                  en {methodLabel} usando la ficha generada por Mercado Pago.
                </p>
              </div>
            </div>

            <CardContent className="px-6 py-8 md:px-10 space-y-5">

              {/* ── Ticket de pago ── */}
              {ticketUrl ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <ReceiptText className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Ficha de pago lista</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Abre o descarga tu ficha y preséntala en {methodLabel} para completar el pago.
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <Button asChild size="default">
                          <a href={ticketUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver ficha de pago
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="default">
                          <a href={ticketUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar ficha
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/20 p-5">
                  <div className="flex items-start gap-3">
                    <ReceiptText className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Próximo paso</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Revisa tu correo electrónico — Mercado Pago te enviará la ficha
                        de pago para completar tu compra en {methodLabel}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tiempo límite ── */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-5">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-300">
                      Tiempo límite para pagar
                    </p>
                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                      Tienes <span className="font-semibold">{expiryLabel}</span> para
                      realizar el pago. Pasado ese tiempo la ficha vencerá y tendrás
                      que iniciar una nueva compra.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Info adicional ── */}
              <div className="rounded-xl border border-border bg-muted/20 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">¿Qué sigue?</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Una vez que realices el pago, Mercado Pago nos notificará
                      automáticamente y tu pedido quedará confirmado. Recibirás un
                      correo de confirmación.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Acciones ── */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir al inicio
                  </Link>
                </Button>

                <Button variant="secondary" size="lg" asChild>
                  <Link to="/productos">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Seguir comprando
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}