import type {
  RegistroDiarioDetalleDto,
  RegistroDiarioFechaDto,
} from "@/modulos/registro-diario/tipos";
import {
  agregarPaginacionPdf,
  anchoUtilPdf,
  crearDocumentoPdf,
  dibujarCajaTextoPdf,
  dibujarEncabezadoPdfApracom,
  dibujarTituloSeccionPdf,
  finalizarPdf,
  MARGEN_A4,
  recolectarPdf,
} from "@/servicios/documentos/pdf/pdf-comun";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

const ENCABEZADOS = [
  "APELLIDOS Y NOMBRES",
  "CÉDULA",
  "FECHA DE NACIMIENTO",
  "DÍA DE ATENCIÓN",
  "ATENCIÓN MORBILIDAD",
  "MEDICACIÓN",
  "PROCEDIMIENTO",
  "FIRMA",
];
const PROPORCIONES = [140, 70, 82, 78, 135, 110, 110, 60];
const ALTO_ENCABEZADO_TABLA = 34;

function anchosTabla(documento: PDFKit.PDFDocument): number[] {
  const total = PROPORCIONES.reduce((suma, valor) => suma + valor, 0);
  const ancho = anchoUtilPdf(documento);
  return PROPORCIONES.map((valor) => (valor / total) * ancho);
}

function dibujarEncabezadoPaginaDiaria(
  documento: PDFKit.PDFDocument,
  datos: RegistroDiarioFechaDto,
  continuacion: boolean,
): number {
  dibujarEncabezadoPdfApracom(documento, {
    titulo: continuacion
      ? "REGISTRO DIARIO DE PACIENTES - CONTINUACIÓN"
      : "REGISTRO DIARIO DE PACIENTES",
    subtitulo: `${datos.empresa} · ${formatearFecha(datos.fechaAtencion)}`,
    metadatos: [
      `Profesional: ${datos.profesional ?? "Todos"}`,
      `Registros: ${datos.numeroRegistroInicio} a ${datos.numeroRegistroFin} · Total: ${datos.totalPacientes}`,
    ],
    compacto: true,
  });

  const y = documento.y;
  const anchos = anchosTabla(documento);
  let x = documento.page.margins.left;
  ENCABEZADOS.forEach((encabezado, indice) => {
    documento
      .save()
      .fillColor("#e5e7eb")
      .rect(x, y, anchos[indice], ALTO_ENCABEZADO_TABLA)
      .fill()
      .restore()
      .rect(x, y, anchos[indice], ALTO_ENCABEZADO_TABLA)
      .lineWidth(0.5)
      .stroke("#6b7280")
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .fillColor("#111827")
      .text(encabezado, x + 3, y + 7, {
        width: anchos[indice] - 6,
        height: ALTO_ENCABEZADO_TABLA - 10,
        align: "center",
      });
    x += anchos[indice];
  });
  documento.y = y + ALTO_ENCABEZADO_TABLA;
  return documento.y;
}

function altoFila(
  documento: PDFKit.PDFDocument,
  valores: string[],
  anchos: number[],
): number {
  return Math.max(
    38,
    ...valores.map(
      (valor, indice) =>
        documento
          .font("Helvetica")
          .fontSize(7)
          .heightOfString(valor || "—", {
            width: anchos[indice] - 8,
            lineGap: 0.5,
          }) + 10,
    ),
  );
}

