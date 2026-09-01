import type { consultarEvaluacion } from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { obtenerEtiquetaMorbilidad } from "@/modulos/evaluaciones-medicas/constantes/morbilidades";
import {
  agregarPaginacionPdf,
  anchoUtilPdf,
  asegurarEspacioPdf,
  crearDocumentoPdf,
  dibujarCajaTextoPdf,
  dibujarEncabezadoPdfApracom,
  dibujarTituloSeccionPdf,
  finalizarPdf,
  recolectarPdf,
} from "@/servicios/documentos/pdf/pdf-comun";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

type Evaluacion = NonNullable<
  Awaited<ReturnType<typeof consultarEvaluacion>>
>;

export async function generarEvaluacionPdf(
  evaluacion: Evaluacion,
): Promise<Buffer> {
  const numero = evaluacion.numeroEvaluacion ?? evaluacion.id;
  const documento = crearDocumentoPdf({
    titulo: `Evaluación médica ${numero}`,
    autor: evaluacion.profesionalNombreHistorico,
  });
  const resultado = recolectarPdf(documento);
  const encabezado = (continuacion = false) =>
    dibujarEncabezadoPdfApracom(documento, {
      titulo: continuacion
        ? "EVALUACIÓN MÉDICA - CONTINUACIÓN"
        : "EVALUACIÓN MÉDICA",
      subtitulo: `N.º ${numero} · ${formatearFecha(evaluacion.fechaAtencion)}`,
      metadatos: [
        `${evaluacion.empresaNombreHistorico} · ${evaluacion.departamentoNombreHistorico}`,
      ],
      compacto: continuacion,
    });
  encabezado();

  const x = documento.page.margins.left;
  const ancho = anchoUtilPdf(documento);
  const separacion = 6;
  const mitad = (ancho - separacion) / 2;

  dibujarTituloSeccionPdf(documento, "1. DATOS DEL TRABAJADOR");
  const datos = [
    [
      ["Trabajador", evaluacion.trabajadorNombreHistorico],
      ["Documento", evaluacion.trabajadorDocumentoHistorico],
    ],
    [
      ["Empresa", evaluacion.empresaNombreHistorico],
      ["Departamento", evaluacion.departamentoNombreHistorico],
    ],
    [
      ["Profesional", evaluacion.profesionalNombreHistorico],
      ["Estado", evaluacion.estado],
    ],
  ] as const;
  for (const fila of datos) {
    const y = documento.y;
    const alto1 = dibujarCajaTextoPdf(documento, {
      titulo: fila[0][0],
      texto: fila[0][1],
      x,
      y,
      ancho: mitad,
      alto: 34,
    });
    const alto2 = dibujarCajaTextoPdf(documento, {
      titulo: fila[1][0],
      texto: fila[1][1],
      x: x + mitad + separacion,
      y,
      ancho: mitad,
      alto: 34,
    });
    documento.y = y + Math.max(alto1, alto2) + 5;
  }

  const seccionTexto = (
    titulo: string,
    valor: string | null,
    minimo = 42,
  ) => {
    const texto = valor?.trim() || "Sin información registrada.";
    const altoTexto =
      documento
        .font("Helvetica")
        .fontSize(8.5)
        .heightOfString(texto, { width: ancho - 10, lineGap: 1 }) + 12;
    asegurarEspacioPdf(documento, 24 + Math.max(minimo, altoTexto), () =>
      encabezado(true),
    );
    dibujarTituloSeccionPdf(documento, titulo);
    const alto = dibujarCajaTextoPdf(documento, {
      texto,
      x,
      y: documento.y,
      ancho,
      alto: Math.max(minimo, altoTexto),
    });
    documento.y += alto + 6;
  };

  seccionTexto("2. MORBILIDAD", obtenerEtiquetaMorbilidad(evaluacion.morbilidad));
  seccionTexto("3. MOTIVO DE CONSULTA", evaluacion.motivoConsulta);
  seccionTexto(
    "4. SÍNTOMAS Y EVOLUCIÓN",
    [evaluacion.sintomas, evaluacion.tiempoEvolucion]
      .filter(Boolean)
      .join("\n"),
  );
  seccionTexto(
    "5. ANTECEDENTES RELEVANTES",
    evaluacion.antecedentesRelevantes,
  );
  seccionTexto("6. EXAMEN FÍSICO", evaluacion.examenFisico, 54);
  seccionTexto(
    "7. OBSERVACIONES CLÍNICAS",
    evaluacion.observacionesClinicas,
  );

  asegurarEspacioPdf(documento, 70, () => encabezado(true));
  dibujarTituloSeccionPdf(documento, "8. DIAGNÓSTICOS CIE-10");
  if (evaluacion.diagnosticos.length === 0) {
    const alto = dibujarCajaTextoPdf(documento, {
      texto: "Sin diagnósticos registrados.",
      x,
      y: documento.y,
      ancho,
      alto: 32,
    });
    documento.y += alto + 6;
  } else {
    const columnas = [70, ancho - 160, 90];
    let y = documento.y;
    ["CÓDIGO", "DESCRIPCIÓN OFICIAL", "TIPO"].forEach(
      (titulo, indice) => {
        const cx =
          x + columnas.slice(0, indice).reduce((suma, valor) => suma + valor, 0);
        dibujarCajaTextoPdf(documento, {
          texto: titulo,
          x: cx,
          y,
          ancho: columnas[indice],
          alto: 25,
          negrita: true,
          fondo: "#e5e7eb",
          alineacion: "center",
          tamano: 7.5,
        });
      },
    );
    y += 25;
    documento.y = y;
    for (const diagnostico of evaluacion.diagnosticos) {
      const altoDescripcion =
        documento
          .font("Helvetica")
          .fontSize(8)
          .heightOfString(diagnostico.enfermedad.descripcion, {
            width: columnas[1] - 10,
          }) + 10;
      const alto = Math.max(28, altoDescripcion);
      if (
        asegurarEspacioPdf(documento, alto + 4, () => {
          encabezado(true);
          dibujarTituloSeccionPdf(
            documento,
            "8. DIAGNÓSTICOS CIE-10 - CONTINUACIÓN",
          );
        })
      ) {
        y = documento.y;
      }
      const valores = [
        diagnostico.enfermedad.codigo,
        diagnostico.enfermedad.descripcion,
        diagnostico.def ? "DEFINITIVO" : "PRESUNTIVO",
      ];
      valores.forEach((valor, indice) => {
        const cx =
          x + columnas.slice(0, indice).reduce((suma, dato) => suma + dato, 0);
        dibujarCajaTextoPdf(documento, {
          texto: valor,
          x: cx,
          y,
          ancho: columnas[indice],
          alto,
          alineacion: indice === 1 ? "left" : "center",
          tamano: 8,
        });
      });
      y += alto;
      documento.y = y;
    }
    documento.y += 6;
  }

  asegurarEspacioPdf(documento, 65, () => encabezado(true));
  dibujarTituloSeccionPdf(documento, "9. TRATAMIENTO Y MEDICAMENTOS");
  seccionTexto("INDICACIONES", evaluacion.indicaciones, 36);
  if (evaluacion.medicamentos.length === 0) {
    seccionTexto("MEDICAMENTOS", "Sin medicamentos registrados.", 32);
  } else {
    for (const [indice, medicamento] of evaluacion.medicamentos.entries()) {
      const texto = [
        `${medicamento.medicamento.nombreGenerico} · ${medicamento.medicamento.presentacion}`,
        `Cantidad: ${medicamento.cantidad?.toString() ?? "—"}`,
        medicamento.indicaciones,
      ]
        .filter(Boolean)
        .join("\n");
      const alto =
        documento
          .font("Helvetica")
          .fontSize(8.5)
          .heightOfString(texto, { width: ancho - 10, lineGap: 1 }) + 25;
      asegurarEspacioPdf(documento, alto, () => encabezado(true));
      const dibujado = dibujarCajaTextoPdf(documento, {
        titulo: `Medicamento ${indice + 1}`,
        texto,
        x,
        y: documento.y,
        ancho,
        alto: Math.max(44, alto),
      });
      documento.y += dibujado + 5;
    }
  }
  seccionTexto("RECOMENDACIONES", evaluacion.recomendaciones, 38);

  asegurarEspacioPdf(documento, 78, () => encabezado(true));
  dibujarTituloSeccionPdf(documento, "10. FIRMA DEL PROFESIONAL");
  const altoFirma = dibujarCajaTextoPdf(documento, {
    texto: [
      evaluacion.profesionalNombreHistorico ?? "Profesional no registrado",
      `Fecha de emisión: ${formatearFecha(evaluacion.fechaAtencion)}`,
      "Firma: ______________________________",
    ].join("\n"),
    x,
    y: documento.y,
    ancho,
    alto: 60,
  });
  documento.y += altoFirma;

  if (evaluacion.estado === "ANULADA") {
    documento
      .save()
      .font("Helvetica-Bold")
      .fontSize(42)
      .fillColor("#b91c1c")
      .opacity(0.16)
      .text("ANULADA", 0, documento.page.height / 2, {
        align: "center",
        width: documento.page.width,
      })
      .restore();
  }

  agregarPaginacionPdf(documento, `Evaluación ${numero}`);
  return finalizarPdf(documento, resultado);
}
