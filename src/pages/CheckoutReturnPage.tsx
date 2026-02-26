import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMedusaCart } from "@/contexts/MedusaCartContext";

export default function CheckoutReturnPage() {
  /*onst navigate = useNavigate();
  const { refresh, complete, clearLocalCart } = useMedusaCart();
  const [status, setStatus] = useState("Procesando pago...");

  useEffect(() => {
    (async () => {
      try {
        await refresh();

        // En un escenario real: aquí podrías consultar el estado del payment
        // y/o esperar unos segundos a que el webhook confirme.
        await complete();

        clearLocalCart();
        setStatus("Pago confirmado. Pedido creado.");
        navigate("/"); // o a /order/thank-you
      } catch (e: any) {
        setStatus("No se pudo completar el pedido. Revisa el estado del pago.");
      }
    })();
  }, [refresh, complete, clearLocalCart, navigate]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">{status}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Si esto tarda, es normal: estamos esperando confirmación del proveedor.
      </p>
    </div>
  );*/
}