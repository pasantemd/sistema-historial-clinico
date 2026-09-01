import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/servicios/base-datos/prisma";
import { consultarReportes } from "@/modulos/reportes/consultas/reportes.consulta";
import { generarReporteWord } from "@/modulos/reportes/servicios/generar-reporte-word";
import { aplicarDatosReportes, limpiarDatosReportes } from "../../scripts/cargar-datos-reportes";

describe("Validación de Reportes con Dataset de Prueba", () => {
  let empresaAId: string;
  let empresaBId: string;
  let deptoSistemasId: string;
  let deptoMarketingId: string;
  let medicoAnaId: string;
  let medicoJuanId: string;
  let trabajador1Id: string;

  beforeAll(async () => {
    // Aplicar dataset completo
    await aplicarDatosReportes(prisma);

    const empA = await prisma.empresa.findUniqueOrThrow({ where: { ruc: "9999999900001" } });
    const empB = await prisma.empresa.findUniqueOrThrow({ where: { ruc: "9999999900002" } });
    empresaAId = empA.id;
    empresaBId = empB.id;

    const deptos = await prisma.departamento.findMany({
      where: { empresaId: { in: [empresaAId, empresaBId] } },
    });
    deptoSistemasId = deptos.find((d) => d.empresaId === empresaAId && d.nombre === "SISTEMAS")!.id;
    deptoMarketingId = deptos.find((d) => d.empresaId === empresaAId && d.nombre === "MARKETING")!.id;

    const medAna = await prisma.usuario.findUniqueOrThrow({ where: { correo: "ana.lopez.test@tradetek.local" } });
    const medJuan = await prisma.usuario.findUniqueOrThrow({ where: { correo: "juan.perez.test@tradetek.local" } });
    medicoAnaId = medAna.id;
    medicoJuanId = medJuan.id;

    const trab1 = await prisma.trabajador.findFirstOrThrow({ where: { numeroDocumento: "9900000001" } });
    trabajador1Id = trab1.id;
  }, 30_000);

  afterAll(async () => {
    // Limpieza final
    await limpiarDatosReportes(prisma);
  }, 30_000);

  it("1. Totales globales de atenciones activas, evaluaciones y fichas", async () => {
    const reportes = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
    });

    // 20 registros diarios activos (el RD-021 está anulado)
    expect(reportes.resumen.atencionesDiarias).toBe(20);
    // 12 evaluaciones médicas
    expect(reportes.resumen.evaluacionesMedicas).toBe(12);
    // 9 fichas ocupacionales
    expect(reportes.resumen.fichasOcupacionales).toBe(9);
    // 4 recetas médicas emitidas
    expect(reportes.resumen.recetasEmitidas).toBe(4);
  });

  it("2. Distribución unificada de morbilidades (20 en total)", async () => {
    const reportes = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
    });

    const mapaMorbilidades = new Map(reportes.morbilidadesFrecuentes.map((m) => [m.label, m.valor]));

    expect(mapaMorbilidades.get("Dolor abdominal")).toBe(6);
    expect(mapaMorbilidades.get("Cefalea tensional")).toBe(4);
    expect(mapaMorbilidades.get("Dolor lumbar")).toBe(3);
    expect(mapaMorbilidades.get("Fiebre")).toBe(3);
    expect(mapaMorbilidades.get("Gastritis")).toBe(2);
    expect(mapaMorbilidades.get("Dolor de garganta")).toBe(2);

    const totalMorbilidades = Array.from(mapaMorbilidades.values()).reduce((a, b) => a + b, 0);
    expect(totalMorbilidades).toBe(20);
  });

  it("3. Multiempresa: Totales aislados de Empresa A (TRADETEK)", async () => {
    const reportesEmpA = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaAId,
    });

    expect(reportesEmpA.resumen.atencionesDiarias).toBe(12);
    expect(reportesEmpA.resumen.evaluacionesMedicas).toBe(7);
    expect(reportesEmpA.resumen.fichasOcupacionales).toBe(5);
  });

  it("4. Multiempresa: Totales aislados de Empresa B (APRACOM)", async () => {
    const reportesEmpB = await consultarReportes(medicoJuanId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaBId,
    });

    expect(reportesEmpB.resumen.atencionesDiarias).toBe(8);
    expect(reportesEmpB.resumen.evaluacionesMedicas).toBe(5);
    expect(reportesEmpB.resumen.fichasOcupacionales).toBe(4);
  });

  it("5. Filtro por Departamento: Sistemas vs Marketing en Empresa A", async () => {
    const repSistemas = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaAId,
      departamentoId: deptoSistemasId,
    });

    const repMarketing = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaAId,
      departamentoId: deptoMarketingId,
    });

    // En Sistemas: RD-01, RD-02, RD-03, RD-10, RD-11, RD-18, RD-19 = 7 atenciones
    expect(repSistemas.resumen.atencionesDiarias).toBe(7);
    // En Marketing: RD-04, RD-05, RD-09, RD-14, RD-15 = 5 atenciones
    expect(repMarketing.resumen.atencionesDiarias).toBe(5);
  });

  it("6. Historial Laboral: Trabajador 1 asignación histórica Sistemas (Semana 1) vs Marketing (Semana 2)", async () => {
    // Registro RD-01 (2026-08-01) cuando estaba en Sistemas
    const regSistemas = await prisma.registroDiarioAtencion.findFirst({
      where: { numeroRegistro: "TEST-REPORTES-RD-001" },
    });
    expect(regSistemas?.departamentoNombreHistorico).toBe("SISTEMAS");

    // Registro RD-09 (2026-08-10) cuando pasó a Marketing
    const regMarketing = await prisma.registroDiarioAtencion.findFirst({
      where: { numeroRegistro: "TEST-REPORTES-RD-009" },
    });
    expect(regMarketing?.departamentoNombreHistorico).toBe("MARKETING");
  });

  it("7. Multimédico: Distribución exacta de registros entre Dra. Ana (12) y Dr. Juan (8)", async () => {
    const regDraAna = await prisma.registroDiarioAtencion.count({
      where: {
        numeroRegistro: { startsWith: "TEST-REPORTES-" },
        profesionalId: medicoAnaId,
        estado: { not: "ANULADO" },
      },
    });

    const regDrJuan = await prisma.registroDiarioAtencion.count({
      where: {
        numeroRegistro: { startsWith: "TEST-REPORTES-" },
        profesionalId: medicoJuanId,
        estado: { not: "ANULADO" },
      },
    });

    expect(regDraAna).toBe(12);
    expect(regDrJuan).toBe(8);
  });

  it("8. Medicamentos entregados en Inventario: Netos activos y caso de devolución", async () => {
    const paracetamol = await prisma.medicamentoInventario.findFirstOrThrow({
      where: { nombre: "TEST-REPORTES-Paracetamol 500mg" },
    });
    const ibuprofeno = await prisma.medicamentoInventario.findFirstOrThrow({
      where: { nombre: "TEST-REPORTES-Ibuprofeno 400mg" },
    });
    const lemonflu = await prisma.medicamentoInventario.findFirstOrThrow({
      where: { nombre: "TEST-REPORTES-Lemonflu" },
    });
    const omeprazol = await prisma.medicamentoInventario.findFirstOrThrow({
      where: { nombre: "TEST-REPORTES-Omeprazol 20mg" },
    });

    // Stock final = Stock Inicial - Entregas Netas
    // Paracetamol: 100 - 20 (neto tras SALIDA 2 + DEVOLUCION 2 de RD-021) = 80
    expect(Number(paracetamol.cantidadDisponible)).toBe(80);
    // Ibuprofeno: 80 - 12 = 68
    expect(Number(ibuprofeno.cantidadDisponible)).toBe(68);
    // Lemonflu: 60 - 8 = 52
    expect(Number(lemonflu.cantidadDisponible)).toBe(52);
    // Omeprazol: 50 - 3 = 47
    expect(Number(omeprazol.cantidadDisponible)).toBe(47);

    const reporteGlobal = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
    });
    const entregasGlobales = new Map(
      reporteGlobal.medicamentosEntregados.map((medicamento) => [
        medicamento.nombre,
        medicamento,
      ]),
    );
    expect(entregasGlobales.get("TEST-REPORTES-Paracetamol 500mg")).toMatchObject({
      cantidadTotal: 20,
      numeroEntregas: 8,
      unidad: "TABLETAS",
    });
    expect(entregasGlobales.get("TEST-REPORTES-Ibuprofeno 400mg")).toMatchObject({
      cantidadTotal: 12,
      numeroEntregas: 5,
      unidad: "TABLETAS",
    });

    const reporteHistorico = await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaAId,
      departamentoId: deptoSistemasId,
      trabajadorId: trabajador1Id,
      profesionalId: medicoAnaId,
    });
    expect(reporteHistorico.medicamentosEntregados).toEqual([
      expect.objectContaining({
        nombre: "TEST-REPORTES-Paracetamol 500mg",
        cantidadTotal: 2,
        numeroEntregas: 1,
      }),
    ]);

    const reporteEmpresaB = await consultarReportes(medicoJuanId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaBId,
    });
    expect(
      reporteEmpresaB.medicamentosEntregados.find(
        (medicamento) =>
          medicamento.nombre === "TEST-REPORTES-Paracetamol 500mg",
      ),
    ).toMatchObject({ cantidadTotal: 5, numeroEntregas: 2 });
  });

  it("9. Generación de Word de Reporte sin errores con el período de prueba", async () => {
    await consultarReportes(medicoAnaId, {
      periodo: "personalizado",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
      empresaId: empresaAId,
    });

    const wordBuffer = await generarReporteWord({
      filtros: {
        periodo: "personalizado",
        fechaDesde: "2026-08-01",
        fechaHasta: "2026-08-31",
        empresaId: empresaAId,
      },
      usuario: "TEST-REPORTES Dra. Ana López",
      graficos: [
        {
          id: "registros-diarios-dia",
          imagenDataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZsZcAAAAASUVORK5CYII=",
        },
      ],
    });

    expect(wordBuffer).toBeInstanceOf(Buffer);
    expect(wordBuffer.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(wordBuffer.length).toBeGreaterThan(1000);
  });
});
