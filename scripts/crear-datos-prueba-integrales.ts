import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { registrarSalidaInventarioTx } from "../src/modulos/inventario/repositorios/inventario.repositorio";
import { obtenerNumeroCorrelativo } from "../src/servicios/base-datos/numero-correlativo";
import { validarEntornoDatos } from "./validar-entorno-datos";

validarEntornoDatos({
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  exigirBaseLocal: true,
});

type Tx = Prisma.TransactionClient;
type TipoFicha = "INGRESO" | "PERIODICA" | "REINGRESO" | "RETIRO";

interface DatoTrabajadorPrueba {
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: "MASCULINO" | "FEMENINO";
  empresa: string;
  departamento: string;
  area: string;
  puesto: string;
  fechaAtencion: string;
  tiposFicha: [TipoFicha, TipoFicha];
  morbilidad: string;
  diagnosticoCodigo: string;
  medicamentoInventario: string;
  medicamentoPresentacion: string;
  cantidadEntregada: number;
  dosis: string;
  via: string;
}

const DATOS: DatoTrabajadorPrueba[] = [
  {
    numeroDocumento: "PRUEBA-OCU-001",
    nombres: "ANA LUCÍA",
    apellidos: "PRUEBA OCUPACIONAL",
    fechaNacimiento: "1992-03-14",
    sexo: "FEMENINO",
    empresa: "APRACOM",
    departamento: "GERENCIA DE PRODUCCIÓN",
    area: "Producción",
    puesto: "Operadora de producción",
    fechaAtencion: "2026-08-11",
    tiposFicha: ["INGRESO", "PERIODICA"],
    morbilidad: "Síndrome gripal de prueba",
    diagnosticoCodigo: "J11",
    medicamentoInventario: "Paracetamol",
    medicamentoPresentacion: "500 mg tableta",
    cantidadEntregada: 2,
    dosis: "500 mg",
    via: "Oral",
  },
  {
    numeroDocumento: "PRUEBA-OCU-002",
    nombres: "CARLOS ANDRÉS",
    apellidos: "DEMO CLÍNICO",
    fechaNacimiento: "1988-07-22",
    sexo: "MASCULINO",
    empresa: "APRACOM",
    departamento: "DEPARTAMENTO DE IT",
    area: "Tecnología",
    puesto: "Analista de sistemas",
    fechaAtencion: "2026-08-12",
    tiposFicha: ["INGRESO", "REINGRESO"],
    morbilidad: "Cefalea de prueba",
    diagnosticoCodigo: "R51",
    medicamentoInventario: "Ibuprofeno",
    medicamentoPresentacion: "400 mg tableta",
    cantidadEntregada: 2,
    dosis: "400 mg",
    via: "Oral",
  },
  {
    numeroDocumento: "PRUEBA-OCU-003",
    nombres: "ELENA SOFÍA",
    apellidos: "ENSAYO LABORAL",
    fechaNacimiento: "1995-11-08",
    sexo: "FEMENINO",
    empresa: "TRADETEC",
    departamento: "DEPARTAMENTO DE CALIDAD",
    area: "Calidad",
    puesto: "Inspectora de calidad",
    fechaAtencion: "2026-08-13",
    tiposFicha: ["INGRESO", "PERIODICA"],
    morbilidad: "Mareo de prueba",
    diagnosticoCodigo: "R42",
    medicamentoInventario: "Vitamina c",
    medicamentoPresentacion: "1 g sobre",
    cantidadEntregada: 1,
    dosis: "1 sobre",
    via: "Oral",
  },
  {
    numeroDocumento: "PRUEBA-OCU-004",
    nombres: "MIGUEL ÁNGEL",
    apellidos: "PRUEBA SISTEMA",
    fechaNacimiento: "1985-01-30",
    sexo: "MASCULINO",
    empresa: "KUARELA",
    departamento: "GERENCIA DE COMPRAS",
    area: "Compras",
    puesto: "Asistente de compras",
    fechaAtencion: "2026-08-14",
    tiposFicha: ["REINGRESO", "PERIODICA"],
    morbilidad: "Cefalea de prueba",
    diagnosticoCodigo: "R51",
    medicamentoInventario: "Paracetamol",
    medicamentoPresentacion: "500 mg tableta",
    cantidadEntregada: 2,
    dosis: "500 mg",
    via: "Oral",
  },
  {
    numeroDocumento: "PRUEBA-OCU-005",
    nombres: "ROSA MARÍA",
    apellidos: "DEMO SEGURIDAD",
    fechaNacimiento: "1990-09-17",
    sexo: "FEMENINO",
    empresa: "SEGURITYSTARK",
    departamento: "SEGURIDAD",
    area: "Operaciones de seguridad",
    puesto: "Guardia de seguridad",
    fechaAtencion: "2026-08-15",
    tiposFicha: ["INGRESO", "PERIODICA"],
    morbilidad: "Mareo de prueba",
    diagnosticoCodigo: "R42",
    medicamentoInventario: "Ibuprofeno",
    medicamentoPresentacion: "400 mg tableta",
    cantidadEntregada: 1,
    dosis: "400 mg",
    via: "Oral",
  },
];

