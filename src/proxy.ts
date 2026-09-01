import { NextResponse } from "next/server";

const CACHE_PRIVADA = "private, no-store, max-age=0, must-revalidate";

export function proxy() {
  const respuesta = NextResponse.next();
  respuesta.headers.set("Cache-Control", CACHE_PRIVADA);
  respuesta.headers.set("Pragma", "no-cache");
  respuesta.headers.set("Expires", "0");
  return respuesta;
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/trabajadores/:path*",
    "/citas/:path*",
    "/registro-diario/:path*",
    "/evaluaciones-medicas/:path*",
    "/fichas-ocupacionales/:path*",
    "/recetas/:path*",
    "/inventario/:path*",
    "/reportes/:path*",
    "/auditoria/:path*",
    "/configuracion/:path*",
    "/consultas/:path*",
    "/documentos-clinicos/:path*",
    "/atenciones/:path*",
    "/vinculos-laborales/:path*",
    "/mi-perfil/:path*",
  ],
};
