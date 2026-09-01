import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  generarFichaExcel,
  validarFichaExcel,
} from "@/modulos/fichas-ocupacionales/servicios/generar-ficha-excel";
import { generarCertificadoPdf } from "@/modulos/fichas-ocupacionales/servicios/generar-certificado-pdf";
import type { CertificadoFicha } from "@/modulos/fichas-ocupacionales/tipos";

const ficha: CertificadoFicha = {
  id: "ficha-prueba",
  trabajadorId: "trabajador-prueba",
  registroDiarioId: null,
  estado: "FINALIZADA",
  tipoEvaluacion: "INGRESO",
  fechaAtencion: "2026-08-24",
  finalizadoEn: "2026-08-24T15:30:00.000Z",
  aptitudMedica: "APTO",
  observacionesAptitud: "Sin observaciones.",
  retiroObservacion: null,
  profesionalNombres: "SILVIO ROMERO HERNANDEZ",
  profesionalCodigoMedico: "0950316471",
  firmaTrabajadorAcepta: true,
  firmaTrabajadorFecha: "",
  empresa: {
    razonSocial: "EMPRESA DE PRUEBA S.A.",
    nombreComercial: "EMPRESA DE PRUEBA",
    ruc: "0999999999001",
    actividadEconomicaCodigo: "C20119801",
    actividadEconomicaDescripcion: "ACTIVIDAD DE PRUEBA",
    direccion: null,
    telefono: null,
    correo: null,
  },
  departamento: "OPERACIONES",
  trabajador: {
    nombres: "JUAN CARLOS",
    apellidos: "PEREZ GOMEZ",
    numeroDocumento: "0999999999",
    sexo: "MASCULINO",
    fechaNacimiento: "1990-01-01",
  },
  diagnosticos: [],
  recomendaciones: [{ descripcion: "SEGUIR NORMATIVA DE SEGURIDAD." }],
  institucionSistema: "PRIVADO",
  ruc: "0999999999001",
  ciiu: "C20119801",
  establecimiento: "EMPRESA DE PRUEBA S.A.",
  numeroFormulario: "HC-0001",
  numeroArchivo: "ARCH-001",
  primerApellido: "PEREZ",
  segundoApellido: "GOMEZ",
  primerNombre: "JUAN",
  segundoNombre: "CARLOS",
  puestoTrabajoCIUO: "OPERADOR",
};

async function abrir(contenido: Buffer): Promise<ExcelJS.Workbook> {
  const libro = new ExcelJS.Workbook();
  const datos = contenido.buffer.slice(
    contenido.byteOffset,
    contenido.byteOffset + contenido.byteLength,
  ) as Parameters<typeof libro.xlsx.load>[0];
  await libro.xlsx.load(datos);
  return libro;
}

describe("exportación Excel de ficha ocupacional", () => {
  it("genera el certificado PDF en orientación horizontal", async () => {
    const contenido = await generarCertificadoPdf(ficha);
    const mediaBox = contenido
      .toString("latin1")
      .match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);

    expect(mediaBox).not.toBeNull();
    expect(Number(mediaBox?.[1])).toBeGreaterThan(Number(mediaBox?.[2]));
  });

  it("genera un XLSX real con estructura, estilos, merges y snapshots históricos", async () => {
    const contenido = await generarFichaExcel(ficha);
    await expect(validarFichaExcel(contenido)).resolves.toBeUndefined();
    expect(contenido.subarray(0, 2).toString("ascii")).toBe("PK");

    const libro = await abrir(contenido);
    const hoja = libro.getWorksheet("CERTIFICADO");
    expect(hoja).toBeDefined();
    expect(hoja?.getCell("V4").value).toBe("EMPRESA DE PRUEBA S.A.");
    expect(hoja?.getCell("L4").value).toBe("0999999999001");
    expect(hoja?.getCell("L4").numFmt).toBe("@");
    expect(hoja?.getCell("A6").value).toBe("PEREZ");
    expect(hoja?.getCell("E33").value).toBe("SILVIO ROMERO HERNANDEZ");
    expect(hoja?.getCell("L12").value).toBe("X");
    expect(hoja?.getCell("U12").value).toBeNull();
    expect(hoja?.getCell("I17").value).toBe("X");
    expect(hoja?.getCell("S17").value).toBeNull();
    expect(hoja?.getCell("L12").border).toMatchObject({
      top: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
    });
    expect(hoja?.model.merges).toContain("A1:AL1");
    expect(hoja?.model.merges).toContain("A32:AB32");
    expect(hoja?.model.merges).toHaveLength(70);
    expect(hoja?.getCell("A1").fill).toMatchObject({
      type: "pattern",
      fgColor: { argb: "FFD9D9FF" },
    });
    expect(hoja?.pageSetup.printArea).toBe("A1:AL33");
    expect(hoja?.pageSetup.orientation).toBe("landscape");
    expect(hoja?.getCell("V4").protection.locked).toBe(false);
  });

  it("permite editar una celda y conservar el cambio al guardar y reabrir", async () => {
    const libro = await abrir(await generarFichaExcel(ficha));
    const hoja = libro.getWorksheet("CERTIFICADO");
    if (!hoja) throw new Error("No se generó la hoja CERTIFICADO.");
    hoja.getCell("V4").value = "EMPRESA EDITADA EN EXCEL";

    const editado = Buffer.from(await libro.xlsx.writeBuffer());
    const reabierto = await abrir(editado);
    expect(reabierto.getWorksheet("CERTIFICADO")?.getCell("V4").value).toBe(
      "EMPRESA EDITADA EN EXCEL",
    );
  });
});
