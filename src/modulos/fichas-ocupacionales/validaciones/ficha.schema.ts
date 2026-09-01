import { z } from "zod";

const textoOpcional = (maximo: number) =>
  z.string().trim().max(maximo, `No puede superar ${maximo} caracteres.`).transform((valor) => valor || undefined).optional();

const textoRequerido = (maximo: number, mensaje: string) =>
  z.string().trim().min(1, mensaje).max(maximo, `No puede superar ${maximo} caracteres.`);

const uuidRequerido = z.string().trim().pipe(z.uuid("Seleccione una opción válida."));

const vacioAIndefinido = (valor: unknown) =>
  valor === "" || valor === null || valor === undefined ? undefined : valor;

const fechaOpcional = z.preprocess(
  vacioAIndefinido,
  z.iso.date("Ingrese una fecha válida.").optional(),
);
const numeroRealOpcional = z.preprocess(
  vacioAIndefinido,
  z.coerce.number().optional(),
);

const numeroEnteroOpcional = z.preprocess(
  vacioAIndefinido,
  z.coerce.number().int("Ingrese un número entero.").optional(),
);
const edadOpcional = z.preprocess(
  vacioAIndefinido,
  z.coerce
    .number()
    .int("Ingrese una edad en años completos.")
    .min(0, "La edad no puede ser negativa.")
    .max(150, "Ingrese una edad válida.")
    .optional(),
);

const booleano = z.boolean().default(false);

const examenReproductivoSchema = z.object({
  examen: textoOpcional(120),
  tiempo: textoOpcional(40),
  resultado: textoOpcional(200),
});
const sustanciaConsumoSchema = z.object({
  sustancia: textoOpcional(80),
  tiempoConsumo: textoOpcional(40),
  exConsumidor: z.boolean().default(false),
  tiempoAbstinencia: textoOpcional(40),
  noConsume: z.boolean().default(false),
});
const factoresRiesgoSchema = z.object({
  fisico: z.array(z.string()).default([]),
  seguridad: z.array(z.string()).default([]),
  quimico: z.array(z.string()).default([]),
  biologico: z.array(z.string()).default([]),
  ergonomico: z.array(z.string()).default([]),
  psicosocial: z.array(z.string()).default([]),
});
const otrosFactoresRiesgoSchema = z.object({
  fisico: textoOpcional(200),
  seguridad: textoOpcional(200),
  quimico: textoOpcional(200),
  biologico: textoOpcional(200),
  ergonomico: textoOpcional(200),
  psicosocial: textoOpcional(200),
});
const actividadJornadaSchema = z.object({
  descripcion: textoOpcional(200),
  factores: factoresRiesgoSchema.default({
    fisico: [],
    seguridad: [],
    quimico: [],
    biologico: [],
    ergonomico: [],
    psicosocial: [],
  }),
  otros: otrosFactoresRiesgoSchema.default({}),
});
const antecedenteLaboralSchema = z.object({
  centroTrabajo: textoOpcional(120),
  actividades: textoOpcional(200),
  trabajoAnterior: z.boolean().default(false),
  trabajoActual: z.boolean().default(false),
  tiempo: textoOpcional(40),
  incidente: z.boolean().default(false),
  accidente: z.boolean().default(false),
  enfermedad: z.boolean().default(false),
  calificadoIess: z.enum(["SI", "NO"]).nullable().default(null),
  fecha: textoOpcional(40),
  especificar: textoOpcional(200),
  observaciones: textoOpcional(300),
});
const actividadExtralaboralSchema = z.object({
  tipo: textoOpcional(120),
  descripcion: textoOpcional(200),
  fecha: textoOpcional(40),
});
const resultadoExamenSchema = z.object({
  nombre: textoOpcional(120),
  fecha: textoOpcional(40),
  resultados: textoOpcional(300),
});
const diagnosticoSchema = z.object({
  enfermedadId: uuidRequerido,
  codigo: textoRequerido(10, "Seleccione un diagnóstico CIE-10."),
  descripcion: textoRequerido(1000, "Seleccione un diagnóstico CIE-10."),
  pre: z.boolean().default(false),
  def: z.boolean().default(false),
}).superRefine((diagnostico, ctx) => {
  if (diagnostico.pre === diagnostico.def) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["def"], message: "Seleccione PRE o DEF, exclusivamente." });
  }
});
const recomendacionSchema = z.object({ descripcion: textoOpcional(300) });
const regionExamenFisicoSchema = z.object({
  presente: z.boolean().default(false),
  descripcion: textoOpcional(300),
});

