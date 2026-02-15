import { Leaf, Truck, ShieldCheck, Recycle } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Ingredientes puros sin aditivos artificiales",
  },
  {
    icon: ShieldCheck,
    title: "Calidad Certificada",
    description: "Probados en laboratorio y certificados GMP",
  },
  {
    icon: Truck,
    title: "Envío Gratis",
    description: "En pedidos superiores a 39€ en toda España",
  },
  {
    icon: Recycle,
    title: "Eco-Friendly",
    description: "Envases reciclables y producción sostenible",
  },
];

const FeaturesBar = () => {
  return (
    <section className="border-b border-border bg-card">
      <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesBar;
