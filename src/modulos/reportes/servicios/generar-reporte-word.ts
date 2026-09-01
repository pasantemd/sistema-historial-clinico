import {
  AlignmentType,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";

import {
  obtenerTituloGraficoReporte,
  type IdGraficoReporte,
} from "@/modulos/reportes/configuracion/graficos-reporte";
import { resolverPeriodoReportes } from "@/modulos/reportes/servicios/resolver-periodo-reportes";
import type { FiltrosReportes } from "@/modulos/reportes/tipos";

interface GraficoWord {
  id: IdGraficoReporte;
  imagenDataUrl: string;
}

interface DatosReporteWord {
  filtros: FiltrosReportes;
  usuario: string;
  graficos: GraficoWord[];
}

const FIRMA_PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function extraerPng(imagenDataUrl: string): Buffer {
  const prefijo = "data:image/png;base64,";
  if (!imagenDataUrl.startsWith(prefijo)) {
    throw new Error("El gráfico no contiene una imagen PNG válida.");
  }
  const contenido = Buffer.from(imagenDataUrl.slice(prefijo.length), "base64");
  if (
    contenido.length < 24
    || !FIRMA_PNG.every((valor, indice) => contenido[indice] === valor)
  ) {
    throw new Error("El gráfico no contiene una imagen PNG válida.");
  }
  return contenido;
}

function dimensionesPng(contenido: Buffer): { width: number; height: number } {
  return {
    width: contenido.readUInt32BE(16),
    height: contenido.readUInt32BE(20),
  };
}

function dimensionesWord(contenido: Buffer): { width: number; height: number } {
  const original = dimensionesPng(contenido);
  const escala = Math.min(624 / original.width, 590 / original.height, 1);
  return {
    width: Math.max(1, Math.round(original.width * escala)),
    height: Math.max(1, Math.round(original.height * escala)),
  };
}

export async function generarReporteWord({
  filtros,
  usuario,
  graficos,
}: DatosReporteWord): Promise<Buffer> {
  if (graficos.length === 0) {
    throw new Error("Debe seleccionar al menos un gráfico.");
  }

  const periodo = resolverPeriodoReportes(filtros);
  const parrafosGraficos = graficos.flatMap((grafico, indice) => {
    const contenido = extraerPng(grafico.imagenDataUrl);
    const dimensiones = dimensionesWord(contenido);
    const titulo = obtenerTituloGraficoReporte(grafico.id);
    return [
      ...(grafico.id === "medicamentos-entregados"
        ? [
            new Paragraph({
              pageBreakBefore: indice > 0,
              spacing: { before: 120, after: 80 },
              children: [
                new TextRun({ text: titulo, bold: true, size: 26, color: "111827" }),
              ],
            }),
          ]
        : []),
      new Paragraph({
        pageBreakBefore: indice > 0 && grafico.id !== "medicamentos-entregados",
        spacing: { before: 120, after: 120 },
        children: [
          new ImageRun({
            type: "png",
            data: contenido,
            transformation: dimensiones,
            altText: {
              name: titulo,
              title: titulo,
              description: `Gráfico del reporte: ${titulo}`,
            },
          }),
        ],
      }),
    ];
  });

  const documento = new Document({
    creator: "Sistema de Historial Clínico Ocupacional",
    title: "Reporte gráfico clínico ocupacional",
    description: "Reporte Word con gráficos seleccionados por el usuario.",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: "111827" },
          paragraph: { spacing: { after: 120, line: 264 } },
        },
      },
      paragraphStyles: [
        {
          id: "TituloReporte",
          name: "Título del reporte",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 34, bold: true, color: "2E74B5" },
          paragraph: { spacing: { before: 0, after: 160 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Sistema de Historial Clínico Ocupacional",
                    size: 18,
                    color: "6B7280",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Página ", size: 18, color: "6B7280" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "6B7280" }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            style: "TituloReporte",
            children: [new TextRun("Reporte gráfico clínico ocupacional")],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Período: ", bold: true }),
              new TextRun(
                `${fechaLegible(periodo.fechaDesde)} al ${fechaLegible(periodo.fechaHasta)}`,
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Generado por: ", bold: true }),
              new TextRun(usuario),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `${graficos.length} gráfico${graficos.length === 1 ? "" : "s"} seleccionado${graficos.length === 1 ? "" : "s"}`,
                color: "6B7280",
              }),
            ],
          }),
          ...parrafosGraficos,
        ],
      },
    ],
  });

  return Packer.toBuffer(documento);
}
