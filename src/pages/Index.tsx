import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesBar from "@/components/FeaturesBar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { MOCK_PRODUCTS, type Product } from "@/lib/medusa-client";

import prodVitaminaC from "@/assets/prod-vitamina-c.jpg";
import prodMagnesio from "@/assets/prod-magnesio.jpg";
import prodOmega3 from "@/assets/prod-omega3.jpg";
import prodZinc from "@/assets/prod-zinc.jpg";
import prodVitaminaD from "@/assets/prod-vitamina-d.jpg";
import prodHierro from "@/assets/prod-hierro.jpg";

// Map mock product thumbnails to generated images
const PRODUCT_IMAGES: Record<string, string> = {
  prod_1: prodVitaminaC,
  prod_2: prodMagnesio,
  prod_3: prodOmega3,
  prod_4: prodZinc,
  prod_5: prodVitaminaD,
  prod_6: prodHierro,
};

const products = MOCK_PRODUCTS.map((p) => ({
  ...p,
  thumbnail: PRODUCT_IMAGES[p.id] || p.thumbnail,
}));

const Index = () => {
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success(`${product.title} añadido al carrito`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={cartCount} />
      <HeroSection />
      <FeaturesBar />

      {/* Products section */}
      <section id="productos" className="container mx-auto px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Nuestros Productos
          </h2>
          <p className="mt-3 text-muted-foreground">
            Selección premium de suplementos para tu bienestar
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="hero-gradient">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            ¿Necesitas asesoría personalizada?
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
            Nuestro equipo de expertos en nutrición puede ayudarte a encontrar los suplementos ideales para tus necesidades.
          </p>
          <button className="mt-6 rounded-lg warm-gradient px-8 py-3 font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90">
            Contactar Experto
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
