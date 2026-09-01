const RUTA_PREDETERMINADA = "/inicio";

export function obtenerRutaRetornoSegura(valor?: string | null): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) {
    return RUTA_PREDETERMINADA;
  }

  if (valor.includes("\\") || /[\u0000-\u001F\u007F]/.test(valor)) {
    return RUTA_PREDETERMINADA;
  }

  try {
    const url = new URL(valor, "https://aplicacion.local");
    if (url.origin !== "https://aplicacion.local") return RUTA_PREDETERMINADA;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return RUTA_PREDETERMINADA;
  }
}
