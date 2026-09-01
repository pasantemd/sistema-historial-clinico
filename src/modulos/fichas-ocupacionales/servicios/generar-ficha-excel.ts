import ExcelJS from "exceljs";

import { APTITUDES_MEDICAS } from "@/modulos/fichas-ocupacionales/constantes";
import {
  aplicarBorde,
  aplicarCampo,
  aplicarEncabezado,
  aplicarTitulo,
  aplicarTituloSeccion,
  configurarHojaCertificado,
} from "@/modulos/fichas-ocupacionales/servicios/estilos-ficha-excel";
import type { CertificadoFicha } from "@/modulos/fichas-ocupacionales/tipos";

const COMBINACIONES = [
  "A1:AL1", "A2:AL2", "A3:K3", "L3:Q3", "R3:U3", "V3:AB3", "AC3:AH3", "AI3:AL3",
  "A4:K4", "L4:Q4", "R4:U4", "V4:AB4", "AC4:AH4", "AI4:AL4",
  "A5:I5", "J5:P5", "Q5:W5", "X5:AC5", "AD5:AF5", "AG5:AL5",
  "A6:I6", "J6:P6", "Q6:W6", "X6:AC6", "AD6:AF6", "AG6:AL6",
  "A8:AL8", "B10:J10", "K10:L10", "K11:L11", "M11:N11", "O11:P11",
  "B12:H12", "L12:M12", "P12:T12", "U12:V12", "W12:AB12", "AC12:AD12", "AF12:AH12", "AI12:AJ12", "AK12:AL12",
  "A15:AL15", "A16:AL16", "A17:H17", "J17:R17", "S17:T17", "U17:AB17", "AC17:AD17", "AE17:AJ17", "AK17:AL17",
  "A18:AL18", "A19:AL19", "A20:AL20", "A21:AL21",
  "A23:AL23", "A24:AL24", "A25:AL25", "A26:AL26",
  "A28:AL29", "A30:AL30", "A31:AL31",
  "A32:AB32", "AD32:AL32", "A33:D33", "E33:K33", "L33:N33", "O33:S33", "T33:V33", "W33:AB33", "AD33:AL33",
] as const;

const TITULOS_SECCION = ["A2", "A8", "A15", "A23", "A32", "AD32"] as const;

function etiquetaAptitud(valor: string | null): string {
  if (!valor) return "";
  return APTITUDES_MEDICAS.find((item) => item.valor === valor)?.etiqueta?.toUpperCase() ?? valor;
}

function escribir(hoja: ExcelJS.Worksheet, celda: string, valor: string): void {
  hoja.getCell(celda).value = valor;
}

function marcarCasilla(hoja: ExcelJS.Worksheet, celda: string, seleccionada: boolean): void {
  const destino = hoja.getCell(celda);
  destino.value = seleccionada ? "X" : null;
  aplicarCampo(destino);
  destino.font = { name: "Arial", size: 9, bold: seleccionada };
  destino.alignment = { horizontal: "center", vertical: "middle" };
}

function recomendaciones(ficha: CertificadoFicha): string[] {
  const valores = ficha.recomendaciones.map((item) => item.descripcion.trim()).filter(Boolean);
  return valores.length > 0
    ? valores
    : ["SEGUIR NORMATIVA DE SEGURIDAD Y SALUD DE LA EMPRESA"];
}