const fechaCivil = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

function calcularEdad(nacimiento: Date, referencia: Date) {
  let edad = referencia.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mes = referencia.getUTCMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && referencia.getUTCDate() < nacimiento.getUTCDate())) edad -= 1;
  return edad;
}

function dividirNombre(valor: string): [string, string | null] {
  const [primero, ...resto] = valor.trim().split(/\s+/);
  return [primero, resto.join(" ") || null];
}

async function siguienteNumeroReceta(tx: Tx) {
  const filas = await tx.$queryRaw<Array<{ valor: bigint }>>`SELECT nextval('receta_numero_seq')::bigint AS valor`;
  if (filas[0]?.valor === undefined) throw new Error("No fue posible generar el número de receta.");
  return `REC-${String(filas[0].valor).padStart(3, "0")}`;
}

async function comprobarExistentes(prisma: PrismaClient) {
  return prisma.trabajador.findMany({
    where: { numeroDocumento: { in: DATOS.map((dato) => dato.numeroDocumento) } },
    select: {
      id: true,
      numeroDocumento: true,
      nombres: true,
      apellidos: true,
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      _count: {
        select: {
          asignacionesLaborales: true,
          fichaOcupacionals: true,
          evaluacionesMedicas: true,
          recetas: true,
          registrosDiarios: true,
          documentosClinicos: true,
        },
      },
    },
    orderBy: { numeroDocumento: "asc" },
  });
}