export const fichaCamposSchema = z.object({
  trabajadorId: uuidRequerido,
  registroDiarioId: z.string().uuid().optional().or(z.literal("")),
  empresaId: uuidRequerido,
  departamentoId: uuidRequerido,
  tipoEvaluacion: z.enum(["INGRESO", "PERIODICA", "REINGRESO", "RETIRO"]),

  institucionSistema: textoOpcional(40),
  ruc: textoOpcional(20),
  ciiu: textoOpcional(20),
  establecimiento: textoOpcional(160),
  numeroHistoriaClinica: textoOpcional(40),

  primerApellido: textoOpcional(100),
  segundoApellido: textoOpcional(100),
  primerNombre: textoOpcional(100),
  segundoNombre: textoOpcional(100),

  atencionEmbarazada: booleano,
  atencionDiscapacidad: booleano,
  atencionCatastrofica: booleano,
  atencionLactancia: booleano,
  atencionAdultoMayor: booleano,

  sexo: z.enum(["MASCULINO", "FEMENINO", "OTRO", "NO_ESPECIFICADO"]).default("NO_ESPECIFICADO"),
  fechaNacimiento: fechaOpcional,
  edad: edadOpcional,
  grupoSanguineo: textoOpcional(5),
  lateralidad: textoOpcional(20),

  puestoTrabajoCIUO: textoOpcional(120),
  fechaAtencion: fechaOpcional,
  fechaIngresoTrabajo: fechaOpcional,
  fechaReintegro: fechaOpcional,
  fechaSalida: fechaOpcional,
  observacionMotivo: textoOpcional(300),

  antecedentesClinicosQuirurgicos: textoOpcional(1000),
  antecedentesFamiliares: textoOpcional(1000),
  autorizaTransfusiones: textoOpcional(4),
  tratamientoHormonal: textoOpcional(4),
  tratamientoHormonalCual: textoOpcional(200),
  fechaUltimaMenstruacion: fechaOpcional,
  gestas: numeroEnteroOpcional,
  partos: numeroEnteroOpcional,
  cesareas: numeroEnteroOpcional,
  abortos: numeroEnteroOpcional,
  planificacionFamiliarFemenina: textoOpcional(14),
  metodoPlanificacionFemenina: textoOpcional(200),
  examenesFemeninos: z.array(examenReproductivoSchema).default([]),
  planificacionFamiliarMasculina: textoOpcional(14),
  metodoPlanificacionMasculina: textoOpcional(200),
  examenesMasculinos: z.array(examenReproductivoSchema).default([]),
  consumoSustancias: z.array(sustanciaConsumoSchema).default([]),
  actividadFisica: textoOpcional(4),
  actividadFisicaCual: textoOpcional(200),
  actividadFisicaTiempo: textoOpcional(40),
  medicacionHabitual: textoOpcional(4),
  medicacionHabitualCual: textoOpcional(200),
  medicacionHabitualCantidad: textoOpcional(40),
  observacionEstiloVida: textoOpcional(1000),

  noRefiereSintomatologia: booleano,
  descripcionProblemaActual: textoOpcional(1000),

  temperatura: numeroRealOpcional,
  presionArterial: textoOpcional(20),
  frecuenciaCardiaca: numeroEnteroOpcional,
  frecuenciaRespiratoria: numeroEnteroOpcional,
  saturacionOxigeno: numeroEnteroOpcional,
  peso: numeroRealOpcional,
  talla: numeroRealOpcional,
  imc: numeroRealOpcional,
  perimetroAbdominal: numeroRealOpcional,
  examenFisico: z.record(z.string(), regionExamenFisicoSchema).default({}),
  observacionesExamenFisico: textoOpcional(1000),

  actividadesRiesgo: z.array(actividadJornadaSchema).default([]),
  factoresRiesgo: factoresRiesgoSchema.default({ fisico: [], seguridad: [], quimico: [], biologico: [], ergonomico: [], psicosocial: [] }),
  medidasPreventivas: textoOpcional(1000),

  antecedentesLaborales: z.array(antecedenteLaboralSchema).default([]),
  actividadesExtralaborales: z.array(actividadExtralaboralSchema).default([]),

  resultadosExamenes: z.array(resultadoExamenSchema).default([]),
  observacionesResultados: textoOpcional(1000),

  diagnosticos: z.array(diagnosticoSchema).default([]),

  aptitudMedica: z.enum(["APTO", "APTO_EN_OBSERVACION", "APTO_CON_LIMITACIONES", "NO_APTO"]).nullable().default(null),
  observacionesAptitud: textoOpcional(1000),

  recomendaciones: z.array(recomendacionSchema).default([]),

  retiroRealizaEvaluacion: textoOpcional(4),
  retiroRelacionadoTrabajo: textoOpcional(4),
  retiroObservacion: textoOpcional(1000),

  profesionalNombres: textoOpcional(200),
  profesionalCodigoMedico: textoOpcional(40),

  firmaTrabajadorAcepta: booleano,
  firmaTrabajadorFecha: fechaOpcional,
});

