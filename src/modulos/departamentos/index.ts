export { default as PaginaDepartamentos } from "./componentes/pagina-departamentos";
export { default as PaginaEditarDepartamento } from "./componentes/pagina-editar-departamento";
export { default as PaginaNuevoDepartamento } from "./componentes/pagina-nuevo-departamento";
export {
  consultarDepartamentoPorId,
  consultarDepartamentos,
  consultarDepartamentosActivos,
} from "./consultas/departamentos.consulta";
export { departamentoSchema, filtrosDepartamentosSchema } from "./validaciones/departamento.schema";
export type { DatosDepartamento, EntradaDepartamento } from "./validaciones/departamento.schema";
export type { DepartamentoLista } from "./tipos";
