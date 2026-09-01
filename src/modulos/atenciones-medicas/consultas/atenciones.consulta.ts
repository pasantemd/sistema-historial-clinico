import { prisma } from "@/servicios/base-datos/prisma";
import type {
  AtencionMedicaDetalleDto,
  AtencionMedicaResumenDto,
  DocumentoAtencionDto,
} from "@/modulos/atenciones-medicas/tipos";

const fecha = (valor: Date | null) =>
  valor ? valor.toISOString().slice(0, 10) : null;

const hora = (valor: Date | null) =>
  valor ? valor.toISOString().slice(11, 16) : null;

function documentosDesdeAtencion(
  atencion: {
    fichas: Array<{
      id: string;
      tipoEvaluacion: string;
      estado: string;
      fechaAtencion: Date | null;
    }>;
    evaluaciones: Array<{
      id: string;
      estado: string;
      fechaAtencion: Date | null;
    }>;
    recetas: Array<{
      id: string;
      estado: string;
      fechaEmision: Date;
      numeroReceta: string;
    }>;
  },
  trabajadorId: string,
): DocumentoAtencionDto[] {
  const documentos: DocumentoAtencionDto[] = [];
  for (const ficha of atencion.fichas) {
    documentos.push({
      tipo: "FICHA",
      id: ficha.id,
      etiqueta: `Ficha ocupacional (${ficha.tipoEvaluacion})`,
      estado: ficha.estado,
      fecha: fecha(ficha.fechaAtencion),
      ruta: `/trabajadores/${trabajadorId}/fichas/${ficha.id}`,
    });
    if (ficha.estado === "FINALIZADA") {
      documentos.push({
        tipo: "CERTIFICADO",
        id: `${ficha.id}-certificado`,
        etiqueta: "Certificado ocupacional",
        estado: ficha.estado,
        fecha: fecha(ficha.fechaAtencion),
        ruta: `/trabajadores/${trabajadorId}/fichas/${ficha.id}/certificado`,
      });
    }
  }
  for (const evaluacion of atencion.evaluaciones) {
    documentos.push({
      tipo: "EVALUACION",
      id: evaluacion.id,
      etiqueta: "Evaluación médica",
      estado: evaluacion.estado,
      fecha: fecha(evaluacion.fechaAtencion),
      ruta: `/trabajadores/${trabajadorId}/evaluaciones-medicas/${evaluacion.id}`,
    });
  }
  for (const receta of atencion.recetas) {
    documentos.push({
      tipo: "RECETA",
      id: receta.id,
      etiqueta: `Receta ${receta.numeroReceta}`,
      estado: receta.estado,
      fecha: fecha(receta.fechaEmision),
      ruta: `/recetas/${receta.id}`,
    });
  }
  return documentos;
}

function mapearResumen(atencion: {
  id: string;
  trabajadorId: string;
  empresaId: string;
  departamentoId: string | null;
  fechaAtencion: Date;
  horaAtencion: Date | null;
  motivoGeneral: string | null;
  estado: AtencionMedicaResumenDto["estado"];
  empresaNombreHistorico: string;
  empresaRucHistorico: string;
  departamentoNombreHistorico: string | null;
  trabajadorNombreHistorico: string;
  trabajadorDocumentoHistorico: string;
  profesionalResponsableId: string | null;
  profesionalNombreHistorico: string | null;
  finalizadaEn: Date | null;
  anuladaEn: Date | null;
}): AtencionMedicaResumenDto {
  return {
    id: atencion.id,
    trabajadorId: atencion.trabajadorId,
    empresaId: atencion.empresaId,
    departamentoId: atencion.departamentoId,
    fechaAtencion: fecha(atencion.fechaAtencion),
    horaAtencion: hora(atencion.horaAtencion),
    motivoGeneral: atencion.motivoGeneral,
    estado: atencion.estado,
    empresaNombreHistorico: atencion.empresaNombreHistorico,
    empresaRucHistorico: atencion.empresaRucHistorico,
    departamentoNombreHistorico: atencion.departamentoNombreHistorico,
    trabajadorNombreHistorico: atencion.trabajadorNombreHistorico,
    trabajadorDocumentoHistorico: atencion.trabajadorDocumentoHistorico,
    profesionalResponsableId: atencion.profesionalResponsableId,
    profesionalResponsableNombre: atencion.profesionalNombreHistorico,
    finalizadaEn: fecha(atencion.finalizadaEn),
    anuladaEn: fecha(atencion.anuladaEn),
  };
}

export async function listarAtencionesResumen(
  trabajadorId: string,
): Promise<AtencionMedicaResumenDto[]> {
  const atenciones = await prisma.atencionMedica.findMany({
    where: { trabajadorId },
    orderBy: [
      { fechaAtencion: "desc" },
      { horaAtencion: "desc" },
      { creadoEn: "desc" },
    ],
  });
  return atenciones.map(mapearResumen);
}

