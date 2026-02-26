import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Leaf, Search, ChevronDown, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMedusaCart } from "@/contexts/MedusaCartContext";
import { useMedusaCategories } from "@/hooks/useMedusaStore";

const MarketplaceHeader = () => {
  const { count } = useMedusaCart();
  const { data: categories } = useMedusaCategories();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top bar */}
      <div className="bg-primary">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-xs text-primary-foreground">
          <span>Envío gratis en pedidos +39€ | +50.000 productos</span>
          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="hover:underline">Ayuda</a>
            <a href="#" className="hover:underline">Rastrear Pedido</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        {/* Mobile menu */}
        <button className="lg:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">VidaVerde</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
          <div className="flex w-full rounded-lg border border-border bg-muted/50 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vitaminas, minerales, suplementos..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              className="px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">Mi Cuenta</span>
          </button>
          <Link
            to="/carrito"
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
            <span className="hidden lg:inline">Carrito</span>
          </Link>
        </div>
      </div>

      {/* Categories nav */}
      <div className="hidden lg:block border-t border-border bg-card">
        <div className="container mx-auto flex items-center gap-1 px-4" ref={catRef}>
          {/* All categories dropdown */}
          <div className="relative">
            <button
              onClick={() => setCatOpen(!catOpen)}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="h-4 w-4" />
              Categorías
              <ChevronDown className={`h-3 w-3 transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {catOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 z-50 mt-1 w-[600px] rounded-lg border border-border bg-popover p-4 shadow-xl"
                >
                  <div className="grid grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          to={`/productos?categoria=${cat.handle}`}
                          className="text-sm font-semibold text-foreground hover:text-primary"
                          onClick={() => setCatOpen(false)}
                        >
                          {cat.name}
                        </Link>
                        {cat.category_children && (
                          <ul className="mt-1 space-y-0.5">
                            {cat.category_children.slice(0, 4).map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  to={`/productos?categoria=${sub.handle}`}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => setCatOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick links */}
          {["Vitaminas", "Minerales", "Probióticos", "Proteínas", "Deportes", "Ofertas"].map((label) => (
            <Link
              key={label}
              to={`/productos?categoria=${label.toLowerCase()}`}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          ))}

          <Link
            to="/productos"
            className="ml-auto rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Ver Todo →
          </Link>
        </div>
      </div>

      {/* Mobile search + nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <form onSubmit={handleSearch} className="flex rounded-lg border border-border overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                />
                <button type="submit" className="px-3 bg-primary text-primary-foreground">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/productos?categoria=${cat.handle}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MarketplaceHeader;
