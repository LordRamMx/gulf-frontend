import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-foreground">VidaVerde</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu tienda de confianza en vitaminas y minerales de alta calidad.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Tienda</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Vitaminas</a></li>
              <li><a href="#" className="hover:text-foreground">Minerales</a></li>
              <li><a href="#" className="hover:text-foreground">Ofertas</a></li>
              <li><a href="#" className="hover:text-foreground">Novedades</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Información</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Contacto</a></li>
              <li><a href="#" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Política de Privacidad</a></li>
              <li><a href="#" className="hover:text-foreground">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-foreground">Envíos y Devoluciones</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 VidaVerde. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
