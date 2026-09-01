const FORMATEADOR_FECHA_UTC = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatearFecha(valor?: string | Date | null): string {
  if (!valor) return "Sin fecha registrada";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Fecha inválida";
  }

  return FORMATEADOR_FECHA_UTC.format(fecha);
}