function configurarEstructura(hoja: ExcelJS.Worksheet): void {
  configurarHojaCertificado(hoja);
  COMBINACIONES.forEach((rango) => hoja.mergeCells(rango));
  hoja.getCell("A1").value = "CERTIFICADO - EVALUACIÓN MÉDICA OCUPACIONAL";
  aplicarTitulo(hoja.getCell("A1"));

  const secciones: Record<(typeof TITULOS_SECCION)[number], string> = {
    A2: "A. DATOS DEL ESTABLECIMIENTO - DATOS DEL USUARIO",
    A8: "B. DATOS GENERALES",
    A15: "C. APTITUD MÉDICA PARA EL TRABAJO",
    A23: "D. RECOMENDACIONES/OBSERVACIONES",
    A32: "E. DATOS DEL PROFESIONAL",
    AD32: "F. FIRMA DEL TRABAJADOR",
  };
  TITULOS_SECCION.forEach((celda) => {
    hoja.getCell(celda).value = secciones[celda];
    aplicarTituloSeccion(hoja.getCell(celda));
  });

  const encabezados: Record<string, string> = {
    A3: "INSTITUCIÓN DEL SISTEMA",
    L3: "RUC",
    R3: "CIIU",
    V3: "ESTABLECIMIENTO / CENTRO DE TRABAJO",
    AC3: "NÚMERO DE FORMULARIO",
    AI3: "NÚMERO DE ARCHIVO",
    A5: "PRIMER APELLIDO",
    J5: "SEGUNDO APELLIDO",
    Q5: "PRIMER NOMBRE",
    X5: "SEGUNDO NOMBRE",
    AD5: "SEXO",
    AG5: "PUESTO DE TRABAJO (CIUO)",
    A17: "APTO",
    J17: "APTO EN OBSERVACIÓN",
    U17: "APTO CON LIMITACIONES",
    AE17: "NO APTO",
    A33: "NOMBRE Y APELLIDO",
    L33: "CÓDIGO MÉDICO",
    T33: "FIRMA Y SELLO",
  };
  Object.entries(encabezados).forEach(([celda, texto]) => {
    hoja.getCell(celda).value = texto;
    aplicarEncabezado(hoja.getCell(celda));
  });

  ["A4", "L4", "R4", "V4", "AC4", "AI4", "A6", "J6", "Q6", "X6", "AD6", "AG6", "E33", "O33", "W33", "AD33"].forEach((celda) => aplicarCampo(hoja.getCell(celda)));
  ["A19", "A20", "A21", "A24", "A25", "A26", "A28", "A30"].forEach((celda) => aplicarCampo(hoja.getCell(celda), "left"));

  escribir(hoja, "B10", "FECHA DE EMISIÓN:");
  escribir(hoja, "K11", "aaaa");
  escribir(hoja, "M11", "mm");
  escribir(hoja, "O11", "dd");
  escribir(hoja, "B12", "EVALUACIÓN:");
  escribir(hoja, "I12", "INGRESO");
  escribir(hoja, "P12", "PERIÓDICO");
  escribir(hoja, "W12", "REINTEGRO");
  escribir(hoja, "AF12", "RETIRO");
  escribir(hoja, "A16", "Después de la valoración médica ocupacional se certifica que la persona en mención, es calificada como:");
  escribir(hoja, "A18", "DETALLE DE OBSERVACIONES:");
  escribir(hoja, "A28", "Con este documento certifico que el trabajador se ha sometido a la evaluación médica requerida para (el ingreso / la ejecución / el reingreso y retiro) al puesto laboral y se le ha informado sobre los riesgos relacionados con el trabajo, emitiendo recomendaciones relacionadas con su estado de salud.");
  escribir(hoja, "A30", "La presente certificación se expide con base en el formulario de Evaluación Ocupacional, el cual tiene carácter de confidencial.");

  ["B10", "B12", "I12", "P12", "W12", "AF12", "A16", "A18"].forEach((celda) => {
    hoja.getCell(celda).font = { name: "Arial", size: 9 };
    hoja.getCell(celda).alignment = { vertical: "middle", wrapText: true };
    hoja.getCell(celda).protection = { locked: false };
  });
  hoja.getCell("I12").alignment = { vertical: "middle", wrapText: false };
  ["K10", "M10", "N10", "O10", "P10", "K11", "M11", "O11"].forEach((celda) => aplicarCampo(hoja.getCell(celda)));
  ["A1:AL1", "A2:AL6", "A8:AL13", "A15:AL21", "A23:AL26", "A32:AB33", "AD32:AL33"].forEach((rango) => aplicarBorde(hoja, rango, "medium"));
}

