import type { CitaMedicaDto } from "@/modulos/citas/tipos";

export interface CitasClasificadas {
  proximas: CitaMedicaDto[];
  historial: CitaMedicaDto[];
}

export function clasificarCitas(
  citas: CitaMedicaDto[],
  hoy?: string,
): CitasClasificadas {
  const referencia = hoy ?? new Date().toISOString().slice(0, 10);

  const proximas = citas.filter(
    (c) =>
      c.fecha >= referencia &&
      (c.estado === "PROGRAMADA" || c.estado === "CONFIRMADA"),
  );

  const historial = citas.filter(
    (c) =>
      c.fecha < referencia ||
      (c.estado !== "PROGRAMADA" && c.estado !== "CONFIRMADA"),
  );

  return { proximas, historial };
}
