import { z } from "zod";

const horaSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "La hora de inicio no es válida.")
  .refine((valor) => {
    const [hora, minuto] = valor.split(":").map(Number);
    return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
  }, "La hora de inicio no es válida.");

const duracionSchema = z
  .number()
  .int("La duración debe ser un número entero.")
  .min(5, "La duración mínima es 5 minutos.")
  .max(480, "La duración máxima es 8 horas.");

function validarFinMismoDia(
  datos: { horaInicio: string; duracionMinutos: number },
  contexto: z.RefinementCtx,
) {
  const [hora, minuto] = datos.horaInicio.split(":").map(Number);
  if (Number.isFinite(hora) && Number.isFinite(minuto)) {
    const total = hora * 60 + minuto + datos.duracionMinutos;
    if (total >= 24 * 60) {
      contexto.addIssue({
        code: "custom",
        message: "La cita debe terminar antes de la medianoche.",
        path: ["duracionMinutos"],
      });
    }
  }
}

const camposCitaSchema = z.object({
  trabajadorId: z.string().uuid("Seleccione un trabajador válido."),
  profesionalId: z.string().uuid().optional().or(z.literal("")),
  fecha: z
    .string()
    .min(1, "La fecha es obligatoria.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no tiene un formato válido."),
  horaInicio: horaSchema,
  duracionMinutos: duracionSchema,
  motivo: z.string().trim().min(3, "Describa el motivo de la cita.").max(500),
  observaciones: z.string().trim().max(1000).optional().or(z.literal("")),
  recordatorio: z.boolean(),
});

export const crearCitaSchema = camposCitaSchema.superRefine(validarFinMismoDia);

export const verificarConflictoCitaSchema = z
  .object({
    profesionalId: z.string().uuid().optional().or(z.literal("")),
    trabajadorId: z.string().uuid(),
    fecha: z.iso.date(),
    horaInicio: horaSchema,
    duracionMinutos: duracionSchema,
    ignorarId: z.string().uuid().optional(),
  })
  .superRefine(validarFinMismoDia);

export type CrearCitaSchema = z.infer<typeof crearCitaSchema>;

export const editarCitaSchema = crearCitaSchema;

export function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [h, m] = horaInicio.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error("La hora de inicio no es válida.");
  }

  const total = h * 60 + m + duracionMinutos;
  if (!Number.isInteger(duracionMinutos) || duracionMinutos < 5 || total >= 24 * 60) {
    throw new Error("La cita debe terminar antes de la medianoche.");
  }

  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
