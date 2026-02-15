import { Product } from "@/lib/medusa-client";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const price = product.variants?.[0]?.prices?.[0];
  const formattedPrice = price
    ? new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: price.currency_code?.toUpperCase() || "EUR",
      }).format(price.amount / 100)
    : "—";

  return (
    <div className="group relative rounded-lg bg-card p-4 card-shadow transition-all duration-300 hover:card-shadow-hover hover:-translate-y-1">
      {product.metadata?.badge && (
        <span className="absolute top-3 left-3 z-10 rounded-full bg-badge-new px-3 py-1 text-xs font-semibold text-primary-foreground">
          {product.metadata.badge as string}
        </span>
      )}

      <div className="aspect-square overflow-hidden rounded-md bg-muted mb-4">
        <img
          src={product.thumbnail || "/placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {product.collection?.title || "Suplemento"}
        </p>
        <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-primary">{formattedPrice}</span>
          <button
            onClick={() => onAddToCart?.(product)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
