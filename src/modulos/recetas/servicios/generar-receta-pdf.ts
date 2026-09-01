import PDFDocument from "pdfkit";

import type { consultarRecetaRepositorio } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { construirIndicacionesReceta } from "@/modulos/recetas/servicios/construir-indicaciones-receta";
import { obtenerLogoBuffer } from "@/utilidades/marca/cargar-logo-apracom";

type RecetaPdf = NonNullable<
  Awaited<ReturnType<typeof consultarRecetaRepositorio>>
>;

const PUNTOS_POR_MILIMETRO = 72 / 25.4;
const MARGEN = 10 * PUNTOS_POR_MILIMETRO;
const SEPARACION_COLUMNAS = 14;
const ALTURA_PIE = 58;
const PROPORCION_DATOS_TRABAJADOR = 0.55;

export async function generarRecetaPdf(receta: RecetaPdf): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const documento = new PDFDocument({
      size: "A4",
      layout: "portrait",
      margin: MARGEN,
      bufferPages: true,
      info: {
        Title: `Receta médica ${receta.numeroReceta}`,
        Author: receta.profesionalNombreHistorico || "Sistema",
        Subject: "Receta médica",
      },
    });
    const partes: Buffer[] = [];
    documento.on("data", (parte: Buffer) => partes.push(parte));
    documento.on("error", reject);
    documento.on("end", () => resolve(Buffer.concat(partes)));

    const anchoPagina = documento.page.width;
    const altoPagina = documento.page.height;
    const anchoUtil = anchoPagina - MARGEN * 2;
    const anchoColumnas = anchoUtil - SEPARACION_COLUMNAS;
    const anchoDatosTrabajador = anchoColumnas * PROPORCION_DATOS_TRABAJADOR;
    const anchoDatosMedico = anchoColumnas - anchoDatosTrabajador;
    const xDerecha = MARGEN + anchoDatosTrabajador + SEPARACION_COLUMNAS;
    const edad = calcularEdad(
      receta.trabajadorNacimientoHistorico,
      receta.fechaEmision,
    );

    if (receta.estado === "ANULADA") {
      documento
        .save()
        .font("Helvetica-Bold")
        .fontSize(46)
        .fillColor("#b91c1c")
        .opacity(0.16)
        .text("ANULADA", 0, altoPagina / 2 - 24, {
          align: "center",
          width: anchoPagina,
          height: 56,
        })
        .restore();
    }

    const altoLogo = 66;
    try {
      documento.image(obtenerLogoBuffer(), MARGEN, MARGEN, {
        fit: [altoLogo, altoLogo],
        align: "center",
        valign: "center",
      });
    } catch {
      // El documento sigue siendo válido cuando el logotipo no está disponible.
    }

    const empresaX = MARGEN + altoLogo + 12;
    const empresaAncho = anchoUtil - altoLogo - 12;
    escribirTexto(documento, receta.empresaNombreHistorico ?? "Empresa no registrada", {
      x: empresaX,
      y: MARGEN,
      ancho: empresaAncho,
      alto: 25,
      fuente: "Helvetica-Bold",
      tamano: 12,
    });
    escribirTexto(documento, `RUC: ${receta.empresaRucHistorico ?? "—"}`, {
      x: empresaX,
      y: MARGEN + 27,
      ancho: empresaAncho,
      alto: 12,
      tamano: 8.5,
    });
    escribirTexto(
      documento,
      [receta.empresaDireccionHistorica, receta.empresaTelefonoHistorico
        ? `Teléfono: ${receta.empresaTelefonoHistorico}`
        : null]
        .filter(Boolean)
        .join(" · ") || " ",
      {
        x: empresaX,
        y: MARGEN + 41,
        ancho: empresaAncho,
        alto: 24,
        tamano: 8,
      },
    );

    const yEncabezado = MARGEN + altoLogo + 7;
    documento
      .lineWidth(1.4)
      .moveTo(MARGEN, yEncabezado)
      .lineTo(MARGEN + anchoUtil, yEncabezado)
      .stroke();

    const yNumero = yEncabezado + 8;
    escribirTexto(documento, `N.º receta: ${receta.numeroReceta}`, {
      x: MARGEN,
      y: yNumero,
      ancho: anchoDatosTrabajador,
      alto: 14,
      fuente: "Helvetica-Bold",
      tamano: 9,
    });
    escribirTexto(
      documento,
      `Fecha: ${receta.fechaEmision.toISOString().slice(0, 10)}`,
      {
        x: xDerecha,
        y: yNumero,
        ancho: anchoDatosMedico,
        alto: 14,
        fuente: "Helvetica-Bold",
        tamano: 9,
        alineacion: "right",
      },
    );

    const yDatos = yNumero + 21;
    escribirTexto(documento, "DATOS DEL TRABAJADOR", {
      x: MARGEN,
      y: yDatos,
      ancho: anchoDatosTrabajador,
      alto: 12,
      fuente: "Helvetica-Bold",
      tamano: 8,
    });
    escribirTexto(
      documento,
      [
        receta.trabajadorNombreHistorico,
        `Cédula: ${receta.trabajadorDocumentoHistorico}`,
        `Edad: ${edad ?? "—"} · Sexo: ${receta.trabajadorSexoHistorico ?? "—"}`,
      ].join("\n"),
      {
        x: MARGEN,
        y: yDatos + 13,
        ancho: anchoDatosTrabajador,
        alto: 48,
        tamano: 8,
        interlineado: 1,
      },
    );

    escribirTexto(documento, "DATOS DEL MÉDICO", {
      x: xDerecha,
      y: yDatos,
      ancho: anchoDatosMedico,
      alto: 12,
      fuente: "Helvetica-Bold",
      tamano: 8,
    });
    escribirTexto(
      documento,
      [
        receta.profesionalNombreHistorico,
        receta.profesionalEspecialidadHistorica,
      ]
        .filter(Boolean)
        .join("\n"),
      {
        x: xDerecha,
        y: yDatos + 13,
        ancho: anchoDatosMedico,
        alto: 48,
        tamano: 8,
        interlineado: 1,
      },
    );

    const yColumnas = yDatos + 66;
    const yContenido = yColumnas + 18;
    const yPieMaximo = altoPagina - MARGEN - ALTURA_PIE;
    const altoMaximoContenido = Math.max(80, yPieMaximo - yContenido - 14);
    const indicaciones = construirIndicacionesReceta(receta);
    const altoIndicaciones = indicaciones
      ? medirAltoIndicaciones(documento, indicaciones, anchoUtil)
      : 0;
    const altoTablaDisponible = Math.max(
      70,
      altoMaximoContenido - altoIndicaciones - (indicaciones ? 12 : 0),
    );

    escribirTexto(documento, "MEDICAMENTOS", {
      x: MARGEN,
      y: yColumnas,
      ancho: anchoUtil,
      alto: 12,
      fuente: "Helvetica-Bold",
      tamano: 9.5,
    });

    let cursorY = dibujarTablaMedicamentos(
      documento,
      receta.medicamentos,
      MARGEN,
      yContenido,
      anchoUtil,
      altoTablaDisponible,
    );
    if (indicaciones) {
      cursorY += 10;
      cursorY = dibujarIndicaciones(
        documento,
        indicaciones,
        MARGEN,
        cursorY,
        anchoUtil,
        altoIndicaciones,
      );
    }
        const anchoFirma = 180;
    const xFirma = MARGEN + (anchoUtil - anchoFirma) / 2;
    const yPie = Math.min(yPieMaximo, cursorY + 30);

    documento
      .lineWidth(1)
      .moveTo(xFirma, yPie)
      .lineTo(xFirma + anchoFirma, yPie)
      .stroke();
    escribirTexto(documento, "Firma del médico", {
      x: xFirma,
      y: yPie + 6,
      ancho: anchoFirma,
      alto: 12,
      fuente: "Helvetica-Bold",
      tamano: 8,
      alineacion: "center",
    });

    documento.end();
  });
}

