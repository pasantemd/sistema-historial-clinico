import {
  buscarMedicamentosInventarioRepositorio,
  consultarMedicamentoInventarioRepositorio,
  consultarMovimientosMedicamentoInventarioRepositorio,
  listarInventarioRepositorio,
} from "@/modulos/inventario/repositorios/inventario.repositorio";
import type { FiltrosInventario } from "@/modulos/inventario/tipos";
import { normalizarFiltrosInventario } from "@/modulos/inventario/validaciones/inventario.schema";

export async function listarInventario(filtros: FiltrosInventario) {
  return listarInventarioRepositorio(normalizarFiltrosInventario(filtros));
}

export async function consultarMedicamentoInventario(id: string) {
  return consultarMedicamentoInventarioRepositorio(id);
}

export async function consultarMovimientosMedicamentoInventario(id: string) {
  return consultarMovimientosMedicamentoInventarioRepositorio(id);
}

export async function buscarMedicamentosInventario(termino: string) {
  return buscarMedicamentosInventarioRepositorio(termino);
}