function completarCertificado(hoja: ExcelJS.Worksheet, ficha: CertificadoFicha): void {
  escribir(hoja, "A4", ficha.institucionSistema || "PRIVADO");
  escribir(hoja, "L4", ficha.ruc || ficha.empresa.ruc || "");
  escribir(hoja, "R4", ficha.ciiu || ficha.empresa.actividadEconomicaCodigo || "");
  escribir(hoja, "V4", ficha.establecimiento || ficha.empresa.razonSocial || "");
  escribir(hoja, "AC4", ficha.numeroFormulario || "");
  escribir(hoja, "AI4", ficha.numeroArchivo || "");
  escribir(hoja, "A6", ficha.primerApellido || ficha.trabajador.apellidos.split(/\s+/)[0] || "");
  escribir(hoja, "J6", ficha.segundoApellido || ficha.trabajador.apellidos.split(/\s+/).slice(1).join(" "));
  escribir(hoja, "Q6", ficha.primerNombre || ficha.trabajador.nombres.split(/\s+/)[0] || "");
  escribir(hoja, "X6", ficha.segundoNombre || ficha.trabajador.nombres.split(/\s+/).slice(1).join(" "));
  escribir(hoja, "AD6", ficha.trabajador.sexo || "");
  escribir(hoja, "AG6", ficha.puestoTrabajoCIUO || "");

  const [anio = "", mes = "", dia = ""] = ficha.fechaAtencion.split("-");
  escribir(hoja, "K10", anio);
  escribir(hoja, "M10", mes[0] ?? "");
  escribir(hoja, "N10", mes[1] ?? "");
  escribir(hoja, "O10", dia[0] ?? "");
  escribir(hoja, "P10", dia[1] ?? "");

  marcarCasilla(hoja, "L12", ficha.tipoEvaluacion === "INGRESO");
  marcarCasilla(hoja, "U12", ficha.tipoEvaluacion === "PERIODICA");
  marcarCasilla(hoja, "AC12", ficha.tipoEvaluacion === "REINGRESO");
  marcarCasilla(hoja, "AI12", ficha.tipoEvaluacion === "RETIRO");

  const aptitud = etiquetaAptitud(ficha.aptitudMedica);
  marcarCasilla(hoja, "I17", aptitud === "APTO");
  marcarCasilla(hoja, "S17", aptitud === "APTO EN OBSERVACIÓN");
  marcarCasilla(hoja, "AC17", aptitud === "APTO CON LIMITACIONES");
  marcarCasilla(hoja, "AK17", aptitud === "NO APTO");
  escribir(hoja, "A19", ficha.observacionesAptitud || "");

  const listaRecomendaciones = recomendaciones(ficha);
  escribir(hoja, "A24", listaRecomendaciones.join("\n"));
  hoja.getRow(24).height = Math.max(18, Math.min(42, listaRecomendaciones.length * 12));
  escribir(hoja, "E33", ficha.profesionalNombres || "");
  escribir(hoja, "O33", ficha.profesionalCodigoMedico || "");
}

export async function validarFichaExcel(contenido: Buffer): Promise<void> {
  if (contenido.byteLength < 4 || contenido.subarray(0, 2).toString("ascii") !== "PK") {
    throw new Error("El exportador no produjo un archivo XLSX real.");
  }
  const libro = new ExcelJS.Workbook();
  const datos = contenido.buffer.slice(
    contenido.byteOffset,
    contenido.byteOffset + contenido.byteLength,
  ) as Parameters<typeof libro.xlsx.load>[0];
  await libro.xlsx.load(datos);
  const hoja = libro.getWorksheet("CERTIFICADO");
  if (
    !hoja
    || hoja.rowCount < 33
    || hoja.columnCount < 38
    || hoja.getColumn(38).width === undefined
  ) {
    throw new Error("El XLSX no contiene la estructura completa del certificado.");
  }
  if ((hoja.model.merges?.length ?? 0) < 60) {
    throw new Error("El XLSX perdió las celdas combinadas del certificado.");
  }
  if (!hoja.getCell("A1").fill || !hoja.getCell("A3").border) {
    throw new Error("El XLSX perdió los estilos institucionales.");
  }
}

export async function generarFichaExcel(ficha: CertificadoFicha): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Sistema de Historial Clínico Ocupacional";
  libro.lastModifiedBy = "Sistema de Historial Clínico Ocupacional";
  libro.created = new Date();
  libro.modified = new Date();
  const hoja = libro.addWorksheet("CERTIFICADO");
  configurarEstructura(hoja);
  completarCertificado(hoja, ficha);
  const contenido = Buffer.from(await libro.xlsx.writeBuffer());
  await validarFichaExcel(contenido);
  return contenido;
}
