export class DepartamentoDuplicadoError extends Error { constructor(){super("Ya existe un departamento con ese nombre.");this.name="DepartamentoDuplicadoError";} }
export class DepartamentoNoEncontradoError extends Error { constructor(){super("El departamento no existe.");this.name="DepartamentoNoEncontradoError";} }
export class EmpresaLegadaNoDisponibleError extends Error { constructor(){super("La empresa principal migrada no esta disponible.");this.name="EmpresaLegadaNoDisponibleError";} }
