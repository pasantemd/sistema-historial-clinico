import { APTITUDES_MEDICAS } from "@/modulos/fichas-ocupacionales/constantes";
import type { CertificadoFicha } from "@/modulos/fichas-ocupacionales/tipos";
import {
  PUNTOS_POR_MILIMETRO,
  anchoUtilPdf,
  crearDocumentoPdf,
  finalizarPdf,
  recolectarPdf,
} from "@/servicios/documentos/pdf/pdf-comun";

const COLOR_BORDE = "#7f7f7f";
const COLOR_CABECERA = "#d9daf8";
const COLOR_CELDA = "#c9f7cc";
const COLOR_TEXTO = "#000000";

interface OpcionesCelda {
  fondo?: string;
  negrita?: boolean;
  centrado?: boolean;
  tamano?: number;
  padding?: number;
  alineacionVertical?: "top" | "center" | "bottom";
}

const ETIQUETAS_EVALUACION: Record<string, string> = {
  INGRESO: "INGRESO",
  PERIODICA: "PERIÓDICO",
  REINGRESO: "REINTEGRO",
  RETIRO: "RETIRO",
};

function etiquetaAptitud(valor: string | null): string {
  if (!valor) return "";
  return APTITUDES_MEDICAS.find((item) => item.valor === valor)?.etiqueta?.toUpperCase() ?? valor;
}

function primeraParte(valor: string, indice: number): string {
  return valor.trim().split(/\s+/)[indice] ?? "";
}

function dibujarCelda(
  documento: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  texto: string,
  opciones: OpcionesCelda = {},
): void {
  if (opciones.fondo) {
    documento.save().fillColor(opciones.fondo).rect(x, y, ancho, alto).fill().restore();
  }

  documento
    .save()
    .rect(x, y, ancho, alto)
    .lineWidth(0.65)
    .strokeColor(COLOR_BORDE)
    .stroke()
    .restore();

  if (!texto) return;

  const padding = opciones.padding ?? 2;
  const tamano = opciones.tamano ?? 7;
  const anchoTexto = ancho - padding * 2;
  const altoTexto = documento
    .font(opciones.negrita ? "Helvetica-Bold" : "Helvetica")
    .fontSize(tamano)
    .heightOfString(texto, { width: anchoTexto, lineGap: 0 });
  let textoY = y + padding;

  if (opciones.alineacionVertical === "center") {
    textoY = y + Math.max(padding, (alto - altoTexto) / 2);
  } else if (opciones.alineacionVertical === "bottom") {
    textoY = y + Math.max(padding, alto - altoTexto - padding);
  }

  documento
    .font(opciones.negrita ? "Helvetica-Bold" : "Helvetica")
    .fontSize(tamano)
    .fillColor(COLOR_TEXTO)
    .text(texto, x + padding, textoY, {
      width: anchoTexto,
      height: alto - padding * 2,
      align: opciones.centrado ? "center" : "left",
      lineGap: 0,
    });
}

function dibujarFila(
  documento: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  proporciones: number[],
  valores: string[],
  alto: number,
  opciones: OpcionesCelda = {},
): void {
  let cursorX = x;
  proporciones.forEach((proporcion, indice) => {
    const anchoCelda = ancho * proporcion;
    dibujarCelda(documento, cursorX, y, anchoCelda, alto, valores[indice] ?? "", opciones);
    cursorX += anchoCelda;
  });
}

function dibujarTitulo(
  documento: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  texto: string,
  centrado = false,
): void {
  dibujarCelda(documento, x, y, ancho, 15, texto, {
    fondo: COLOR_CABECERA,
    negrita: true,
    centrado,
    tamano: centrado ? 10 : 8.8,
    padding: 2,
    alineacionVertical: "center",
  });
}

function dibujarCasilla(
  documento: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  marcada: boolean,
): void {
  dibujarCelda(documento, x, y, ancho, alto, marcada ? "X" : "", {
    negrita: true,
    centrado: true,
    tamano: 7,
    alineacionVertical: "center",
  });
}

