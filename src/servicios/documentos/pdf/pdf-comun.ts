import PDFDocument from "pdfkit";

import { obtenerLogoBuffer } from "@/utilidades/marca/cargar-logo-apracom";

export const PUNTOS_POR_MILIMETRO = 72 / 25.4;
export const MARGEN_A4 = 10 * PUNTOS_POR_MILIMETRO;
export const COLOR_PRIMARIO_PDF = "#166534";
export const COLOR_TEXTO_PDF = "#111827";
export const COLOR_BORDE_PDF = "#9ca3af";
export const COLOR_FONDO_SECCION_PDF = "#f0fdf4";

interface CrearPdfOpciones {
  titulo: string;
  autor?: string | null;
  asunto?: string;
  orientacion?: "portrait" | "landscape";
  margen?: number;
  paginasEnBuffer?: boolean;
}

interface EncabezadoPdfOpciones {
  titulo: string;
  subtitulo?: string;
  metadatos?: string[];
  compacto?: boolean;
}

interface CajaTextoOpciones {
  titulo?: string;
  texto?: string | null;
  x: number;
  y: number;
  ancho: number;
  alto?: number;
  tamano?: number;
  fondo?: string;
  negrita?: boolean;
  alineacion?: "left" | "center" | "right";
}

export function crearDocumentoPdf({
  titulo,
  autor,
  asunto,
  orientacion = "portrait",
  margen = MARGEN_A4,
  paginasEnBuffer = true,
}: CrearPdfOpciones): PDFKit.PDFDocument {
  return new PDFDocument({
    size: "A4",
    layout: orientacion,
    margin: margen,
    bufferPages: paginasEnBuffer,
    autoFirstPage: true,
    info: {
      Title: titulo,
      Author: autor?.trim() || "APRACOM",
      Subject: asunto ?? titulo,
      Creator: "Sistema de Historial Clínico Ocupacional",
    },
  });
}

export function recolectarPdf(
  documento: PDFKit.PDFDocument,
): Promise<Buffer> {
  const partes: Buffer[] = [];
  documento.on("data", (parte: Buffer) => partes.push(parte));
  return new Promise<Buffer>((resolve, reject) => {
    documento.on("end", () => resolve(Buffer.concat(partes)));
    documento.on("error", reject);
  });
}

export function finalizarPdf(
  documento: PDFKit.PDFDocument,
  resultado: Promise<Buffer>,
): Promise<Buffer> {
  documento.end();
  return resultado;
}

export function anchoUtilPdf(documento: PDFKit.PDFDocument): number {
  return (
    documento.page.width -
    documento.page.margins.left -
    documento.page.margins.right
  );
}

export function dibujarEncabezadoPdfApracom(
  documento: PDFKit.PDFDocument,
  opciones: EncabezadoPdfOpciones,
): number {
  const { left, top, right } = documento.page.margins;
  const ancho = documento.page.width - left - right;
  const alto = opciones.compacto ? 48 : 62;
  const anchoLogo = opciones.compacto ? 66 : 82;

  documento
    .save()
    .fillColor("white")
    .rect(left, top, ancho, alto)
    .fill()
    .restore();

  documento.image(obtenerLogoBuffer(), left, top + 2, {
    fit: [anchoLogo, alto - 6],
    valign: "center",
  });

  const xTexto = left + anchoLogo + 12;
  const anchoTexto = ancho - anchoLogo - 12;
  documento
    .font("Helvetica-Bold")
    .fontSize(opciones.compacto ? 12 : 15)
    .fillColor(COLOR_TEXTO_PDF)
    .text(opciones.titulo, xTexto, top + 4, {
      width: anchoTexto,
      align: "right",
    });

  let y = top + (opciones.compacto ? 22 : 26);
  if (opciones.subtitulo) {
    documento
      .font("Helvetica")
      .fontSize(opciones.compacto ? 7.5 : 8.5)
      .text(opciones.subtitulo, xTexto, y, {
        width: anchoTexto,
        align: "right",
      });
    y += opciones.compacto ? 10 : 12;
  }

  for (const metadato of opciones.metadatos ?? []) {
    documento
      .font("Helvetica")
      .fontSize(opciones.compacto ? 7 : 8)
      .text(metadato, xTexto, y, {
        width: anchoTexto,
        align: "right",
      });
    y += opciones.compacto ? 8 : 9;
  }

  const yLinea = top + alto;
  documento
    .lineWidth(1.2)
    .strokeColor(COLOR_PRIMARIO_PDF)
    .moveTo(left, yLinea)
    .lineTo(left + ancho, yLinea)
    .stroke()
    .strokeColor(COLOR_TEXTO_PDF);

  documento.y = yLinea + 8;
  return documento.y;
}