export async function listarAgrupadoPorAtencion(
  trabajadorId: string,
): Promise<AtencionMedicaDetalleDto[]> {
  const [atenciones, fichasHuerfanas, evaluacionesHuerfanas, recetasHuerfanas] =
    await Promise.all([
      prisma.atencionMedica.findMany({
        where: { trabajadorId },
        include: {
          fichas: {
            select: {
              id: true,
              tipoEvaluacion: true,
              estado: true,
              fechaAtencion: true,
            },
          },
          evaluaciones: {
            select: { id: true, estado: true, fechaAtencion: true },
          },
          recetas: {
            select: {
              id: true,
              estado: true,
              fechaEmision: true,
              numeroReceta: true,
            },
          },
        },
        orderBy: [
          { fechaAtencion: "desc" },
          { horaAtencion: "desc" },
          { creadoEn: "desc" },
        ],
      }),
      prisma.fichaOcupacional.findMany({
        where: { trabajadorId, atencionMedicaId: null },
        select: {
          id: true,
          tipoEvaluacion: true,
          estado: true,
          fechaAtencion: true,
        },
      }),
      prisma.evaluacionMedica.findMany({
        where: { trabajadorId, atencionMedicaId: null },
        select: { id: true, estado: true, fechaAtencion: true },
      }),
      prisma.recetaMedica.findMany({
        where: { trabajadorId, atencionMedicaId: null },
        select: {
          id: true,
          estado: true,
          fechaEmision: true,
          numeroReceta: true,
        },
      }),
    ]);

  const grupos: AtencionMedicaDetalleDto[] = atenciones.map((atencion) => ({
    ...mapearResumen(atencion),
    documentos: documentosDesdeAtencion(atencion, trabajadorId),
  }));

  for (const ficha of fichasHuerfanas) {
    const documentos = documentosDesdeAtencion(
      { fichas: [ficha], evaluaciones: [], recetas: [] },
      trabajadorId,
    );
    grupos.push(
      grupoHistorico(`ficha-${ficha.id}`, trabajadorId, fecha(ficha.fechaAtencion), documentos),
    );
  }
  for (const evaluacion of evaluacionesHuerfanas) {
    grupos.push(
      grupoHistorico(
        `evaluacion-${evaluacion.id}`,
        trabajadorId,
        fecha(evaluacion.fechaAtencion),
        documentosDesdeAtencion(
          { fichas: [], evaluaciones: [evaluacion], recetas: [] },
          trabajadorId,
        ),
      ),
    );
  }
  for (const receta of recetasHuerfanas) {
    grupos.push(
      grupoHistorico(
        `receta-${receta.id}`,
        trabajadorId,
        fecha(receta.fechaEmision),
        documentosDesdeAtencion(
          { fichas: [], evaluaciones: [], recetas: [receta] },
          trabajadorId,
        ),
      ),
    );
  }

  return grupos.sort((a, b) =>
    (b.fechaAtencion ?? "").localeCompare(a.fechaAtencion ?? ""),
  );
}

function grupoHistorico(
  id: string,
  trabajadorId: string,
  fechaRegistro: string | null,
  documentos: DocumentoAtencionDto[],
): AtencionMedicaDetalleDto {
  return {
    id: `historico-${id}`,
    trabajadorId,
    empresaId: "",
    departamentoId: null,
    fechaAtencion: fechaRegistro,
    horaAtencion: null,
    motivoGeneral: "Registro histórico previo a la centralización de atenciones",
    estado: "FINALIZADA",
    empresaNombreHistorico: "—",
    empresaRucHistorico: "—",
    departamentoNombreHistorico: null,
    trabajadorNombreHistorico: "",
    trabajadorDocumentoHistorico: "",
    profesionalResponsableId: null,
    profesionalResponsableNombre: null,
    finalizadaEn: fechaRegistro,
    anuladaEn: null,
    documentos,
  };
}

export async function consultarAtencion(id: string, trabajadorId: string | undefined, usuarioId: string) {
  return prisma.atencionMedica.findFirst({
    where: {
      id,
      trabajadorId,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    include: {
      fichas: {
        select: {
          id: true,
          tipoEvaluacion: true,
          estado: true,
          fechaAtencion: true,
        },
      },
      evaluaciones: {
        select: { id: true, estado: true, fechaAtencion: true },
      },
      recetas: {
        select: {
          id: true,
          estado: true,
          fechaEmision: true,
          numeroReceta: true,
        },
      },
      trabajador: {
        select: { nombres: true, apellidos: true, numeroDocumento: true },
      },
      empresa: { select: { razonSocial: true, ruc: true } },
      departamento: { select: { nombre: true } },
      profesionalResponsable: {
        select: { nombres: true, apellidos: true },
      },
    },
  });
}
