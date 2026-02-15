import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-vitamins.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Vitaminas y minerales naturales"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl space-y-6"
        >
          <span className="inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
            🌿 Suplementos Naturales
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-6xl">
            Tu salud, nuestra prioridad
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Descubre nuestra selección de vitaminas y minerales de la más alta calidad. 
            Fórmulas respaldadas por la ciencia para tu bienestar diario.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button size="lg" variant="hero">
              Ver Productos
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm bg-primary-foreground/10"
            >
              Saber Más
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
