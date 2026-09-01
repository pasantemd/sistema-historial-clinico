import type ExcelJS from "exceljs";

export const COLORES_EXCEL = {
  encabezadoPrincipal: "FFD9D9FF",
  encabezadoCampo: "FFCCFFCC",
  fondoCampo: "FFFFFFFF",
  borde: "FF808080",
  texto: "FF000000",
} as const;

const ANCHOS_COLUMNAS = [
  5, 5.332, 4.332, 4.441, 3.664, 3.886, 4.554, 4.109, 4.441, 4.109,
  4.886, 5, 5.441, 4.554, 4.332, 3.441, 4.109, 4.109, 4.554, 4,
  3.441, 3.441, 3.886, 4.554, 2.886, 4, 3.332, 4.441, 3.332, 3.886,
  3, 2.886, 5.441, 8.441, 3.554, 4, 4.886, 7,
] as const;

const bordeFino: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORES_EXCEL.borde } },
  left: { style: "thin", color: { argb: COLORES_EXCEL.borde } },
  bottom: { style: "thin", color: { argb: COLORES_EXCEL.borde } },
  right: { style: "thin", color: { argb: COLORES_EXCEL.borde } },
};

function relleno(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

export function aplicarBorde(
  hoja: ExcelJS.Worksheet,
  rango: string,
  estilo: "thin" | "medium" = "thin",
): void {
  const [inicio, fin = inicio] = rango.split(":");
  const celdaInicio = hoja.getCell(inicio);
  const celdaFin = hoja.getCell(fin);
  const lado = { style: estilo, color: { argb: COLORES_EXCEL.borde } } as const;

  for (let fila = celdaInicio.row; fila <= celdaFin.row; fila += 1) {
    for (let columna = celdaInicio.col; columna <= celdaFin.col; columna += 1) {
      const celda = hoja.getCell(fila, columna);
      celda.border = {
        ...celda.border,
        ...(fila === celdaInicio.row ? { top: lado } : {}),
        ...(fila === celdaFin.row ? { bottom: lado } : {}),
        ...(columna === celdaInicio.col ? { left: lado } : {}),
        ...(columna === celdaFin.col ? { right: lado } : {}),
      };
    }
  }
}

export function aplicarTitulo(celda: ExcelJS.Cell, tamano = 12): void {
  celda.font = { name: "Arial", size: tamano, bold: true, color: { argb: COLORES_EXCEL.texto } };
  celda.fill = relleno(COLORES_EXCEL.encabezadoPrincipal);
  celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  celda.border = bordeFino;
  celda.protection = { locked: false };
}

export function aplicarTituloSeccion(celda: ExcelJS.Cell): void {
  aplicarTitulo(celda, 10);
  celda.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
}

export function aplicarEncabezado(celda: ExcelJS.Cell): void {
  celda.font = { name: "Arial", size: 8, color: { argb: COLORES_EXCEL.texto } };
  celda.fill = relleno(COLORES_EXCEL.encabezadoCampo);
  celda.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  celda.border = bordeFino;
  celda.protection = { locked: false };
}

export function aplicarCampo(celda: ExcelJS.Cell, alineacion: "left" | "center" = "center"): void {
  celda.font = { name: "Arial", size: 9, color: { argb: COLORES_EXCEL.texto } };
  celda.fill = relleno(COLORES_EXCEL.fondoCampo);
  celda.alignment = { horizontal: alineacion, vertical: "middle", wrapText: true };
  celda.border = bordeFino;
  celda.numFmt = "@";
  celda.protection = { locked: false };
}

export function configurarHojaCertificado(hoja: ExcelJS.Worksheet): void {
  hoja.views = [{ showGridLines: false, zoomScale: 65 }];
  hoja.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    printArea: "A1:AL33",
    margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 },
  };
  ANCHOS_COLUMNAS.forEach((ancho, indice) => { hoja.getColumn(indice + 1).width = ancho; });
  const alturas: Record<number, number> = {
    1: 17, 2: 17, 3: 31.5, 6: 15, 7: 8, 8: 17, 13: 16, 14: 8,
    15: 17, 19: 15, 20: 15, 21: 15, 22: 8, 23: 17, 27: 8, 28: 24,
    30: 15, 31: 8, 32: 17, 33: 32,
  };
  Object.entries(alturas).forEach(([fila, altura]) => { hoja.getRow(Number(fila)).height = altura; });

  for (let fila = 1; fila <= 33; fila += 1) {
    for (let columna = 1; columna <= 38; columna += 1) {
      hoja.getCell(fila, columna).protection = { locked: false };
    }
  }
}
