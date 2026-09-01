import { z } from "zod";

const textoOpcional = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo, `No puede superar ${maximo} caracteres.`)
    .transform((valor) => valor || undefined)
    .optional();

const uuidOpcional = z
  .string()
  .trim()
  .transform((valor) => valor || undefined)
  .pipe(z.uuid("Seleccione una opción válida.").optional())
  .optional();

const fechaOpcional = z
  .string()
  .trim()
  .transform((valor) => valor || undefined)
  .pipe(z.iso.date("Ingrese una fecha válida.").optional())
  .optional();

const identidadSchema = {
  nombres: z.string().trim().min(2, "Ingrese los nombres del trabajador.").max(100),
  apellidos: z.string().trim().min(2, "Ingrese los apellidos del trabajador.").max(100),
  tipoDocumento: z.enum(["CEDULA", "PASAPORTE", "RUC", "OTRO"], {
    error: "Seleccione un tipo de documento.",
  }),
  numeroDocumento: z
    .string()
    .trim()
    .min(5, "El número de documento debe tener al menos 5 caracteres.")
    .max(20)
    .regex(
      /^[A-Za-z0-9.-]+$/,
      "Use únicamente letras, números, puntos y guiones.",
    ),
  empresaId: z.uuid("Seleccione una empresa válida."),
  departamentoId: z.uuid("Seleccione un departamento válido."),
};

export const nuevoVinculoLaboralSchema = z.object({
  trabajadorId: z.uuid("El trabajador no es válido."),
  empresaId: z.uuid("Seleccione una empresa válida."),
  departamentoId: z.uuid("Seleccione un departamento válido."),
});

export const trabajadorSchema = z.object({
  vinculoId: uuidOpcional,
  ...identidadSchema,
  fechaNacimiento: fechaOpcional,
  sexo: z.enum(["MASCULINO", "FEMENINO", "OTRO", "NO_ESPECIFICADO"]),
  telefono: textoOpcional(30),
  correo: z
    .union([z.literal(""), z.email("Ingrese un correo válido.").max(150)])
    .transform((valor) => valor || undefined)
    .optional(),
  direccion: textoOpcional(250),
  puestoLaboral: z
    .string({ error: "Ingrese el puesto laboral del trabajador." })
    .trim()
    .min(2, "Ingrese el puesto laboral del trabajador.")
    .max(100, "El puesto laboral no puede superar 100 caracteres."),
  estadoLaboral: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO", "RETIRADO"]).optional(),
});

const tamanoPaginaSchema = z.coerce
  .number()
  .refine(
    (valor): valor is 10 | 25 | 50 => [10, 25, 50].includes(valor),
    "Seleccione 10, 25 o 50 registros.",
  )
  .catch(10);

export const filtrosTrabajadoresSchema = z.object({
  busqueda: z.string().trim().max(100).optional().catch(undefined),
  empresaId: z.uuid().optional().catch(undefined),
  estado: z.enum(["ACTIVO", "SUSPENDIDO", "FINALIZADO"]).optional().catch(undefined),
  departamentoId: z.uuid().optional().catch(undefined),
  pagina: z.coerce.number().int().positive().catch(1),
  tamanoPagina: tamanoPaginaSchema,
});

export type EntradaNuevoVinculoLaboral = z.input<
  typeof nuevoVinculoLaboralSchema
>;
export type DatosNuevoVinculoLaboral = z.output<typeof nuevoVinculoLaboralSchema>;
export type EntradaTrabajador = z.input<typeof trabajadorSchema>;
export type DatosTrabajador = z.output<typeof trabajadorSchema>;
