import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import { obtenerNumeroCorrelativo } from "@/servicios/base-datos/numero-correlativo";
import type { DatosRegistroDiario } from "@/modulos/registro-diario/validaciones/registro-diario.schema";
import { asegurarMorbilidadEnCatalogo } from "@/modulos/morbilidades/repositorios/morbilidades.repositorio";
import {
  registrarDevolucionRegistroDiarioTx,
  registrarSalidaInventarioTx,
} from "@/modulos/inventario/repositorios/inventario.repositorio";
import {
  RegistroDiarioAnuladoError,
  RegistroDiarioNoEncontradoError,
  TrabajadorClinicoNoDisponibleError,
} from "@/modulos/registro-diario/errores";

type Tx = Prisma.TransactionClient;
const fechaCivil = (valor: string) => new Date(`${valor}T00:00:00.000Z`);
const texto = (valor?: string) => valor?.trim() || null;

async function obtenerMaestros(
  tx: Tx,
  trabajadorId: string,
  usuarioId: string,
) {
  const [trabajador, profesional] = await Promise.all([
    tx.trabajador.findFirst({
      where: {
        id: trabajadorId,
        estadoLaboral: { not: "INACTIVO" },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      include: {
        empresa: { select: { id: true, razonSocial: true, ruc: true } },
        departamento: { select: { id: true, nombre: true, empresaId: true } },
      },
    }),
    tx.usuario.findFirst({
      where: { id: usuarioId, estado: "ACTIVO" },
      select: { id: true, nombres: true, apellidos: true },
    }),
  ]);

  if (
    !trabajador ||
    trabajador.departamento.empresaId !== trabajador.empresaId
  ) {
    throw new TrabajadorClinicoNoDisponibleError();
  }
  if (!profesional)
    throw new Error("El profesional autenticado no está activo.");
  return { trabajador, profesional };
}

function datosEscalares(datos: DatosRegistroDiario) {
  const resumenMedicamentos = datos.medicamentos
    .map(
      (medicamento) =>
        `${medicamento.nombreSnapshot} (${medicamento.cantidadEntregada} ${medicamento.unidadSnapshot})`,
    )
    .join("; ");
  return {
    diaAtencion: fechaCivil(datos.fechaAtencion),
    atencionMorbilidad: datos.atencionMorbilidad.trim(),
    medicacion: resumenMedicamentos || texto(datos.medicacion),
    procedimiento: texto(datos.procedimiento),
    firmaConfirmada: datos.firmaConfirmada,
    observaciones: texto(datos.observaciones),
  };
}

export async function crearRegistroDiarioRepositorio(
  datos: DatosRegistroDiario,
  usuarioId: string,
  finalizar: boolean,
) {
  return prisma.$transaction(async (tx) => {
    await asegurarMorbilidadEnCatalogo(datos.atencionMorbilidad, tx);
    const { trabajador, profesional } = await obtenerMaestros(
      tx,
      datos.trabajadorId,
      usuarioId,
    );
    const numeroRegistro = await obtenerNumeroCorrelativo(
      tx,
      "registro-diario",
    );
    const registro = await tx.registroDiarioAtencion.create({
      data: {
        ...datosEscalares(datos),
        numeroRegistro,
        trabajadorId: trabajador.id,
        empresaId: trabajador.empresa.id,
        departamentoId: trabajador.departamento.id,
        profesionalId: profesional.id,
        creadoPorId: usuarioId,
        apellidosNombres: `${trabajador.apellidos} ${trabajador.nombres}`,
        cedula: trabajador.numeroDocumento,
        fechaNacimiento: trabajador.fechaNacimiento,
        empresaNombreHistorico: trabajador.empresa.razonSocial,
        empresaRucHistorico: trabajador.empresa.ruc,
        departamentoNombreHistorico: trabajador.departamento.nombre,
        profesionalNombreHistorico: `${profesional.nombres} ${profesional.apellidos}`,
        estado: finalizar ? "REGISTRADO" : "BORRADOR",
      },
      select: { id: true, numeroRegistro: true },
    });
    if (finalizar) {
      for (const medicamento of datos.medicamentos) {
        const salida = await registrarSalidaInventarioTx(
          tx,
          medicamento.medicamentoInventarioId,
          medicamento.cantidadEntregada,
          `Salida por registro diario ${numeroRegistro}`,
          registro.id,
          usuarioId,
        );
        await tx.registroDiarioMedicamento.create({
          data: {
            registroDiarioId: registro.id,
            medicamentoInventarioId: medicamento.medicamentoInventarioId,
            nombreSnapshot: salida.nombre,
            unidadSnapshot: salida.unidad,
            cantidadEntregada: medicamento.cantidadEntregada,
            movimientoInventarioId: salida.movimientoId,
          },
        });
      }
    } else if (datos.medicamentos.length > 0) {
      await tx.registroDiarioMedicamento.createMany({
        data: datos.medicamentos.map((medicamento) => ({
          registroDiarioId: registro.id,
          medicamentoInventarioId: medicamento.medicamentoInventarioId,
          nombreSnapshot: medicamento.nombreSnapshot,
          unidadSnapshot: medicamento.unidadSnapshot,
          cantidadEntregada: medicamento.cantidadEntregada,
        })),
        skipDuplicates: true,
      });
    }
    return registro;
  });
}

export async function actualizarRegistroDiarioRepositorio(
  id: string,
  datos: DatosRegistroDiario,
  usuarioId: string,
  finalizar: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.registroDiarioAtencion.findFirst({
      where: {
        id,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      select: {
        id: true,
        trabajadorId: true,
        estado: true,
        numeroRegistro: true,
      },
    });
    if (!existente || existente.trabajadorId !== datos.trabajadorId) {
      throw new RegistroDiarioNoEncontradoError();
    }
    if (existente.estado === "ANULADO") throw new RegistroDiarioAnuladoError();
    await obtenerMaestros(tx, datos.trabajadorId, usuarioId);
    if (existente.estado === "REGISTRADO") {
      const resultado = await tx.registroDiarioAtencion.updateMany({
        where: { id, estado: "REGISTRADO" },
        data: {
          procedimiento: texto(datos.procedimiento),
          firmaConfirmada: datos.firmaConfirmada,
          observaciones: texto(datos.observaciones),
        },
      });
      if (!resultado.count) throw new RegistroDiarioAnuladoError();
      return { id, numeroRegistro: existente.numeroRegistro };
    }
    await asegurarMorbilidadEnCatalogo(datos.atencionMorbilidad, tx);
    const resultadoGuard = await tx.registroDiarioAtencion.updateMany({
      where: { id, estado: "BORRADOR" },
      data: {
        ...datosEscalares(datos),
        estado: finalizar ? "REGISTRADO" : "BORRADOR",
      },
    });
    if (!resultadoGuard.count) {
      const actual = await tx.registroDiarioAtencion.findFirst({
        where: {
          id,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        select: { id: true, estado: true, numeroRegistro: true },
      });
      if (!actual) throw new RegistroDiarioNoEncontradoError();
      if (actual.estado === "ANULADO") throw new RegistroDiarioAnuladoError();
      return { id: actual.id, numeroRegistro: actual.numeroRegistro };
    }
    await tx.registroDiarioMedicamento.deleteMany({
      where: { registroDiarioId: id, movimientoInventarioId: null },
    });
    if (finalizar) {
      for (const medicamento of datos.medicamentos) {
        const salida = await registrarSalidaInventarioTx(
          tx,
          medicamento.medicamentoInventarioId,
          medicamento.cantidadEntregada,
          `Salida por registro diario ${existente.numeroRegistro}`,
          id,
          usuarioId,
        );
        await tx.registroDiarioMedicamento.create({
          data: {
            registroDiarioId: id,
            medicamentoInventarioId: medicamento.medicamentoInventarioId,
            nombreSnapshot: salida.nombre,
            unidadSnapshot: salida.unidad,
            cantidadEntregada: medicamento.cantidadEntregada,
            movimientoInventarioId: salida.movimientoId,
          },
        });
      }
    } else if (datos.medicamentos.length > 0) {
      await tx.registroDiarioMedicamento.createMany({
        data: datos.medicamentos.map((medicamento) => ({
          registroDiarioId: id,
          medicamentoInventarioId: medicamento.medicamentoInventarioId,
          nombreSnapshot: medicamento.nombreSnapshot,
          unidadSnapshot: medicamento.unidadSnapshot,
          cantidadEntregada: medicamento.cantidadEntregada,
        })),
        skipDuplicates: true,
      });
    }
    return { id, numeroRegistro: existente.numeroRegistro };
  });
}

export async function anularRegistroDiarioRepositorio(
  id: string,
  motivo: string,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    const resultado = await tx.registroDiarioAtencion.updateMany({
      where: {
        id,
        estado: { not: "ANULADO" },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      data: {
        estado: "ANULADO",
        anuladoEn: new Date(),
        motivoAnulacion: motivo,
      },
    });
    if (!resultado.count) {
      const existente = await tx.registroDiarioAtencion.findFirst({
        where: {
          id,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        select: { id: true },
      });
      if (!existente) throw new RegistroDiarioNoEncontradoError();
      throw new RegistroDiarioAnuladoError();
    }
    await registrarDevolucionRegistroDiarioTx(tx, id, usuarioId);
    return { id };
  });
}
