export const PARAMETRO_PAGINA = "page";
export const PARAMETRO_TAMANO_PAGINA = "pageSize";

interface CrearParametrosPaginacion {
  parametros: URLSearchParams | string;
  pagina?: number;
  tamanoPagina?: number;
  parametroPagina?: string;
  parametroTamanoPagina?: string;
}

export function crearParametrosPaginacion({
  parametros,
  pagina,
  tamanoPagina,
  parametroPagina = PARAMETRO_PAGINA,
  parametroTamanoPagina = PARAMETRO_TAMANO_PAGINA,
}: CrearParametrosPaginacion) {
  const consulta = new URLSearchParams(parametros);

  consulta.delete("pagina");
  consulta.delete("tamanoPagina");

  if (pagina && pagina > 1) {
    consulta.set(parametroPagina, String(pagina));
  } else {
    consulta.delete(parametroPagina);
  }

  if (tamanoPagina) {
    consulta.set(parametroTamanoPagina, String(tamanoPagina));
  }

  return consulta;
}

export function crearHrefPaginacion(rutaBase: string, parametros: URLSearchParams) {
  const consulta = parametros.toString();
  return consulta ? `${rutaBase}?${consulta}` : rutaBase || "?";
}

export function estadoPaginacion(pagina: number, totalPaginas: number) {
  return {
    anteriorDeshabilitado: pagina <= 1,
    siguienteDeshabilitado: pagina >= totalPaginas,
  };
}