export function dibujarTituloSeccionPdf(
  documento: PDFKit.PDFDocument,
  titulo: string,
  y = documento.y,
  alto = 18,
): number {
  const x = documento.page.margins.left;
  const ancho = anchoUtilPdf(documento);
  documento
    .save()
    .fillColor(COLOR_FONDO_SECCION_PDF)
    .rect(x, y, ancho, alto)
    .fill()
    .restore();
  documento
    .rect(x, y, ancho, alto)
    .lineWidth(0.6)
    .strokeColor(COLOR_BORDE_PDF)
    .stroke()
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLOR_TEXTO_PDF)
    .text(titulo, x + 5, y + 4, { width: ancho - 10 });
  documento.y = y + alto + 5;
  return documento.y;
}

export function dibujarCajaTextoPdf(
  documento: PDFKit.PDFDocument,
  opciones: CajaTextoOpciones,
): number {
  const cursorX = documento.x;
  const cursorY = documento.y;
  const texto = opciones.texto?.trim() || "—";
  const tamano = opciones.tamano ?? 8.5;
  const altoTitulo = opciones.titulo ? 13 : 0;
  const altoTexto = documento
    .font(opciones.negrita ? "Helvetica-Bold" : "Helvetica")
    .fontSize(tamano)
    .heightOfString(texto, {
      width: opciones.ancho - 10,
      lineGap: 1,
    });
  const alto = Math.max(
    opciones.alto ?? 0,
    altoTitulo + Math.ceil(altoTexto) + 10,
  );

  if (opciones.fondo) {
    documento
      .save()
      .fillColor(opciones.fondo)
      .rect(opciones.x, opciones.y, opciones.ancho, alto)
      .fill()
      .restore();
  }
  documento
    .rect(opciones.x, opciones.y, opciones.ancho, alto)
    .lineWidth(0.5)
    .strokeColor(COLOR_BORDE_PDF)
    .stroke();

  if (opciones.titulo) {
    documento
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLOR_PRIMARIO_PDF)
      .text(opciones.titulo, opciones.x + 5, opciones.y + 4, {
        width: opciones.ancho - 10,
      });
  }
  documento
    .font(opciones.negrita ? "Helvetica-Bold" : "Helvetica")
    .fontSize(tamano)
    .fillColor(COLOR_TEXTO_PDF)
    .text(texto, opciones.x + 5, opciones.y + 5 + altoTitulo, {
      width: opciones.ancho - 10,
      height: alto - altoTitulo - 8,
      align: opciones.alineacion ?? "left",
      lineGap: 1,
    });
  documento.x = cursorX;
  documento.y = cursorY;
  return alto;
}

export function asegurarEspacioPdf(
  documento: PDFKit.PDFDocument,
  altoNecesario: number,
  alAgregarPagina?: () => void,
): boolean {
  const limite = documento.page.height - documento.page.margins.bottom - 24;
  if (documento.y + altoNecesario <= limite) return false;
  documento.addPage();
  alAgregarPagina?.();
  return true;
}

export function agregarPaginacionPdf(
  documento: PDFKit.PDFDocument,
  etiqueta?: string,
): void {
  const rango = documento.bufferedPageRange();
  for (
    let indice = rango.start;
    indice < rango.start + rango.count;
    indice += 1
  ) {
    documento.switchToPage(indice);
    const ancho = anchoUtilPdf(documento);
    const texto = [
      etiqueta?.trim(),
      `Página ${indice - rango.start + 1} de ${rango.count}`,
    ]
      .filter(Boolean)
      .join(" · ");
    documento
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#4b5563")
      .text(
        texto,
        documento.page.margins.left,
        documento.page.height - documento.page.margins.bottom - 9,
        { width: ancho, align: "center", lineBreak: false },
      );
  }
}

export function textoPdf(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (Array.isArray(valor)) {
    return valor.length ? valor.map(textoPdf).join("\n") : "—";
  }
  if (typeof valor === "object") {
    return Object.entries(valor as Record<string, unknown>)
      .map(([clave, dato]) => `${humanizarClavePdf(clave)}: ${textoPdf(dato)}`)
      .join("\n");
  }
  return String(valor);
}

export function humanizarClavePdf(clave: string): string {
  return clave
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (letra) => letra.toUpperCase());
}
