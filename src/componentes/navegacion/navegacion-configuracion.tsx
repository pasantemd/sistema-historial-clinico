import Link from "next/link";
import { Building2, Network, Shield, Users } from "lucide-react";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";

export function NavegacionConfiguracion({ usuario }: { usuario: UsuarioSesion }) {
  const enlaces = [
    { ruta: "/configuracion/empresas", etiqueta: "Empresas", icono: Building2, visible: tienePermiso(usuario, "empresa.ver") },
    { ruta: "/configuracion/departamentos", etiqueta: "Departamentos", icono: Network, visible: tienePermiso(usuario, "departamento.ver") },
    { ruta: "/configuracion/usuarios", etiqueta: "Usuarios", icono: Users, visible: tienePermiso(usuario, "usuario.administrar") },
    { ruta: "/configuracion/roles", etiqueta: "Roles y permisos", icono: Shield, visible: tienePermiso(usuario, "usuario.administrar") },
  ].filter((enlace) => enlace.visible);
  return <nav aria-label="Secciones de configuración" className="flex gap-2 overflow-x-auto rounded-xl border bg-card p-2 shadow-xs">{enlaces.map(({ ruta, etiqueta, icono: Icono }) => <Link key={ruta} href={ruta} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icono className="size-4" aria-hidden />{etiqueta}</Link>)}</nav>;
}