async function crearTrabajadorCompleto(tx: Tx, dato: DatoTrabajadorPrueba, medico: {
  id: string;
  nombres: string;
  apellidos: string;
  codigoProfesional: string | null;
  especialidad: string | null;
}) {
  const empresa = await tx.empresa.findFirst({
    where: { razonSocial: dato.empresa, estado: "ACTIVO" },
    select: {
      id: true,
      ruc: true,
      razonSocial: true,
      nombreComercial: true,
      actividadEconomicaCodigo: true,
      direccion: true,
      telefono: true,
    },
  });
  if (!empresa) throw new Error(`No existe la empresa activa ${dato.empresa}.`);

  const departamento = await tx.departamento.findFirst({
    where: { empresaId: empresa.id, nombre: dato.departamento, estado: "ACTIVO" },
    select: { id: true, nombre: true },
  });
  if (!departamento) throw new Error(`No existe ${dato.departamento} en ${dato.empresa}.`);

  const inventario = await tx.medicamentoInventario.findFirst({
    where: { nombre: dato.medicamentoInventario, estado: "ACTIVO" },
    select: { id: true, nombre: true, unidad: true, cantidadDisponible: true },
  });
  if (!inventario || Number(inventario.cantidadDisponible) < dato.cantidadEntregada) {
    throw new Error(`Stock insuficiente de ${dato.medicamentoInventario}.`);
  }

  const diagnostico = await tx.enfermedadCie10.findFirst({
    where: { codigo: dato.diagnosticoCodigo, activa: true },
    select: { id: true, codigo: true, descripcion: true },
  });
  if (!diagnostico) throw new Error(`El código CIE-10 ${dato.diagnosticoCodigo} no está disponible.`);

  const medicamentoCatalogoExistente = await tx.medicamento.findFirst({
    where: {
      nombreGenerico: { equals: inventario.nombre, mode: "insensitive" },
      presentacion: { equals: dato.medicamentoPresentacion, mode: "insensitive" },
    },
    select: { id: true, nombreGenerico: true, nombreComercial: true, presentacion: true },
  });
  const medicamentoCatalogo = medicamentoCatalogoExistente ?? await tx.medicamento.create({
    data: {
      nombreGenerico: inventario.nombre,
      presentacion: dato.medicamentoPresentacion,
    },
    select: { id: true, nombreGenerico: true, nombreComercial: true, presentacion: true },
  });

  const nacimiento = fechaCivil(dato.fechaNacimiento);
  const fechaAtencion = fechaCivil(dato.fechaAtencion);
  const nombreCompleto = `${dato.apellidos} ${dato.nombres}`;
  const nombreProfesional = `${medico.nombres} ${medico.apellidos}`;
  const [primerNombre, segundoNombre] = dividirNombre(dato.nombres);
  const [primerApellido, segundoApellido] = dividirNombre(dato.apellidos);

  const trabajador = await tx.trabajador.create({
    data: {
      empresaId: empresa.id,
      departamentoId: departamento.id,
      tipoDocumento: "OTRO",
      numeroDocumento: dato.numeroDocumento,
      nombres: dato.nombres,
      apellidos: dato.apellidos,
      fechaNacimiento: nacimiento,
      sexo: dato.sexo,
      puestoLaboral: dato.puesto,
      areaTrabajo: dato.area,
      estadoLaboral: "ACTIVO",
      creadoPorId: medico.id,
      actualizadoPorId: medico.id,
    },
    select: { id: true },
  });

  const asignacion = await tx.asignacionLaboral.create({
    data: {
      trabajadorId: trabajador.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      fechaReingreso: dato.tiposFicha.includes("REINGRESO") ? fechaCivil("2026-08-01") : null,
      activa: true,
      estado: "ACTIVO",
    },
    select: { id: true },
  });

  const atencion = await tx.atencionMedica.create({
    data: {
      trabajadorId: trabajador.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      asignacionLaboralId: asignacion.id,
      fechaAtencion,
      motivoGeneral: dato.morbilidad,
      profesionalResponsableId: medico.id,
      profesionalNombreHistorico: nombreProfesional,
      profesionalCodigoHistorico: medico.codigoProfesional,
      estado: "FINALIZADA",
      empresaNombreHistorico: empresa.razonSocial,
      empresaRucHistorico: empresa.ruc,
      departamentoNombreHistorico: departamento.nombre,
      trabajadorNombreHistorico: nombreCompleto,
      trabajadorDocumentoHistorico: dato.numeroDocumento,
      creadoPorId: medico.id,
      finalizadaEn: fechaAtencion,
    },
    select: { id: true },
  });

  const numeroRegistro = await obtenerNumeroCorrelativo(tx, "registro-diario");
  const registro = await tx.registroDiarioAtencion.create({
    data: {
      numeroRegistro,
      trabajadorId: trabajador.id,
      atencionMedicaId: atencion.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      profesionalId: medico.id,
      apellidosNombres: nombreCompleto,
      cedula: dato.numeroDocumento,
      fechaNacimiento: nacimiento,
      diaAtencion: fechaAtencion,
      atencionMorbilidad: dato.morbilidad,
      medicacion: `${inventario.nombre} (${dato.cantidadEntregada} ${inventario.unidad})`,
      procedimiento: "Atención ocupacional de prueba",
      firmaConfirmada: false,
      observaciones: "Registro generado para pruebas funcionales.",
      empresaNombreHistorico: empresa.razonSocial,
      empresaRucHistorico: empresa.ruc,
      departamentoNombreHistorico: departamento.nombre,
      profesionalNombreHistorico: nombreProfesional,
      estado: "REGISTRADO",
      creadoPorId: medico.id,
    },
    select: { id: true },
  });

  const salida = await registrarSalidaInventarioTx(
    tx,
    inventario.id,
    dato.cantidadEntregada,
    `Salida por registro diario ${numeroRegistro}`,
    registro.id,
    medico.id,
  );
  await tx.registroDiarioMedicamento.create({
    data: {
      registroDiarioId: registro.id,
      medicamentoInventarioId: inventario.id,
      nombreSnapshot: salida.nombre,
      unidadSnapshot: salida.unidad,
      cantidadEntregada: dato.cantidadEntregada,
      movimientoInventarioId: salida.movimientoId,
    },
  });

  const numeroEvaluacion = await obtenerNumeroCorrelativo(tx, "evaluacion-medica");
  const evaluacion = await tx.evaluacionMedica.create({
    data: {
      numeroEvaluacion,
      trabajadorId: trabajador.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      asignacionLaboralId: asignacion.id,
      atencionMedicaId: atencion.id,
      registroDiarioId: registro.id,
      usuarioId: medico.id,
      estado: "FINALIZADA",
      fechaAtencion,
      profesionalNombreHistorico: nombreProfesional,
      empresaNombreHistorico: empresa.razonSocial,
      empresaRucHistorico: empresa.ruc,
      departamentoNombreHistorico: departamento.nombre,
      trabajadorNombreHistorico: nombreCompleto,
      trabajadorDocumentoHistorico: dato.numeroDocumento,
      trabajadorSexoHistorico: dato.sexo,
      trabajadorNacimientoHistorico: nacimiento,
      motivoConsulta: dato.morbilidad,
      morbilidad: dato.morbilidad,
      sintomas: "Síntomas registrados como datos de prueba.",
      tiempoEvolucion: "Dato de prueba",
      temperatura: 36.7,
      presionArterial: "120/80",
      frecuenciaCardiaca: 72,
      frecuenciaRespiratoria: 18,
      saturacionOxigeno: 98,
      peso: 70,
      talla: 1.7,
      examenFisico: "Evaluación física registrada para prueba funcional.",
      observacionesClinicas: "Contenido clínico ficticio para validar el flujo.",
      indicaciones: `Usar ${inventario.nombre} según la prescripción de prueba.`,
      recomendaciones: "Control ocupacional según programación de prueba.",
      creadoPorId: medico.id,
      actualizadoPorId: medico.id,
      finalizadoEn: new Date(),
      diagnosticos: {
        create: { enfermedadId: diagnostico.id, def: true },
      },
      medicamentos: {
        create: {
          medicamentoId: medicamentoCatalogo.id,
          cantidad: dato.cantidadEntregada,
          dosis: dato.dosis,
          frecuencia: "Cada 8 horas",
          duracion: "3 días",
          viaAdministracion: dato.via,
          indicaciones: "Indicación de prueba editable.",
        },
      },
    },
    select: { id: true },
  });

  const fichas: Array<{ id: string; numeroFicha: string | null; tipoEvaluacion: TipoFicha }> = [];
  for (const [indice, tipoEvaluacion] of dato.tiposFicha.entries()) {
    const numeroFicha = await obtenerNumeroCorrelativo(tx, "ficha-ocupacional");
    const ficha = await tx.fichaOcupacional.create({
      data: {
        numeroFicha,
        trabajadorId: trabajador.id,
        empresaId: empresa.id,
        departamentoId: departamento.id,
        asignacionLaboralId: asignacion.id,
        atencionMedicaId: atencion.id,
        registroDiarioId: registro.id,
        usuarioId: medico.id,
        tipoEvaluacion,
        estado: "FINALIZADA",
        empresaNombreHistorico: empresa.razonSocial,
        empresaRucHistorico: empresa.ruc,
        departamentoNombreHistorico: departamento.nombre,
        institucionSistema: "PRIVADO",
        tipoInstitucion: "PRIVADO",
        ruc: empresa.ruc,
        ciiu: empresa.actividadEconomicaCodigo,
        establecimiento: empresa.nombreComercial ?? empresa.razonSocial,
        numeroHistoriaClinica: `HC-${dato.numeroDocumento}`,
        primerApellido,
        segundoApellido,
        primerNombre,
        segundoNombre,
        sexo: dato.sexo,
        fechaNacimiento: nacimiento,
        edad: calcularEdad(nacimiento, fechaAtencion),
        puestoTrabajoCIUO: dato.puesto,
        fechaAtencion: new Date(fechaAtencion.getTime() + indice * 24 * 60 * 60 * 1000),
        fechaReintegro: tipoEvaluacion === "REINGRESO" ? fechaCivil("2026-08-01") : null,
        observacionMotivo: `Ficha ${tipoEvaluacion.toLowerCase()} generada como dato de prueba.`,
        descripcionProblemaActual: dato.morbilidad,
        temperatura: 36.7,
        presionArterial: "120/80",
        frecuenciaCardiaca: 72,
        frecuenciaRespiratoria: 18,
        saturacionOxigeno: 98,
        peso: 70,
        talla: 1.7,
        imc: 24.2,
        examenFisico: { observacion: "Dato de prueba funcional" },
        observacionesExamenFisico: "Contenido ficticio para validar secciones y documentos.",
        aptitudMedica: "APTO",
        observacionesAptitud: "Aptitud registrada como dato de prueba.",
        recomendaciones: ["Recomendación ocupacional de prueba"],
        profesionalNombres: nombreProfesional,
        profesionalCodigoMedico: medico.codigoProfesional,
        firmaTrabajadorAcepta: false,
        creadoPorId: medico.id,
        actualizadoPorId: medico.id,
        finalizadoEn: new Date(),
        diagnosticos: {
          create: { enfermedadId: diagnostico.id, def: true },
        },
      },
      select: { id: true, numeroFicha: true, tipoEvaluacion: true },
    });
    fichas.push(ficha);
  }

  const numeroDocumento = await obtenerNumeroCorrelativo(tx, "documento-clinico");
  const documento = await tx.documentoClinico.create({
    data: {
      numeroDocumento,
      trabajadorId: trabajador.id,
      registroDiarioId: registro.id,
      evaluacionMedicaId: evaluacion.id,
      fichaOcupacionalId: fichas[0].id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      profesionalId: medico.id,
      fechaDocumento: fechaAtencion,
      motivoConsulta: dato.morbilidad,
      evolucion: "Evolución registrada como dato clínico de prueba.",
      observaciones: "Documento ficticio para validar consulta, PDF e historial.",
      estado: "FINALIZADO",
      trabajadorNombreHistorico: nombreCompleto,
      trabajadorDocumentoHistorico: dato.numeroDocumento,
      trabajadorNacimientoHistorico: nacimiento,
      empresaNombreHistorico: empresa.razonSocial,
      empresaRucHistorico: empresa.ruc,
      departamentoNombreHistorico: departamento.nombre,
      profesionalNombreHistorico: nombreProfesional,
      profesionalCodigoHistorico: medico.codigoProfesional,
      creadoPorId: medico.id,
      actualizadoPorId: medico.id,
      finalizadoEn: new Date(),
      diagnosticos: {
        create: {
          enfermedadId: diagnostico.id,
          tipo: "DEFINITIVO",
          codigoHistorico: diagnostico.codigo,
          descripcionHistorica: diagnostico.descripcion,
        },
      },
      tratamientos: {
        create: {
          medicamentoId: medicamentoCatalogo.id,
          nombreHistorico: medicamentoCatalogo.nombreGenerico,
          dosis: dato.dosis,
          cantidad: String(dato.cantidadEntregada),
          frecuencia: "Cada 8 horas",
          intervaloHoras: 8,
          duracion: "3 días",
          via: dato.via,
          indicaciones: "Tratamiento de prueba.",
        },
      },
    },
    select: { id: true, numeroDocumento: true },
  });

  const numeroReceta = await siguienteNumeroReceta(tx);
  const receta = await tx.recetaMedica.create({
    data: {
      evaluacionId: evaluacion.id,
      registroDiarioId: registro.id,
      fichaOcupacionalId: fichas[0].id,
      documentoClinicoId: documento.id,
      trabajadorId: trabajador.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      asignacionLaboralId: asignacion.id,
      profesionalId: medico.id,
      numeroReceta,
      fechaEmision: fechaAtencion,
      estado: "EMITIDA",
      indicacionesGenerales: "Indicaciones generales de prueba.",
      recomendaciones: "Seguimiento ocupacional de prueba.",
      trabajadorNombreHistorico: nombreCompleto,
      trabajadorDocumentoHistorico: dato.numeroDocumento,
      empresaNombreHistorico: empresa.razonSocial,
      empresaRucHistorico: empresa.ruc,
      empresaDireccionHistorica: empresa.direccion,
      empresaTelefonoHistorico: empresa.telefono,
      departamentoNombreHistorico: departamento.nombre,
      trabajadorSexoHistorico: dato.sexo,
      trabajadorNacimientoHistorico: nacimiento,
      profesionalNombreHistorico: nombreProfesional,
      profesionalCodigoHistorico: medico.codigoProfesional,
      profesionalEspecialidadHistorica: medico.especialidad,
      diagnosticosHistoricos: [{
        codigo: diagnostico.codigo,
        descripcion: diagnostico.descripcion,
        def: true,
        pre: false,
      }],
      creadoPorId: medico.id,
      emitidaEn: new Date(),
      medicamentos: {
        create: {
          medicamentoId: medicamentoCatalogo.id,
          nombreMedicamentoHistorico: medicamentoCatalogo.nombreGenerico,
          nombreGenericoHistorico: medicamentoCatalogo.nombreGenerico,
          nombreComercialHistorico: medicamentoCatalogo.nombreComercial,
          presentacionHistorica: medicamentoCatalogo.presentacion,
          cantidad: String(dato.cantidadEntregada),
          dosis: dato.dosis,
          frecuencia: "Cada 8 horas",
          intervaloHoras: 8,
          duracion: "3 días",
          viaAdministracion: dato.via,
          indicaciones: "Indicación editable de prueba.",
        },
      },
    },
    select: { id: true, numeroReceta: true },
  });

  await tx.citaMedica.create({
    data: {
      trabajadorId: trabajador.id,
      empresaId: empresa.id,
      departamentoId: departamento.id,
      profesionalId: medico.id,
      atencionMedicaId: atencion.id,
      fecha: fechaAtencion,
      horaInicio: "08:00",
      horaFin: "08:30",
      motivo: dato.morbilidad,
      observaciones: "Cita de prueba atendida.",
      estado: "ATENDIDA",
      creadoPorId: medico.id,
    },
  });

  await tx.auditoria.create({
    data: {
      usuarioId: medico.id,
      accion: "DATOS_PRUEBA_CLINICOS_CREADOS",
      modulo: "datos-prueba",
      entidad: "Trabajador",
      entidadId: trabajador.id,
      datosNuevos: {
        numeroDocumento: dato.numeroDocumento,
        empresa: empresa.razonSocial,
        departamento: departamento.nombre,
        fichas: fichas.map((ficha) => ({ numero: ficha.numeroFicha, tipo: ficha.tipoEvaluacion })),
        numeroRegistro,
        numeroEvaluacion,
        numeroReceta: receta.numeroReceta,
        numeroDocumentoClinico: documento.numeroDocumento,
      },
      resultado: "EXITOSO",
    },
  });

  return {
    trabajadorId: trabajador.id,
    documento: dato.numeroDocumento,
    nombre: nombreCompleto,
    empresa: empresa.razonSocial,
    departamento: departamento.nombre,
    fichas: fichas.map((ficha) => `${ficha.numeroFicha} (${ficha.tipoEvaluacion})`),
    evaluacion: numeroEvaluacion,
    registro: numeroRegistro,
    receta: receta.numeroReceta,
    documentoClinico: documento.numeroDocumento,
    medicamentoEntregado: `${inventario.nombre}: ${dato.cantidadEntregada} ${inventario.unidad}`,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está definida.");
  const aplicar = process.argv.includes("--apply");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const existentes = await comprobarExistentes(prisma);
    if (existentes.length > 0) {
      const completos = existentes.length === DATOS.length && existentes.every((item) =>
        item._count.asignacionesLaborales >= 1
        && item._count.fichaOcupacionals >= 2
        && item._count.evaluacionesMedicas >= 1
        && item._count.recetas >= 1
        && item._count.registrosDiarios >= 1
        && item._count.documentosClinicos >= 1
      );
      if (!completos) {
        throw new Error("Existen datos de prueba parciales. No se crearán duplicados; revise los registros PRUEBA-OCU-001 a 005.");
      }
      const inventario = await prisma.medicamentoInventario.findMany({
        where: { nombre: { in: ["Paracetamol", "Ibuprofeno", "Vitamina c"] } },
        select: { nombre: true, cantidadDisponible: true, unidad: true },
        orderBy: { nombre: "asc" },
      });
      console.log(JSON.stringify({
        idempotente: true,
        mensaje: "Los cinco conjuntos de prueba ya existen.",
        inventario,
        trabajadores: existentes,
      }, null, 2));
      return;
    }

    const medico = await prisma.usuario.findFirst({
      where: {
        correo: "medico@apracom-ec.com",
        estado: "ACTIVO",
        roles: { some: { rol: { nombre: "MÉDICO", estado: "ACTIVO" } } },
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoProfesional: true,
        especialidad: true,
      },
    });
    if (!medico) throw new Error("No existe un médico activo con el correo medico@apracom-ec.com.");

    if (!aplicar) {
      console.log(JSON.stringify({
        modo: "dry-run",
        mensaje: "Preflight correcto. Use --apply para crear los registros.",
        medico: `${medico.nombres} ${medico.apellidos}`,
        trabajadores: DATOS.map((dato) => ({
          documento: dato.numeroDocumento,
          nombre: `${dato.apellidos} ${dato.nombres}`,
          empresa: dato.empresa,
          departamento: dato.departamento,
          fichas: dato.tiposFicha,
          inventario: `${dato.medicamentoInventario}: ${dato.cantidadEntregada}`,
        })),
      }, null, 2));
      return;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const creados = [];
      for (const dato of DATOS) creados.push(await crearTrabajadorCompleto(tx, dato, medico));
      return creados;
    }, { maxWait: 10_000, timeout: 120_000 });

    console.log(JSON.stringify({ aplicado: true, medico: `${medico.nombres} ${medico.apellidos}`, trabajadores: resultado }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
