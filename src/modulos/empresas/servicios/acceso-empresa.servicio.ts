import { AccesoEmpresaDenegadoError } from "@/modulos/empresas/errores";
import { validarEmpresaActivaParaUsuario } from "@/modulos/empresas/repositorios/empresas.repositorio";

export async function requerirAccesoEmpresa(usuarioId: string, empresaId: string) {
  if (!(await validarEmpresaActivaParaUsuario(usuarioId, empresaId))) throw new AccesoEmpresaDenegadoError();
}
