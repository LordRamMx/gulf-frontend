import { Product, getVariantPrice, formatPrice } from "@/lib/medusa-client";
import { useMedusaCart } from "@/contexts/MedusaCartContext";
import { toast } from "sonner";
import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductGridCardProps {
  product: Product;
}

const ProductGridCard = ({ product }: ProductGridCardProps) => {
  const { addItem } = useMedusaCart();
  const [adding, setAdding] = useState(false);

  const variantId = product.variants?.[0]?.id;

  const handleAddToCart = async () => {
    if (!variantId) {
      toast.error("Este producto no tiene variante disponible");
      return;
    }
    try {
      setAdding(true);
      await addItem(variantId, 1);
      toast.success("Producto agregado al carrito");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo agregar al carrito");
    } finally {
      setAdding(false);
    }
  };

  const priceData = getVariantPrice(product.variants?.[0]);
  const formattedPrice = priceData
    ? formatPrice(priceData.amount, priceData.currency_code)
    : "—";

  // Fake rating for demo
  const rating = 3.5 + Math.random() * 1.5;
  const reviewCount = Math.floor(50 + Math.random() * 500);

  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:card-shadow-hover hover:border-primary/30">
      {product.metadata?.badge && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-badge-new px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {product.metadata.badge as string}
        </span>
      )}

      <Link to={`/producto/${product.handle}`} className="block">
        <div className="aspect-square overflow-hidden rounded-md bg-muted mb-3">
          <img
            src={product.thumbnail || "/placeholder.svg"}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-col flex-1 gap-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          {product.collection?.title || "Suplemento"}
        </p>
        <Link to={`/producto/${product.handle}`}>
          <h3 className="font-body text-sm font-semibold text-foreground leading-tight line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-border"}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-foreground">{formattedPrice}</span>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            aria-label="Añadir al carrito"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductGridCard;
