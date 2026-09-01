import { TooltipProvider } from "@/componentes/ui/tooltip";
import { ProveedorMenuLateral } from "@/componentes/menu-lateral/menu-lateral-desplegable";
import { BarraLateral } from "@/componentes/estructura/barra-lateral";
import { NavegacionMovil } from "@/componentes/navegacion/navegacion-movil";
import type { UsuarioSesion } from "@/modulos/autenticacion";

export function EstructuraAplicacion({
  children,
  usuario,
}: {
  children: React.ReactNode;
  usuario: UsuarioSesion;
}) {
  return (
    <ProveedorMenuLateral>
      <TooltipProvider delay={200}>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <BarraLateral usuario={usuario} />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="relative min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="app-chrome no-print mb-4 flex items-center justify-between gap-3">
                <NavegacionMovil usuario={usuario} />
              </div>
              <div
                data-slot="app-content"
                className="mx-auto min-w-0 w-full max-w-[1440px]"
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProveedorMenuLateral>
  );
}
