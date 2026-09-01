export const GRAFICOS_REPORTE = [
  { id: "registros-diarios-dia", titulo: "Registros diarios por día" },
  { id: "registros-empresa", titulo: "Registros por empresa" },
  { id: "actividad-departamento", titulo: "Actividad por departamento" },
  { id: "fichas-tipo", titulo: "Fichas por tipo" },
  { id: "estado-citas", titulo: "Estado de citas" },
  { id: "estado-recetas", titulo: "Estado de recetas" },
  { id: "fichas-dia", titulo: "Fichas ocupacionales por día" },
  { id: "evaluaciones-dia", titulo: "Evaluaciones médicas por día" },
  { id: "diagnosticos-cie10", titulo: "Diagnósticos CIE-10 más frecuentes" },
  { id: "morbilidades", titulo: "Tipos de morbilidades" },
  { id: "medicamentos-entregados", titulo: "Medicamentos entregados" },
] as const;

export const IDS_GRAFICOS_REPORTE = GRAFICOS_REPORTE.map(
  (grafico) => grafico.id,
) as [
  (typeof GRAFICOS_REPORTE)[number]["id"],
  ...(typeof GRAFICOS_REPORTE)[number]["id"][],
];

export type IdGraficoReporte = (typeof GRAFICOS_REPORTE)[number]["id"];

export function obtenerTituloGraficoReporte(id: IdGraficoReporte): string {
  return GRAFICOS_REPORTE.find((grafico) => grafico.id === id)?.titulo ?? id;
}
