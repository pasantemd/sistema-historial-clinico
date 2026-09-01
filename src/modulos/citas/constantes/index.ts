export const ESTADOS_CITA = [
  "PROGRAMADA",
  "CONFIRMADA",
  "ATENDIDA",
  "CANCELADA",
  "NO_ASISTIO",
] as const;

export type EstadoCita = (typeof ESTADOS_CITA)[number];

export const ETIQUETAS_ESTADO_CITA: Record<EstadoCita, string> = {
  PROGRAMADA: "Programada",
  CONFIRMADA: "Confirmada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
};

export const DURACIONES_SUGERIDAS = [
  { valor: 15, etiqueta: "15 minutos" },
  { valor: 30, etiqueta: "30 minutos" },
  { valor: 45, etiqueta: "45 minutos" },
  { valor: 60, etiqueta: "1 hora" },
  { valor: 90, etiqueta: "1 hora 30 minutos" },
] as const;

export const HORAS_DISPONIBLES = Array.from({ length: 24 * 2 }, (_, i) => {
  const hora = Math.floor(i / 2);
  const minuto = i % 2 === 0 ? "00" : "30";
  return `${String(hora).padStart(2, "0")}:${minuto}`;
});