export async function generarRegistroDiarioPdf(
  datos: RegistroDiarioFechaDto,
): Promise<Buffer> {
  const documento = crearDocumentoPdf({
    titulo: `Registro diario ${datos.fechaAtencion}`,
    autor: datos.profesional,
    orientacion: "landscape",
    margen: MARGEN_A4,
  });
  const resultado = recolectarPdf(documento);
  const anchos = anchosTabla(documento);
  let y = dibujarEncabezadoPaginaDiaria(documento, datos, false);

  for (const registro of datos.registros) {
    const valores = [
      registro.nombreCompleto,
      registro.numeroDocumento,
      formatearFecha(registro.fechaNacimiento),
      formatearFecha(registro.fechaAtencion),
      registro.atencionMorbilidad,
      registro.medicacion ?? "—",
      registro.procedimiento ?? "—",
      registro.firmaConfirmada ? "SÍ" : "NO",
    ];
    const alto = altoFila(documento, valores, anchos);
    const limite =
      documento.page.height - documento.page.margins.bottom - 22;

    if (y + alto > limite) {
      documento.addPage();
      y = dibujarEncabezadoPaginaDiaria(documento, datos, true);
    }

    let x = documento.page.margins.left;
    valores.forEach((valor, indice) => {
      documento
        .rect(x, y, anchos[indice], alto)
        .lineWidth(0.45)
        .stroke("#9ca3af")
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#111827")
        .text(valor || "—", x + 4, y + 5, {
          width: anchos[indice] - 8,
          height: alto - 10,
          align: indice === 7 ? "center" : "left",
          lineGap: 0.5,
        });
      x += anchos[indice];
    });
    y += alto;
    documento.y = y;
  }

  agregarPaginacionPdf(documento, "Registro diario de pacientes");
  return finalizarPdf(documento, resultado);
}

export async function generarRegistroDiarioIndividualPdf(
  registro: RegistroDiarioDetalleDto,
): Promise<Buffer> {
  const documento = crearDocumentoPdf({
    titulo: `Registro diario ${registro.numeroRegistro}`,
    autor: registro.profesional,
  });
  const resultado = recolectarPdf(documento);
  dibujarEncabezadoPdfApracom(documento, {
    titulo: "REGISTRO DIARIO DE PACIENTES",
    subtitulo: `${registro.numeroRegistro} · ${formatearFecha(registro.fechaAtencion)}`,
    metadatos: [
      `Empresa: ${registro.empresa}`,
      `Departamento: ${registro.departamento ?? "—"} · Profesional: ${registro.profesional ?? "—"}`,
    ],
  });

  dibujarTituloSeccionPdf(documento, "DATOS DEL REGISTRO");
  const x = documento.page.margins.left;
  const ancho = anchoUtilPdf(documento);
  const separacion = 6;
  const columna = (ancho - separacion) / 2;
  const filas = [
    [
      ["Trabajador", registro.nombreCompleto],
      ["Cédula", registro.numeroDocumento],
    ],
    [
      ["Fecha de nacimiento", formatearFecha(registro.fechaNacimiento)],
      ["Día de atención", formatearFecha(registro.fechaAtencion)],
    ],
    [
      ["Empresa", registro.empresa],
      ["Departamento", registro.departamento ?? "—"],
    ],
    [
      ["Profesional", registro.profesional ?? "—"],
      ["Estado", registro.estado],
    ],
  ] as const;

  for (const fila of filas) {
    const y = documento.y;
    const altoIzquierdo = dibujarCajaTextoPdf(documento, {
      titulo: fila[0][0],
      texto: fila[0][1],
      x,
      y,
      ancho: columna,
      alto: 34,
    });
    const altoDerecho = dibujarCajaTextoPdf(documento, {
      titulo: fila[1][0],
      texto: fila[1][1],
      x: x + columna + separacion,
      y,
      ancho: columna,
      alto: 34,
    });
    documento.y = y + Math.max(altoIzquierdo, altoDerecho) + 5;
  }

  const secciones = [
    ["ATENCIÓN MORBILIDAD", registro.atencionMorbilidad],
    ["MEDICACIÓN", registro.medicacion],
    ["PROCEDIMIENTO", registro.procedimiento],
    [
      "FIRMA",
      registro.firmaConfirmada ? "Firma confirmada" : "Firma no confirmada",
    ],
  ] as const;

  for (const [titulo, valor] of secciones) {
    dibujarTituloSeccionPdf(documento, titulo);
    const alto = dibujarCajaTextoPdf(documento, {
      texto: valor,
      x,
      y: documento.y,
      ancho,
      alto: titulo === "ATENCIÓN MORBILIDAD" ? 64 : 48,
    });
    documento.y += alto + 5;
  }

  if (registro.observaciones) {
    dibujarTituloSeccionPdf(documento, "OBSERVACIONES");
    const alto = dibujarCajaTextoPdf(documento, {
      texto: registro.observaciones,
      x,
      y: documento.y,
      ancho,
      alto: 42,
    });
    documento.y += alto;
  }

  agregarPaginacionPdf(documento, registro.numeroRegistro);
  return finalizarPdf(documento, resultado);
}
