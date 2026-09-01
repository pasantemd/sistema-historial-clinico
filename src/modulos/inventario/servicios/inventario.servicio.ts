import {
  cambiarEstadoMedicamentoInventarioRepositorio,
  crearMedicamentoInventarioRepositorio,
  editarMedicamentoInventarioRepositorio,
  registrarMovimientoInventarioRepositorio,
} from "@/modulos/inventario/repositorios/inventario.repositorio";
import type {
  DatosAgregarCantidad,
  DatosEliminarCantidad,
  DatosMedicamentoInventario,
  DatosMovimientoInventario,
} from "@/modulos/inventario/validaciones/inventario.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

export async function crearMedicamentoInventarioServicio(datos: DatosMedicamentoInventario, usuarioId: string) {
  const resultado = await crearMedicamentoInventarioRepositorio(datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "INVENTARIO_MEDICAMENTO_CREADO",
    modulo: "INVENTARIO",
    entidad: "MedicamentoInventario",
    entidadId: resultado.id,
    resultado: "EXITOSO",
    datosNuevos: { nombre: datos.nombre, unidad: datos.unidad, fechaCaducidad: datos.fechaCaducidad },
  });
  return resultado;
}

export async function editarMedicamentoInventarioServicio(id: string, datos: DatosMedicamentoInventario, usuarioId: string) {
  const resultado = await editarMedicamentoInventarioRepositorio(id, datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "INVENTARIO_MEDICAMENTO_EDITADO",
    modulo: "INVENTARIO",
    entidad: "MedicamentoInventario",
    entidadId: id,
    resultado: "EXITOSO",
    datosNuevos: {
      nombre: datos.nombre,
      unidad: datos.unidad,
      fechaCaducidad: datos.fechaCaducidad,
      estado: datos.estado ?? null,
    },
  });
  return resultado;
}

export async function registrarMovimientoInventarioServicio(datos: DatosMovimientoInventario, usuarioId: string) {
  const resultado = await registrarMovimientoInventarioRepositorio(datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "INVENTARIO_MOVIMIENTO_REGISTRADO",
    modulo: "INVENTARIO",
    entidad: "MovimientoInventario",
    entidadId: resultado.id,
    resultado: "EXITOSO",
    datosNuevos: { tipo: datos.tipoMovimiento, cantidad: String(datos.cantidad) },
  });
  return resultado;
}

export async function agregarCantidadServicio(datos: DatosAgregarCantidad, usuarioId: string) {
  const datosMovimiento: DatosMovimientoInventario = {
    medicamentoInventarioId: datos.medicamentoInventarioId,
    tipoMovimiento: "ENTRADA",
    cantidad: datos.cantidad,
    motivo: datos.motivo,
  };
  return registrarMovimientoInventarioServicio(datosMovimiento, usuarioId);
}

export async function eliminarCantidadServicio(datos: DatosEliminarCantidad, usuarioId: string) {
  const datosMovimiento: DatosMovimientoInventario = {
    medicamentoInventarioId: datos.medicamentoInventarioId,
    tipoMovimiento: "SALIDA",
    cantidad: datos.cantidad,
    motivo: datos.motivo,
  };
  return registrarMovimientoInventarioServicio(datosMovimiento, usuarioId);
}

export async function cambiarEstadoMedicamentoInventarioServicio(id: string, activar: boolean, usuarioId: string) {
  const resultado = await cambiarEstadoMedicamentoInventarioRepositorio(id, activar, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: activar ? "INVENTARIO_MEDICAMENTO_ACTIVADO" : "INVENTARIO_MEDICAMENTO_DESACTIVADO",
    modulo: "INVENTARIO",
    entidad: "MedicamentoInventario",
    entidadId: id,
    resultado: "EXITOSO",
    datosNuevos: { estado: activar ? "ACTIVO" : "INACTIVO" },
  });
  return resultado;
}