function dibujarLineas(
  documento: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  cantidad: number,
): void {
  const separacion = alto / cantidad;
  documento.save().lineWidth(0.55).strokeColor(COLOR_BORDE);
  for (let indice = 1; indice <= cantidad; indice += 1) {
    const lineaY = y + separacion * indice;
    documento.moveTo(x, lineaY).lineTo(x + ancho, lineaY).stroke();
  }
  documento.restore();
}

export async function generarCertificadoPdf(ficha: CertificadoFicha): Promise<Buffer> {
  const margen = 6 * PUNTOS_POR_MILIMETRO;
  const documento = crearDocumentoPdf({
    titulo: "Certificado - Evaluación médica ocupacional",
    autor: ficha.profesionalNombres,
    orientacion: "landscape",
    margen,
    paginasEnBuffer: false,
  });
  const resultado = recolectarPdf(documento);
  const x = documento.page.margins.left;
  const ancho = anchoUtilPdf(documento);
  let y = documento.page.margins.top;

  dibujarTitulo(documento, x, y, ancho, "CERTIFICADO  -  EVALUACIÓN MÉDICA OCUPACIONAL", true);
  y += 15;

  dibujarTitulo(documento, x, y, ancho, "A. DATOS DEL ESTABLECIMIENTO - DATOS DEL USUARIO");
  y += 15;

  const columnasEstablecimiento = [0.295, 0.165, 0.1, 0.16, 0.165, 0.115];
  dibujarFila(
    documento,
    x,
    y,
    ancho,
    columnasEstablecimiento,
    [
      "INSTITUCIÓN DEL SISTEMA",
      "RUC",
      "CIIU",
      "ESTABLECIMIENTO\n(CENTRO DE TRABAJO)",
      "NÚMERO DE FORMULARIO",
      "NÚMERO DE ARCHIVO",
    ],
    28,
    { fondo: COLOR_CELDA, centrado: true, tamano: 7, alineacionVertical: "center" },
  );
  y += 28;
  dibujarFila(
    documento,
    x,
    y,
    ancho,
    columnasEstablecimiento,
    [
      ficha.institucionSistema || "PRIVADO",
      ficha.ruc || ficha.empresa.ruc,
      ficha.ciiu || ficha.empresa.actividadEconomicaCodigo || "",
      ficha.establecimiento || ficha.empresa.razonSocial,
      ficha.numeroFormulario || "",
      ficha.numeroArchivo || "",
    ],
    16,
    { centrado: true, tamano: 6.8, alineacionVertical: "center" },
  );
  y += 16;

  const columnasPersona = [0.24, 0.195, 0.168, 0.137, 0.06, 0.2];
  dibujarFila(
    documento,
    x,
    y,
    ancho,
    columnasPersona,
    ["PRIMER APELLIDO", "SEGUNDO APELLIDO", "PRIMER NOMBRE", "SEGUNDO NOMBRE", "SEXO", "PUESTO DE TRABAJO (CIUO)"],
    14,
    { fondo: COLOR_CELDA, centrado: true, tamano: 6.7, alineacionVertical: "center" },
  );
  y += 14;
  dibujarFila(
    documento,
    x,
    y,
    ancho,
    columnasPersona,
    [
      ficha.primerApellido || primeraParte(ficha.trabajador.apellidos, 0),
      ficha.segundoApellido || primeraParte(ficha.trabajador.apellidos, 1),
      ficha.primerNombre || primeraParte(ficha.trabajador.nombres, 0),
      ficha.segundoNombre || primeraParte(ficha.trabajador.nombres, 1),
      ficha.trabajador.sexo,
      ficha.puestoTrabajoCIUO || "",
    ],
    16,
    { centrado: true, tamano: 6.8, alineacionVertical: "center" },
  );
  y += 16;

  y += 11;
  documento.save().rect(x, y - 3, ancho, 3).fillColor(COLOR_BORDE).fill().restore();
  dibujarTitulo(documento, x, y, ancho, "B. DATOS GENERALES");
  y += 15;
  dibujarCelda(documento, x, y, ancho, 61, "");

  const [anio = "", mes = "", dia = ""] = ficha.fechaAtencion.split("-");
  documento.font("Helvetica").fontSize(7.6).fillColor(COLOR_TEXTO).text("FECHA DE EMISIÓN:", x + 24, y + 14);
  const fechaX = x + 198;
  const fechaY = y + 9;
  const anchosFecha = [46, 23, 23];
  let cursorFecha = fechaX;
  [anio, mes, dia].forEach((valor, indice) => {
    dibujarCelda(documento, cursorFecha, fechaY, anchosFecha[indice], 14, valor, {
      centrado: true,
      tamano: 6.8,
      alineacionVertical: "center",
    });
    documento.font("Helvetica").fontSize(4.8).text(["aaaa", "mm", "dd"][indice], cursorFecha, fechaY + 16, {
      width: anchosFecha[indice],
      align: "center",
    });
    cursorFecha += anchosFecha[indice];
  });

  documento.font("Helvetica").fontSize(7.6).text("EVALUACIÓN:", x + 24, y + 41);
  const tipoEvaluacion = ETIQUETAS_EVALUACION[ficha.tipoEvaluacion] ?? ficha.tipoEvaluacion;
  const tipos = ["INGRESO", "PERIÓDICO", "REINTEGRO", "RETIRO"];
  const inicioTipos = x + 160;
  const anchoTipo = (ancho - 175) / tipos.length;
  tipos.forEach((tipo, indice) => {
    const tipoX = inicioTipos + anchoTipo * indice;
    documento.font("Helvetica").fontSize(7.5).text(tipo, tipoX, y + 40, {
      width: anchoTipo - 35,
      align: "center",
    });
    dibujarCasilla(documento, tipoX + anchoTipo - 35, y + 35, 31, 14, tipo === tipoEvaluacion);
  });
  y += 61;

  y += 11;
  documento.save().rect(x, y - 3, ancho, 3).fillColor(COLOR_BORDE).fill().restore();
  dibujarTitulo(documento, x, y, ancho, "C. APTITUD MÉDICA PARA EL TRABAJO");
  y += 15;
  dibujarCelda(
    documento,
    x,
    y,
    ancho,
    15,
    "Después de la valoración médica ocupacional se certifica que la persona en mención, es calificada como:",
    { tamano: 7.4, alineacionVertical: "center" },
  );
  y += 15;

  const aptitud = etiquetaAptitud(ficha.aptitudMedica);
  const opcionesAptitud = ["APTO", "APTO EN OBSERVACIÓN", "APTO CON LIMITACIONES", "NO APTO"];
  const proporcionesAptitud = [0.215, 0.275, 0.25, 0.26];
  let cursorAptitud = x;
  opcionesAptitud.forEach((opcion, indice) => {
    const anchoOpcion = ancho * proporcionesAptitud[indice];
    dibujarCelda(documento, cursorAptitud, y, anchoOpcion - 23, 15, opcion, {
      fondo: COLOR_CELDA,
      centrado: true,
      tamano: 7,
      alineacionVertical: "center",
    });
    dibujarCasilla(documento, cursorAptitud + anchoOpcion - 23, y, 23, 15, opcion === aptitud);
    cursorAptitud += anchoOpcion;
  });
  y += 15;
  dibujarCelda(documento, x, y, ancho, 14, "DETALLE DE OBSERVACIONES:", {
    tamano: 6.8,
    alineacionVertical: "center",
  });
  y += 14;
  dibujarCelda(documento, x, y, ancho, 47, "");
  dibujarLineas(documento, x, y, ancho, 47, 4);
  if (ficha.observacionesAptitud) {
    documento.font("Helvetica").fontSize(7).fillColor(COLOR_TEXTO).text(ficha.observacionesAptitud, x + 3, y + 3, {
      width: ancho - 6,
      height: 41,
      lineGap: 4,
    });
  }
  y += 47;

  y += 11;
  documento.save().rect(x, y - 3, ancho, 3).fillColor(COLOR_BORDE).fill().restore();
  dibujarTitulo(documento, x, y, ancho, "D. RECOMENDACIONES/OBSERVACIONES");
  y += 15;
  const recomendaciones = ficha.recomendaciones
    .map((item) => item.descripcion.trim())
    .filter(Boolean)
    .join("\n");
  dibujarCelda(
    documento,
    x,
    y,
    ancho,
    42,
    recomendaciones || "SEGUIR NORMATIVA DE SEGURIDAD Y SALUD DE LA EMPRESA",
    {
      negrita: !recomendaciones,
      centrado: !recomendaciones,
      tamano: 7.2,
      alineacionVertical: recomendaciones ? "top" : "center",
    },
  );
  dibujarLineas(documento, x, y, ancho, 42, 3);
  y += 42;

  y += 10;
  dibujarCelda(
    documento,
    x,
    y,
    ancho,
    29,
    "Con este documento certifico que el trabajador se ha sometido a la evaluación médica requerida para (el ingreso /la ejecución/ el reingreso y retiro) al puesto laboral y se le ha informado sobre los riesgos relacionados con el trabajo emitiendo recomendaciones relacionadas con su estado de salud.",
    { fondo: COLOR_CELDA, negrita: true, tamano: 7, alineacionVertical: "center" },
  );
  y += 29;
  documento
    .font("Helvetica")
    .fontSize(6.7)
    .fillColor(COLOR_TEXTO)
    .text(
      "La presente certificación se expide con base en el formulario de Evaluación Ocupacional, el cual tiene carácter de confidencial.",
      x + 2,
      y + 4,
      { width: ancho - 4 },
    );
  y += 17;

  const separacionFirmas = 15;
  const anchoProfesional = (ancho - separacionFirmas) * 0.72;
  const anchoTrabajador = ancho - separacionFirmas - anchoProfesional;
  dibujarTitulo(documento, x, y, anchoProfesional, "E. DATOS DEL PROFESIONAL");
  dibujarTitulo(documento, x + anchoProfesional + separacionFirmas, y, anchoTrabajador, "F. FIRMA DEL TRABAJADOR");
  y += 15;

  const columnasProfesional = [0.17, 0.27, 0.14, 0.18, 0.12, 0.12];
  dibujarFila(
    documento,
    x,
    y,
    anchoProfesional,
    columnasProfesional,
    [
      "NOMBRE Y APELLIDO",
      ficha.profesionalNombres || "",
      "CÓDIGO MÉDICO",
      ficha.profesionalCodigoMedico || "",
      "FIRMA Y\nSELLO",
      "",
    ],
    42,
    { tamano: 6.2, alineacionVertical: "center" },
  );
  dibujarCelda(documento, x, y, anchoProfesional * columnasProfesional[0], 42, "NOMBRE Y APELLIDO", {
    fondo: COLOR_CELDA,
    tamano: 6.2,
    alineacionVertical: "center",
  });
  const xCodigo = x + anchoProfesional * (columnasProfesional[0] + columnasProfesional[1]);
  dibujarCelda(documento, xCodigo, y, anchoProfesional * columnasProfesional[2], 42, "CÓDIGO MÉDICO", {
    fondo: COLOR_CELDA,
    tamano: 6.2,
    alineacionVertical: "center",
  });
  const xFirma = xCodigo + anchoProfesional * (columnasProfesional[2] + columnasProfesional[3]);
  dibujarCelda(documento, xFirma, y, anchoProfesional * columnasProfesional[4], 42, "FIRMA Y\nSELLO", {
    fondo: COLOR_CELDA,
    centrado: true,
    tamano: 7.4,
    alineacionVertical: "center",
  });
  dibujarCelda(documento, x + anchoProfesional + separacionFirmas, y, anchoTrabajador, 42, "");

  return finalizarPdf(documento, resultado);
}
