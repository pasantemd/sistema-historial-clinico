import type { ReporteMovimientosInventarioDto } from "@/modulos/inventario/tipos";
import {
  etiquetaMovimiento,
  etiquetaUnidadInventario,
} from "@/modulos/inventario/constantes";
import {
  agregarPaginacionPdf,
  anchoUtilPdf,
  COLOR_BORDE_PDF,
  COLOR_TEXTO_PDF,
  crearDocumentoPdf,
  dibujarCajaTextoPdf,
  dibujarEncabezadoPdfApracom,
  dibujarTituloSeccionPdf,
  finalizarPdf,
  recolectarPdf,
} from "@/servicios/documentos/pdf/pdf-comun";

const COLUMNAS = [80, 60, 45, 45, 45, 120, 110, 150, 130] as const;
const TITULOS = [
  "FECHA Y HORA",
  "MOVIMIENTO",
  "CANT.",
  "ANTERIOR",
  "DESPUÉS",
  "DESTINATARIO",
  "CONCEPTO",
  "MOTIVO",
  "RESPONSABLE",
] as const;

export async function generarMovimientosInventarioPdf(
  medicamento: ReporteMovimientosInventarioDto,
): Promise<Buffer> {
  const documento = crearDocumentoPdf({
    titulo: `Movimientos de inventario - ${medicamento.nombre}`,
    asunto: "Historial de movimientos de inventario",
    orientacion: "landscape",
  });
  const resultado = recolectarPdf(documento);
  const unidad = etiquetaUnidadInventario(medicamento.unidad);

  const dibujarEncabezado = (continuacion = false) => {
    dibujarEncabezadoPdfApracom(documento, {
      titulo: continuacion
        ? "MOVIMIENTOS DE INVENTARIO - CONTINUACIÓN"
        : "MOVIMIENTOS DE INVENTARIO",
      subtitulo: medicamento.nombre,
      metadatos: [`Estado: ${medicamento.estado === "ACTIVO" ? "Activo" : "Inactivo"}`],
      compacto: continuacion,
    });
    if (!continuacion) dibujarResumen();
    dibujarTituloSeccionPdf(documento, "HISTORIAL DE MOVIMIENTOS");
    dibujarCabeceraTabla();
  };

  const dibujarResumen = () => {
    const x = documento.page.margins.left;
    const ancho = anchoUtilPdf(documento);
    const separacion = 6;
    const anchoCaja = (ancho - separacion * 3) / 4;
    const datos = [
      ["Medicamento", medicamento.nombre],
      ["Cantidad disponible", `${medicamento.cantidadDisponible} ${unidad}`],
      ["Fecha de caducidad", formatearFechaCivil(medicamento.fechaCaducidad)],
      ["Total de movimientos", String(medicamento.movimientos.length)],
    ] as const;
    const y = documento.y;
    datos.forEach(([titulo, texto], indice) => {
      dibujarCajaTextoPdf(documento, {
        titulo,
        texto,
        x: x + indice * (anchoCaja + separacion),
        y,
        ancho: anchoCaja,
        alto: 38,
      });
    });
    documento.y = y + 44;
  };

  const dibujarCabeceraTabla = () => {
    let x = documento.page.margins.left;
    const y = documento.y;
    TITULOS.forEach((titulo, indice) => {
      const ancho = COLUMNAS[indice];
      documento
        .save()
        .fillColor("#e5e7eb")
        .rect(x, y, ancho, 26)
        .fill()
        .restore()
        .rect(x, y, ancho, 26)
        .lineWidth(0.5)
        .strokeColor(COLOR_BORDE_PDF)
        .stroke()
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(COLOR_TEXTO_PDF)
        .text(titulo, x + 4, y + 6, {
          width: ancho - 8,
          height: 18,
          align: "center",
        });
      x += ancho;
    });
    documento.y = y + 26;
  };

  const nuevaPagina = () => {
    documento.addPage();
    dibujarEncabezado(true);
  };

  dibujarEncabezado();

  if (medicamento.movimientos.length === 0) {
    dibujarCajaTextoPdf(documento, {
      texto: "Este medicamento no registra movimientos.",
      x: documento.page.margins.left,
      y: documento.y,
      ancho: anchoUtilPdf(documento),
      alto: 42,
      alineacion: "center",
    });
  } else {
    for (const movimiento of medicamento.movimientos) {
      const valores = [
        formatearFechaHora(movimiento.creadoEn),
        etiquetaMovimiento(movimiento.tipoMovimiento),
        movimiento.cantidad,
        movimiento.cantidadAnterior,
        movimiento.cantidadPosterior,
        movimiento.destinatario ?? "-",
        movimiento.concepto,
        movimiento.motivo,
        movimiento.responsable,
      ];
      const alto = calcularAltoFila(documento, valores);
      const limite = documento.page.height - documento.page.margins.bottom - 22;
      if (documento.y + alto > limite) nuevaPagina();
      dibujarFila(documento, valores, alto);
    }
  }

  agregarPaginacionPdf(documento, `Inventario - ${medicamento.nombre}`);
  return finalizarPdf(documento, resultado);
}

function calcularAltoFila(
  documento: PDFKit.PDFDocument,
  valores: string[],
): number {
  const alturas = valores.map((valor, indice) =>
    documento
      .font("Helvetica")
      .fontSize(7)
      .heightOfString(valor, { width: COLUMNAS[indice] - 8, lineGap: 1 }),
  );
  return Math.max(25, Math.ceil(Math.max(...alturas)) + 10);
}

function dibujarFila(
  documento: PDFKit.PDFDocument,
  valores: string[],
  alto: number,
): void {
  let x = documento.page.margins.left;
  const y = documento.y;
  valores.forEach((valor, indice) => {
    const ancho = COLUMNAS[indice];
    documento
      .rect(x, y, ancho, alto)
      .lineWidth(0.45)
      .strokeColor(COLOR_BORDE_PDF)
      .stroke()
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLOR_TEXTO_PDF)
      .text(valor, x + 4, y + 5, {
        width: ancho - 8,
        height: alto - 8,
        align: indice >= 2 && indice <= 4 ? "right" : "left",
        lineGap: 1,
      });
    x += ancho;
  });
  documento.y = y + alto;
}

function formatearFechaCivil(fecha: string | null): string {
  if (!fecha) return "Sin registrar";
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00.000Z`));
}

function formatearFechaHora(fecha: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Guayaquil",
  }).format(new Date(fecha));
}
