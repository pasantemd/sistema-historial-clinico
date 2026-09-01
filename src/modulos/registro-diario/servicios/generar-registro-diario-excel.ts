import ExcelJS from "exceljs";
import type { RegistroDiarioDetalleDto } from "@/modulos/registro-diario/tipos";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

export async function generarRegistroDiarioExcel(registro: RegistroDiarioDetalleDto): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet("Registro diario", { pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true } });
  hoja.mergeCells("A1:H1"); hoja.getCell("A1").value = "REGISTRO DIARIO DE PACIENTES"; hoja.getCell("A1").font = { bold: true, size: 14 }; hoja.getCell("A1").alignment = { horizontal: "center" };
  hoja.mergeCells("A2:H2"); hoja.getCell("A2").value = `${registro.empresa} · ${registro.numeroRegistro}`; hoja.getCell("A2").alignment = { horizontal: "center" };
  const encabezados = ["APELLIDOS Y NOMBRES", "CÉDULA", "FECHA DE NACIMIENTO", "DÍA DE ATENCIÓN", "ATENCIÓN MORBILIDAD", "MEDICACIÓN", "PROCEDIMIENTO", "FIRMA"];
  hoja.addRow([]); const encabezado = hoja.addRow(encabezados); encabezado.font = { bold: true }; encabezado.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  const fila = hoja.addRow([registro.nombreCompleto, registro.numeroDocumento, formatearFecha(registro.fechaNacimiento), formatearFecha(registro.fechaAtencion), registro.atencionMorbilidad, registro.medicacion ?? "", registro.procedimiento ?? "", registro.firmaConfirmada ? "SÍ" : "NO"]); fila.alignment = { vertical: "top", wrapText: true };
  hoja.columns = [{ width: 30 }, { width: 15 }, { width: 17 }, { width: 15 }, { width: 35 }, { width: 28 }, { width: 28 }, { width: 12 }];
  [encabezado, fila].forEach((r) => r.eachCell((c) => { c.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } }; }));
  hoja.pageSetup.printArea = "A1:H5";
  return Buffer.from(await libro.xlsx.writeBuffer());
}

