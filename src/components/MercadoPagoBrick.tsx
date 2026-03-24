import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MP_SDK_URL = "https://sdk.mercadopago.com/js/v2";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

type BrickPayload = {
  token: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  payment_method_id: string;
};

type Props = {
  publicKey: string;
  amount: number;
  email: string;
  onSubmit: (payload: BrickPayload) => Promise<void>;
};

function getScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MP_SDK_URL}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Mercado Pago SDK")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = MP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Mercado Pago SDK"));
    document.body.appendChild(script);
  });
}

export default function MercadoPagoBrick({ publicKey, amount, email, onSubmit }: Props) {
  const containerId = "mercadopago-payment-brick";
  const controllerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountBrick() {
      if (!publicKey || amount <= 0) return;

      setLoading(true);
      setError(null);

      try {
        await getScript();
        if (cancelled) return;

        if (!window.MercadoPago) {
          throw new Error("Mercado Pago SDK no está disponible");
        }

        if (controllerRef.current?.unmount) {
          controllerRef.current.unmount();
          controllerRef.current = null;
        }

        const mp = new window.MercadoPago(publicKey, {
          locale: "es-MX",
        });

        const bricksBuilder = mp.bricks();

        controllerRef.current = await bricksBuilder.create("payment", containerId, {
          initialization: {
            amount,
            payer: {
              email,
            },
          },
          customization: {
            paymentMethods: {
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) {
                setLoading(false);
              }
            },
            onSubmit: async (brickData: any) => {
              const formData = brickData?.formData || brickData || {};

              const payload: BrickPayload = {
                token: formData.token,
                transaction_amount: Number(formData.transaction_amount ?? amount),
                installments: Number(formData.installments ?? 1),
                payer: {
                  email: formData?.payer?.email || email,
                  identification:
                    formData?.payer?.identification?.type && formData?.payer?.identification?.number
                      ? {
                          type: formData.payer.identification.type,
                          number: formData.payer.identification.number,
                        }
                      : undefined,
                },
                payment_method_id: formData.payment_method_id,
              };

              await onSubmit(payload);
            },
            onError: (mpError: any) => {
              console.error("MercadoPago Brick error", mpError);
              setError("No se pudo inicializar Mercado Pago. Revisa la Public Key o la configuración del Brick.");
              setLoading(false);
            },
          },
        });
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "No se pudo inicializar Mercado Pago");
        setLoading(false);
      }
    }

    mountBrick();

    return () => {
      cancelled = true;
      if (controllerRef.current?.unmount) {
        controllerRef.current.unmount();
      }
    };
  }, [publicKey, amount, email, onSubmit]);

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Mercado Pago</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando formulario seguro de Mercado Pago...
        </div>
      )}

      <div id={containerId} className="min-h-[160px]" />
    </div>
  );
}