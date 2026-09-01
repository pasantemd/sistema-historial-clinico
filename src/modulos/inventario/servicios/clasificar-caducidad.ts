export type EstadoCaducidad = "VENCIDO" | "ROJO" | "AMARILLO" | "VERDE" | "SIN_FECHA";

function inicioDiaUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

function sumarMeses(fecha: Date, meses: number): Date {
  const mesObjetivo = fecha.getUTCMonth() + meses;
  const ultimoDiaMes = new Date(Date.UTC(fecha.getUTCFullYear(), mesObjetivo + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    fecha.getUTCFullYear(),
    mesObjetivo,
    Math.min(fecha.getUTCDate(), ultimoDiaMes),
  ));
}

export function clasificarCaducidad(
  fechaCaducidad: string | null,
  hoy = new Date(),
): EstadoCaducidad {
  if (!fechaCaducidad) return "SIN_FECHA";

  const caducidad = new Date(`${fechaCaducidad}T00:00:00.000Z`);
  const fechaActual = inicioDiaUtc(hoy);
  if (caducidad <= fechaActual) return "VENCIDO";
  if (caducidad <= sumarMeses(fechaActual, 3)) return "ROJO";
  if (caducidad <= sumarMeses(fechaActual, 6)) return "AMARILLO";
  return "VERDE";
}
