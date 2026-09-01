import type { DocumentoClinicoDetalleDto } from "@/modulos/documentos-clinicos/tipos";
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

export async function generarDocumentoClinicoPdf(
  documentoClinico: DocumentoClinicoDetalleDto,
): Promise<Buffer> {
  const documento = crearDocumentoPdf({
    titulo: `Documento clínico ${documentoClinico.numeroDocumento}`,
    autor: documentoClinico.profesional,
  });
  const resultado = recolectarPdf(documento);
  const encabezado = (continuacion = false) =>
    dibujarEncabezadoPdfApracom(documento, {
      titulo: continuacion
        ? "DOCUMENTO CLÍNICO - CONTINUACIÓN"
        : "DOCUMENTO CLÍNICO",
      subtitulo: `${documentoClinico.numeroDocumento} · ${formatearFecha(documentoClinico.fecha)}`,
      metadatos: [
        `${documentoClinico.empresa} · ${documentoClinico.departamento ?? "—"}`,
      ],
      compacto: continuacion,
    });
  encabezado();

  const x = documento.page.margins.left;
  const ancho = anchoUtilPdf(documento);
  const separacion = 6;
  const mitad = (ancho - separacion) / 2;
  dibujarTituloSeccionPdf(documento, "DATOS");
  const datos = [
    [
      ["Trabajador", documentoClinico.trabajador],
      ["Cédula", documentoClinico.documento],
    ],
    [
      [
        "Fecha de nacimiento",
        documentoClinico.fechaNacimiento
          ? formatearFecha(documentoClinico.fechaNacimiento)
          : "—",
      ],
      ["Fecha del documento", formatearFecha(documentoClinico.fecha)],
    ],
    [
      ["Empresa", documentoClinico.empresa],
      ["Departamento", documentoClinico.departamento ?? "—"],
    ],
    [
      ["Profesional", documentoClinico.profesional],
      ["Estado", documentoClinico.estado],
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

  const seccion = (titulo: string, valor: string | null) => {
    const texto = valor?.trim() || "—";
    const alto =
      documento
        .font("Helvetica")
        .fontSize(8.5)
        .heightOfString(texto, { width: ancho - 10, lineGap: 1 }) + 12;
    asegurarEspacioPdf(documento, Math.max(54, alto + 24), () =>
      encabezado(true),
    );
    dibujarTituloSeccionPdf(documento, titulo);
    const altoCaja = dibujarCajaTextoPdf(documento, {
      texto,
      x,
      y: documento.y,
      ancho,
      alto: Math.max(38, alto),
    });
    documento.y += altoCaja + 6;
  };

  seccion("MOTIVO DE CONSULTA", documentoClinico.motivoConsulta);
  seccion("EVOLUCIÓN", documentoClinico.evolucion);

  asegurarEspacioPdf(documento, 70, () => encabezado(true));
  dibujarTituloSeccionPdf(documento, "DIAGNÓSTICOS CIE-10");
  if (documentoClinico.diagnosticos.length === 0) {
    const alto = dibujarCajaTextoPdf(documento, {
      texto: "Sin diagnósticos registrados.",
      x,
      y: documento.y,
      ancho,
      alto: 34,
    });
    documento.y += alto + 6;
  } else {
    for (const diagnostico of documentoClinico.diagnosticos) {
      const texto = [
        `${diagnostico.codigo} · ${diagnostico.descripcion}`,
        `Tipo: ${diagnostico.tipo}`,
        diagnostico.observacion,
      ]
        .filter(Boolean)
        .join("\n");
      const alto =
        documento
          .font("Helvetica")
          .fontSize(8.5)
          .heightOfString(texto, { width: ancho - 10, lineGap: 1 }) + 18;
      asegurarEspacioPdf(documento, alto, () => encabezado(true));
      const dibujado = dibujarCajaTextoPdf(documento, {
        texto,
        x,
        y: documento.y,
        ancho,
        alto: Math.max(38, alto),
      });
      documento.y += dibujado + 5;
    }
  }

  asegurarEspacioPdf(documento, 70, () => encabezado(true));
  dibujarTituloSeccionPdf(documento, "TRATAMIENTO Y MEDICACIÓN");
  if (documentoClinico.tratamientos.length === 0) {
    const alto = dibujarCajaTextoPdf(documento, {
      texto: "Sin tratamientos registrados.",
      x,
      y: documento.y,
      ancho,
      alto: 34,
    });
    documento.y += alto + 6;
  } else {
    for (const tratamiento of documentoClinico.tratamientos) {
      const texto = [
        tratamiento.nombre,
        `Concentración: ${tratamiento.concentracion ?? "—"} · Dosis: ${tratamiento.dosis} · Cantidad: ${tratamiento.cantidad}`,
        `Frecuencia: ${tratamiento.frecuencia ?? "—"} · Duración: ${tratamiento.duracion ?? "—"} · Vía: ${tratamiento.via ?? "—"}`,
        tratamiento.indicaciones
          ? `Indicaciones: ${tratamiento.indicaciones}`
          : null,
        tratamiento.observaciones
          ? `Observaciones: ${tratamiento.observaciones}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
      const alto =
        documento
          .font("Helvetica")
          .fontSize(8.5)
          .heightOfString(texto, { width: ancho - 10, lineGap: 1 }) + 20;
      asegurarEspacioPdf(documento, alto, () => encabezado(true));
      const dibujado = dibujarCajaTextoPdf(documento, {
        texto,
        x,
        y: documento.y,
        ancho,
        alto: Math.max(50, alto),
      });
      documento.y += dibujado + 5;
    }
  }

  if (documentoClinico.observaciones) {
    seccion("OBSERVACIONES", documentoClinico.observaciones);
  }

  agregarPaginacionPdf(documento, documentoClinico.numeroDocumento);
  return finalizarPdf(documento, resultado);
}