export type EntradaFicha = z.input<typeof fichaCamposSchema>;
export type DatosFicha = z.output<typeof fichaCamposSchema>;

function validarCondicionalesFinalizacion(datos: DatosFicha, ctx: z.RefinementCtx) {
  const falla = (campo: string, mensaje: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message: mensaje });

  if (!datos.fechaAtencion) falla("fechaAtencion", "La fecha de atención es obligatoria.");
  if (!datos.primerNombre || !datos.primerNombre.trim()) falla("primerNombre", "El primer nombre es obligatorio.");
  if (!datos.primerApellido || !datos.primerApellido.trim()) falla("primerApellido", "El primer apellido es obligatorio.");
  if (!datos.fechaNacimiento) falla("fechaNacimiento", "La fecha de nacimiento es obligatoria.");
  if (!datos.aptitudMedica) falla("aptitudMedica", "Seleccione la aptitud médica.");
  if (!datos.profesionalNombres || !datos.profesionalNombres.trim()) falla("profesionalNombres", "El nombre del profesional es obligatorio.");
  if (!datos.profesionalCodigoMedico || !datos.profesionalCodigoMedico.trim()) falla("profesionalCodigoMedico", "El código médico es obligatorio.");
  if (!datos.firmaTrabajadorAcepta) falla("firmaTrabajadorAcepta", "El trabajador debe aceptar la ficha.");

  if (datos.tipoEvaluacion === "REINGRESO" && !datos.fechaReintegro) {
    falla("fechaReintegro", "El reingreso exige la fecha de reintegro.");
  }
  if (datos.tipoEvaluacion === "RETIRO") {
    if (!datos.fechaSalida) falla("fechaSalida", "El retiro exige la fecha de salida.");
    if (!datos.retiroRealizaEvaluacion) falla("retiroRealizaEvaluacion", "Indique si se realiza la evaluación de retiro.");
    if (!datos.retiroRelacionadoTrabajo) falla("retiroRelacionadoTrabajo", "Indique si la condición está relacionada con el trabajo.");
  }

  if (datos.tratamientoHormonal === "SI" && !datos.tratamientoHormonalCual?.trim()) {
    falla("tratamientoHormonalCual", "Describa el tratamiento hormonal.");
  }
  if (datos.planificacionFamiliarFemenina === "SI" && !datos.metodoPlanificacionFemenina?.trim()) {
    falla("metodoPlanificacionFemenina", "Describa el método de planificación familiar.");
  }
  if (datos.planificacionFamiliarMasculina === "SI" && !datos.metodoPlanificacionMasculina?.trim()) {
    falla("metodoPlanificacionMasculina", "Describa el método de planificación familiar.");
  }
  if (!datos.noRefiereSintomatologia && !datos.descripcionProblemaActual?.trim()) {
    falla("descripcionProblemaActual", "Describa el problema actual.");
  }

  datos.actividadesRiesgo.forEach((actividad, indice) => {
    if (!actividad.descripcion?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actividadesRiesgo", indice, "descripcion"],
        message: `Describa la actividad ${indice + 1}.`,
      });
    }
    const cantidadFactores = Object.values(actividad.factores).reduce(
      (total, factores) => total + factores.length,
      0,
    );
    if (cantidadFactores === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actividadesRiesgo", indice, "factores"],
        message: `Seleccione al menos un factor de riesgo para la actividad ${indice + 1}.`,
      });
    }
    const categorias = ["fisico", "seguridad", "quimico", "biologico", "ergonomico", "psicosocial"] as const;
    categorias.forEach((categoria) => {
      if (actividad.factores[categoria].includes("Otros") && !actividad.otros[categoria]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actividadesRiesgo", indice, "otros", categoria],
          message: `Especifique el factor “Otros” de ${categoria} para la actividad ${indice + 1}.`,
        });
      }
    });
  });

}

export const fichaBorradorSchema = fichaCamposSchema.superRefine((datos, ctx) => {
  if (!datos.trabajadorId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["trabajadorId"], message: "El trabajador es obligatorio." });
  if (!datos.empresaId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["empresaId"], message: "La empresa es obligatoria." });
  if (!datos.departamentoId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["departamentoId"], message: "El departamento es obligatorio." });
  if (!datos.tipoEvaluacion) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipoEvaluacion"], message: "El tipo de evaluación es obligatorio." });
});

export const fichaFinalizarSchema = fichaCamposSchema.superRefine(validarCondicionalesFinalizacion);

export const borradorFichaSchema = fichaBorradorSchema;
export const finalizacionFichaSchema = fichaFinalizarSchema;

export type DatosBorradorFicha = DatosFicha;
export type DatosFinalizacionFicha = DatosFicha;
