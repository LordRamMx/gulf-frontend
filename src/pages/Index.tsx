import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Zap, Tag } from "lucide-react";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import FeaturesBar from "@/components/FeaturesBar";
import ProductGridCard from "@/components/ProductGridCard";
import Footer from "@/components/Footer";
import { useFeaturedProducts, useMedusaCategories, useMedusaCollections } from "@/hooks/useMedusaStore";
import heroImage from "@/assets/hero-vitamins.jpg";

import prodVitaminaC from "@/assets/prod-vitamina-c.jpg";
import prodMagnesio from "@/assets/prod-magnesio.jpg";
import prodOmega3 from "@/assets/prod-omega3.jpg";
import prodZinc from "@/assets/prod-zinc.jpg";
import prodVitaminaD from "@/assets/prod-vitamina-d.jpg";
import prodHierro from "@/assets/prod-hierro.jpg";

const PRODUCT_IMAGES: Record<string, string> = {
  // Prefer matching by handle when you move to real Medusa data.
  "vitamina-c": prodVitaminaC,
  "magnesio": prodMagnesio,
  "omega-3": prodOmega3,
  "zinc": prodZinc,
  "vitamina-d": prodVitaminaD,
  "hierro": prodHierro,
  // Keep old mock ids for backwards compatibility
  prod_1: prodVitaminaC,
  prod_2: prodMagnesio,
  prod_3: prodOmega3,
  prod_4: prodZinc,
  prod_5: prodVitaminaD,
  prod_6: prodHierro,
};

const CATEGORY_ICONS = ["💊", "🪨", "🐟", "🦠", "💪", "🌿", "🏋️", "✨"];

const Index = () => {
  const { data: categories } = useMedusaCategories();
  const { data: collections } = useMedusaCollections();
  const { data: featuredProductsRaw } = useFeaturedProducts(8);

  const featuredProducts = featuredProductsRaw.map((p) => ({
    ...p,
    thumbnail: PRODUCT_IMAGES[p.handle] || PRODUCT_IMAGES[p.id] || p.thumbnail,
  }));

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Vitaminas" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-transparent" />
        </div>
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg space-y-4"
          >
            <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
              🌿 Más de 50.000 productos
            </span>
            <h1 className="font-display text-3xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Tu marketplace de salud y bienestar
            </h1>
            <p className="text-primary-foreground/80 leading-relaxed">
              Vitaminas, minerales y suplementos de las mejores marcas del mundo. Envío rápido a toda España.
            </p>
            <div className="flex gap-3 pt-1">
              <Link
                to="/productos"
                className="hero-gradient inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition"
              >
                Explorar Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <FeaturesBar />

      {/* Category grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Categorías</h2>
          <Link to="/productos" className="text-sm text-primary hover:underline">Ver todas →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/productos?categoria=${cat.handle}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:card-shadow-hover"
            >
              <span className="text-2xl">{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {cat.category_children?.length || 0} sub
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo banners */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl hero-gradient p-5">
            <Sparkles className="h-8 w-8 text-primary-foreground shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold text-primary-foreground">Novedades</h3>
              <p className="text-xs text-primary-foreground/80">Últimos lanzamientos cada semana</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl warm-gradient p-5">
            <Tag className="h-8 w-8 text-primary-foreground shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold text-primary-foreground">Ofertas Flash</h3>
              <p className="text-xs text-primary-foreground/80">Hasta 40% de descuento</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-card border border-border p-5">
            <TrendingUp className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Más Vendidos</h3>
              <p className="text-xs text-muted-foreground">Los favoritos de nuestros clientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Productos Destacados</h2>
          <Link to="/productos" className="text-sm text-primary hover:underline">Ver más →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <ProductGridCard product={product} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Collections row */}
      <section className="bg-card border-y border-border">
        <div className="container mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Compra por Colección</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collections.slice(0, 4).map((col) => (
              <Link
                key={col.id}
                to={`/productos?coleccion=${col.id}`}
                className="group relative overflow-hidden rounded-xl hero-gradient p-6 transition-all hover:shadow-xl"
              >
                <h3 className="font-display text-xl font-bold text-primary-foreground">{col.title}</h3>
                <p className="mt-1 text-xs text-primary-foreground/70">Ver productos →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container mx-auto px-4 py-12">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-2xl mx-auto">
          <Zap className="h-8 w-8 text-accent mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Recibe ofertas exclusivas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Suscríbete y obtén un 10% en tu primer pedido
          </p>
          <form className="mt-4 flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
