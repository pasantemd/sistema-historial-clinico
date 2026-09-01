import type { CatalogoFicha, TrabajadorParaFicha } from "@/modulos/fichas-ocupacionales/tipos";
import type { EntradaFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";

function partir(texto: string): [string, string] {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  return [partes[0] ?? "", partes.slice(1).join(" ")];
}

function calcularEdad(fechaNacimiento: string): number | "" {
  if (!fechaNacimiento) return "";
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00-05:00`);
  const hoy = new Date();
  if (Number.isNaN(nacimiento.getTime())) return "";
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1;
  return edad;
}

function fechaCivilActual(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function crearValoresIniciales(
  trabajador: TrabajadorParaFicha,
  catalogo: CatalogoFicha,
  profesional?: {
    nombreCompleto: string;
    codigoProfesional: string;
  },
): EntradaFicha {
  const [primerNombre, segundoNombre] = partir(trabajador.nombres);
  const [primerApellido, segundoApellido] = partir(trabajador.apellidos);
  const empresa = catalogo.empresas.find((item) => item.id === trabajador.empresaId);

  return {
    trabajadorId: trabajador.id,
    registroDiarioId: "",
    empresaId: trabajador.empresaId,
    departamentoId: trabajador.departamentoId,
    tipoEvaluacion: "INGRESO",
    institucionSistema: "PRIVADO",
    ruc: empresa?.ruc ?? "",
    ciiu: empresa?.actividadEconomicaCodigo ?? "",
    establecimiento: empresa?.nombreComercial || empresa?.razonSocial || "",
    numeroHistoriaClinica: trabajador.numeroDocumento,
    primerApellido,
    segundoApellido,
    primerNombre,
    segundoNombre,
    atencionEmbarazada: false,
    atencionDiscapacidad: false,
    atencionCatastrofica: false,
    atencionLactancia: false,
    atencionAdultoMayor: false,
    sexo: trabajador.sexo as EntradaFicha["sexo"],
    fechaNacimiento: trabajador.fechaNacimiento,
    edad: calcularEdad(trabajador.fechaNacimiento),
    grupoSanguineo: "",
    lateralidad: "",
    puestoTrabajoCIUO: "",
    fechaAtencion: fechaCivilActual(),
    fechaIngresoTrabajo: "",
    fechaReintegro: "",
    fechaSalida: "",
    observacionMotivo: "",
    antecedentesClinicosQuirurgicos: "",
    antecedentesFamiliares: "",
    autorizaTransfusiones: "",
    tratamientoHormonal: "",
    tratamientoHormonalCual: "",
    fechaUltimaMenstruacion: "",
    gestas: "",
    partos: "",
    cesareas: "",
    abortos: "",
    planificacionFamiliarFemenina: "",
    metodoPlanificacionFemenina: "",
    examenesFemeninos: [],
    planificacionFamiliarMasculina: "",
    metodoPlanificacionMasculina: "",
    examenesMasculinos: [],
    consumoSustancias: [],
    actividadFisica: "",
    actividadFisicaCual: "",
    actividadFisicaTiempo: "",
    medicacionHabitual: "",
    medicacionHabitualCual: "",
    medicacionHabitualCantidad: "",
    observacionEstiloVida: "",
    noRefiereSintomatologia: false,
    descripcionProblemaActual: "",
    temperatura: "",
    presionArterial: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    saturacionOxigeno: "",
    peso: "",
    talla: "",
    imc: "",
    perimetroAbdominal: "",
    examenFisico: {},
    observacionesExamenFisico: "",
    actividadesRiesgo: [],
    factoresRiesgo: { fisico: [], seguridad: [], quimico: [], biologico: [], ergonomico: [], psicosocial: [] },
    medidasPreventivas: "",
    antecedentesLaborales: [],
    actividadesExtralaborales: [],
    resultadosExamenes: [],
    observacionesResultados: "",
    diagnosticos: [],
    aptitudMedica: null,
    observacionesAptitud: "",
    recomendaciones: [],
    retiroRealizaEvaluacion: "",
    retiroRelacionadoTrabajo: "",
    retiroObservacion: "",
    profesionalNombres: profesional?.nombreCompleto.trim() ?? "",
    profesionalCodigoMedico: profesional?.codigoProfesional.trim() ?? "",
    firmaTrabajadorAcepta: false,
    firmaTrabajadorFecha: "",
  };
}