interface OpcionesTexto {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  fuente?: "Helvetica" | "Helvetica-Bold";
  tamano?: number;
  color?: string;
  alineacion?: "left" | "center" | "right";
  interlineado?: number;
}

function escribirTexto(
  documento: PDFKit.PDFDocument,
  texto: string,
  opciones: OpcionesTexto,
) {
  documento
    .font(opciones.fuente ?? "Helvetica")
    .fontSize(opciones.tamano ?? 8)
    .fillColor(opciones.color ?? "black")
    .text(texto, opciones.x, opciones.y, {
      width: opciones.ancho,
      height: opciones.alto,
      align: opciones.alineacion ?? "left",
      lineGap: opciones.interlineado ?? 0,
    });
  documento.fillColor("black");
}

const ALTO_ENCABEZADO_TABLA = 20;
const ALTO_NOTA_OMITIDOS = 22;

function anchosColumnas(ancho: number): [number, number, number] {
  return [ancho * 0.5, ancho * 0.25, ancho * 0.25];
}

function medirAltoFila(
  documento: PDFKit.PDFDocument,
  medicamento: RecetaPdf["medicamentos"][number],
  anchos: [number, number, number],
  tamano: number,
): number {
  const textos = [
    medicamento.nombreMedicamentoHistorico,
    medicamento.dosis,
    medicamento.viaAdministracion,
  ];
  const altoTexto = Math.max(
    ...textos.map((texto, indice) =>
      documento
        .font(indice === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(tamano)
        .heightOfString(texto, { width: anchos[indice] - 8, lineGap: 0.5 }),
    ),
  );
  return Math.max(24, Math.ceil(altoTexto) + 10);
}

function elegirTamanoTabla(
  documento: PDFKit.PDFDocument,
  medicamentos: RecetaPdf["medicamentos"],
  anchos: [number, number, number],
  altoDisponible: number,
): number {
  for (const tamano of [8.5, 8, 7.5, 7]) {
    const alto = medicamentos.reduce(
      (total, medicamento) => total + medirAltoFila(documento, medicamento, anchos, tamano),
      ALTO_ENCABEZADO_TABLA,
    );
    if (alto <= altoDisponible) return tamano;
  }
  return 7;
}

function dibujarCelda(
  documento: PDFKit.PDFDocument,
  texto: string,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  opciones: { negrita?: boolean; tamano?: number } = {},
) {
  documento.rect(x, y, ancho, alto).stroke();
  escribirTexto(documento, texto, {
    x: x + 4,
    y: y + 5,
    ancho: ancho - 8,
    alto: alto - 9,
    fuente: opciones.negrita ? "Helvetica-Bold" : "Helvetica",
    tamano: opciones.tamano ?? 8,
    interlineado: 0.5,
  });
}

function dibujarTablaMedicamentos(
  documento: PDFKit.PDFDocument,
  medicamentos: RecetaPdf["medicamentos"],
  x: number,
  y: number,
  ancho: number,
  altoDisponible: number,
): number {
  const anchos = anchosColumnas(ancho);
  const encabezados = ["NOMBRE", "DOSIS", "VÍA"];
  let cursorX = x;
  encabezados.forEach((encabezado, indice) => {
    documento.rect(cursorX, y, anchos[indice], ALTO_ENCABEZADO_TABLA).fillAndStroke("#f3f4f6", "#000000");
    escribirTexto(documento, encabezado, {
      x: cursorX + 4,
      y: y + 6,
      ancho: anchos[indice] - 8,
      alto: 10,
      fuente: "Helvetica-Bold",
      tamano: 7.5,
    });
    cursorX += anchos[indice];
  });
  documento.fillColor("black");

  let cursorY = y + ALTO_ENCABEZADO_TABLA;
  if (medicamentos.length === 0) {
    dibujarCelda(documento, "Sin medicamentos.", x, cursorY, ancho, 26);
    return cursorY + 26;
  }

  const tamano = elegirTamanoTabla(documento, medicamentos, anchos, altoDisponible);
  const alturas = medicamentos.map((medicamento) => medirAltoFila(documento, medicamento, anchos, tamano));
  let visibles = 0;
  for (const alto of alturas) {
    if (cursorY + alto > y + altoDisponible) break;
    cursorY += alto;
    visibles += 1;
  }
  cursorY = y + ALTO_ENCABEZADO_TABLA;
  let omitidos = medicamentos.length - visibles;
  if (omitidos > 0 && cursorY + alturas.slice(0, visibles).reduce((a, b) => a + b, 0) + ALTO_NOTA_OMITIDOS > y + altoDisponible) {
    visibles = Math.max(0, visibles - 1);
    omitidos = medicamentos.length - visibles;
  }

  for (let indice = 0; indice < visibles; indice++) {
    const medicamento = medicamentos[indice];
    const alto = alturas[indice];
    dibujarCelda(documento, medicamento.nombreMedicamentoHistorico, x, cursorY, anchos[0], alto, { negrita: true, tamano });
    dibujarCelda(documento, medicamento.dosis, x + anchos[0], cursorY, anchos[1], alto, { tamano });
    dibujarCelda(documento, medicamento.viaAdministracion, x + anchos[0] + anchos[1], cursorY, anchos[2], alto, { tamano });
    cursorY += alto;
  }
  if (omitidos > 0) {
    dibujarCelda(
      documento,
      `… y ${omitidos} medicamento${omitidos === 1 ? "" : "s"} más; consulte el detalle completo en el sistema.`,
      x,
      cursorY,
      ancho,
      ALTO_NOTA_OMITIDOS,
      { tamano: 7 },
    );
    cursorY += ALTO_NOTA_OMITIDOS;
  }
  return cursorY;
}

function medirAltoIndicaciones(
  documento: PDFKit.PDFDocument,
  indicaciones: string,
  ancho: number,
): number {
  const altoTexto = documento
    .font("Helvetica")
    .fontSize(8)
    .heightOfString(indicaciones, { width: ancho - 8, lineGap: 1 });
  return Math.min(112, Math.max(50, Math.ceil(altoTexto) + 30));
}

function dibujarIndicaciones(
  documento: PDFKit.PDFDocument,
  indicaciones: string,
  x: number,
  y: number,
  ancho: number,
  alto: number,
): number {
  escribirTexto(documento, "INDICACIONES", {
    x,
    y,
    ancho,
    alto: 12,
    fuente: "Helvetica-Bold",
    tamano: 8.5,
  });
  const yRecuadro = y + 14;
  const altoRecuadro = alto - 14;
  documento.rect(x, yRecuadro, ancho, altoRecuadro).stroke();
  escribirTexto(documento, indicaciones, {
    x: x + 4,
    y: yRecuadro + 5,
    ancho: ancho - 8,
    alto: altoRecuadro - 9,
    tamano: 8,
    interlineado: 1,
  });
  return y + alto;
}

function calcularEdad(nacimiento: Date | null, referencia: Date): number | null {
  if (!nacimiento) return null;
  let edad = referencia.getUTCFullYear() - nacimiento.getUTCFullYear();
  if (
    referencia.getUTCMonth() < nacimiento.getUTCMonth() ||
    (referencia.getUTCMonth() === nacimiento.getUTCMonth() &&
      referencia.getUTCDate() < nacimiento.getUTCDate())
  ) {
    edad -= 1;
  }
  return edad >= 0 ? edad : null;
}

