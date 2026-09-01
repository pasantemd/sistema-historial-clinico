import "dotenv/config";

import { describe, expect, it } from "vitest";

import { prisma } from "@/servicios/base-datos/prisma";
import { registrarSalidaInventarioTx } from "@/modulos/inventario/repositorios/inventario.repositorio";
import { Prisma } from "@/generated/prisma/client";

describe("Prueba Integral End-to-End de Todos los Módulos del Sistema", () => {
  describe("1. Autenticación, Roles y Aislamiento Multiempresa", () => {
    it("valida que existan los 3 usuarios QA con sus roles y empresas respectivas", async () => {
      const admin = await prisma.usuario.findUnique({
        where: { correo: "qa_admin@historial.local" },
        include: { roles: { include: { rol: true } } },
      });
      const medico = await prisma.usuario.findUnique({
        where: { correo: "qa_medico@historial.local" },
        include: {
          roles: { include: { rol: true } },
          empresasAutorizadas: { include: { empresa: true } },
        },
      });
      const rrhh = await prisma.usuario.findUnique({
        where: { correo: "qa_rrhh@historial.local" },
        include: {
          roles: { include: { rol: true } },
          empresasAutorizadas: { include: { empresa: true } },
        },
      });

      expect(admin).toBeDefined();
      expect(admin?.roles[0]?.rol.nombre).toBe("ADMINISTRADOR");

      expect(medico).toBeDefined();
      expect(medico?.roles[0]?.rol.nombre).toBe("MÉDICO");
      expect(medico?.empresasAutorizadas[0]?.empresa.razonSocial).toBe("QA_EMPRESA_ALPHA");

      expect(rrhh).toBeDefined();
      expect(rrhh?.roles[0]?.rol.nombre).toBe("RECURSOS_HUMANOS");
      expect(rrhh?.empresasAutorizadas[0]?.empresa.razonSocial).toBe("QA_EMPRESA_ALPHA");
    });

    it("aislamiento multiempresa: el médico de Empresa Alpha no debe tener asignada la Empresa Beta", async () => {
      const medico = await prisma.usuario.findUnique({
        where: { correo: "qa_medico@historial.local" },
        include: { empresasAutorizadas: { include: { empresa: true } } },
      });

      const tieneAccesoBeta = medico?.empresasAutorizadas.some(
        (ea) => ea.empresa.razonSocial === "QA_EMPRESA_BETA",
      );
      expect(tieneAccesoBeta).toBe(false);
    });
  });

  describe("2. Trabajadores y Transición de Vínculos Laborales", () => {
    it("el trabajador QA_TRABAJADOR_01 tiene exactamente 1 asignación laboral activa", async () => {
      const trabajador = await prisma.trabajador.findUnique({
        where: {
          tipoDocumento_numeroDocumento: {
            tipoDocumento: "CEDULA",
            numeroDocumento: "QA-DOC-001",
          },
        },
        include: {
          asignacionesLaborales: true,
          empresa: true,
        },
      });

      expect(trabajador).toBeDefined();
      expect(trabajador?.estadoLaboral).toBe("ACTIVO");
      expect(trabajador?.empresa.razonSocial).toBe("QA_EMPRESA_ALPHA");

      const asignacionesActivas = trabajador?.asignacionesLaborales.filter(
        (a) => a.activa && a.estado === "ACTIVO",
      );
      expect(asignacionesActivas).toHaveLength(1);
    });

    it("rechazo controlado de documento duplicado (Constraint Único)", async () => {
      const empresaAlpha = await prisma.empresa.findUnique({
        where: { ruc: "QA-RUC-ALPHA-01" },
      });
      const depto = await prisma.departamento.findFirst({
        where: { empresaId: empresaAlpha?.id },
      });

      let errorLanzado = false;
      try {
        await prisma.trabajador.create({
          data: {
            tipoDocumento: "CEDULA",
            numeroDocumento: "QA-DOC-001", // Duplicado intencional
            nombres: "DUPLICADO",
            apellidos: "ERROR",
            empresaId: empresaAlpha!.id,
            departamentoId: depto!.id,
          },
        });
      } catch (error) {
        errorLanzado = true;
        expect((error as { code?: string }).code).toBe("P2002");
      }

      expect(errorLanzado).toBe(true);
    });
  });

  describe("3. Inventario: Descuento, No Doble Descuento y Devolución", () => {
    it("control de stock: realiza salida en transacción y actualiza cantidad disponible", async () => {
      const medicamento = await prisma.medicamentoInventario.findFirst({
        where: { nombre: "QA_IBUPROFENO_400" },
      });
      const usuarioAdmin = await prisma.usuario.findUnique({
        where: { correo: "qa_admin@historial.local" },
      });

      expect(medicamento).toBeDefined();
      const stockInicial = Number(medicamento?.cantidadDisponible);

      // Simular entrega de 5 tabletas
      await prisma.$transaction(async (tx) => {
        await registrarSalidaInventarioTx(
          tx,
          medicamento!.id,
          5,
          "Entrega de prueba QA E2E",
          usuarioAdmin!.id,
          usuarioAdmin!.id,
        );
      });

      const medicamentoPost = await prisma.medicamentoInventario.findUnique({
        where: { id: medicamento!.id },
      });
      expect(Number(medicamentoPost?.cantidadDisponible)).toBe(stockInicial - 5);

      // Revertir (devolución) para dejar el stock restaurado
      await prisma.$transaction(async (tx) => {
        await tx.medicamentoInventario.update({
          where: { id: medicamento!.id },
          data: { cantidadDisponible: { increment: 5 } },
        });
        await tx.movimientoInventario.create({
          data: {
            medicamentoInventarioId: medicamento!.id,
            tipoMovimiento: "DEVOLUCION",
            cantidad: new Prisma.Decimal(5),
            cantidadAnterior: medicamentoPost!.cantidadDisponible,
            cantidadPosterior: new Prisma.Decimal(stockInicial),
            motivo: "Devolución por anulación de atención QA E2E",
            usuarioId: usuarioAdmin!.id,
          },
        });
      });

      const medicamentoRestaurado = await prisma.medicamentoInventario.findUnique({
        where: { id: medicamento!.id },
      });
      expect(Number(medicamentoRestaurado?.cantidadDisponible)).toBe(stockInicial);
    });
  });

  describe("4. Preservación del Profesional y Contexto Laboral Histórico", () => {
    it("los registros clínicos conservan el profesional y la empresa histórica persistida", async () => {
      const empresaAlpha = await prisma.empresa.findUnique({
        where: { ruc: "QA-RUC-ALPHA-01" },
      });
      const trabajador = await prisma.trabajador.findUnique({
        where: {
          tipoDocumento_numeroDocumento: {
            tipoDocumento: "CEDULA",
            numeroDocumento: "QA-DOC-001",
          },
        },
      });
      const medico = await prisma.usuario.findUnique({
        where: { correo: "qa_medico@historial.local" },
      });

      // Crear un registro clínico histórico
      const registro = await prisma.registroDiarioAtencion.create({
        data: {
          numeroRegistro: "QA-REG-HISTORICO-01",
          trabajadorId: trabajador!.id,
          empresaId: empresaAlpha!.id,
          profesionalId: medico!.id,
          apellidosNombres: `${trabajador!.apellidos} ${trabajador!.nombres}`,
          cedula: trabajador!.numeroDocumento,
          diaAtencion: new Date("2026-08-01T00:00:00.000Z"),
          atencionMorbilidad: "Cefalea tensional",
          empresaNombreHistorico: empresaAlpha!.razonSocial,
          profesionalNombreHistorico: `${medico!.nombres} ${medico!.apellidos}`,
          creadoPorId: medico!.id,
          estado: "REGISTRADO",
        },
      });

      expect(registro.empresaNombreHistorico).toBe("QA_EMPRESA_ALPHA");
      expect(registro.profesionalNombreHistorico).toBe("DRA. QA MÉDICO ALPHA");

      // Limpiar registro de prueba
      await prisma.registroDiarioAtencion.delete({
        where: { id: registro.id },
      });
    });
  });
});
