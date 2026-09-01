"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/componentes/ui/input";
import { ESTADOS_TRABAJADOR } from "@/modulos/trabajadores/constantes";
import type { CatalogoOrganizacional } from "@/modulos/trabajadores/tipos";
import type { EntradaTrabajador } from "@/modulos/trabajadores/validaciones/trabajador.schema";
import { Campo, CardSection } from "./seccion-datos-personales";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

/** Solo los valores del enum EstadoTrabajador (excluye FINALIZADO, que es de vínculo). */
const OPCIONES_ESTADO_LABORAL = ESTADOS_TRABAJADOR.filter(
  (opcion) => opcion.valor !== "FINALIZADO",
);

interface Props {
  register: UseFormRegister<EntradaTrabajador>;
  errors: FieldErrors<EntradaTrabajador>;
  empresaId: string;
  empresas: CatalogoOrganizacional["empresas"];
  departamentos: CatalogoOrganizacional["departamentos"];
  modoEdicion?: boolean;
}

export function SeccionDatosLaborales({ register, errors, empresaId, empresas, departamentos, modoEdicion }: Props) {
  const sinDepartamentos = Boolean(empresaId) && departamentos.length === 0;
  return (
    <CardSection titulo="Datos laborales">
      <Campo etiqueta="Empresa" id="empresaId" required error={errors.empresaId?.message}>
        <select id="empresaId" className={selector} aria-invalid={Boolean(errors.empresaId)} {...register("empresaId")}>
          <option value="">Seleccione una empresa autorizada</option>
          {empresas.map((item) => (
            <option key={item.id} value={item.id}>{item.razonSocial}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Departamento" id="departamentoId" required error={errors.departamentoId?.message}>
        <select id="departamentoId" className={selector} disabled={!empresaId} aria-invalid={Boolean(errors.departamentoId)} {...register("departamentoId")}>
          <option value="">
            {sinDepartamentos
              ? "No existen departamentos activos"
              : empresaId
                ? "Seleccione un departamento"
                : "Seleccione primero una empresa"}
          </option>
          {departamentos.map((item) => (
            <option key={item.id} value={item.id}>{item.nombre}</option>
          ))}
        </select>
      </Campo>
      <Campo etiqueta="Puesto laboral" id="puestoLaboral" required error={errors.puestoLaboral?.message}>
        <Input id="puestoLaboral" className="min-h-11" placeholder="Ej.: Analista de sistemas, Operador de producción" aria-invalid={Boolean(errors.puestoLaboral)} {...register("puestoLaboral")} />
      </Campo>
      {modoEdicion && (
        <Campo etiqueta="Estado laboral" id="estadoLaboral" error={errors.estadoLaboral?.message}>
          <select id="estadoLaboral" className={selector} aria-invalid={Boolean(errors.estadoLaboral)} {...register("estadoLaboral")}>
            {OPCIONES_ESTADO_LABORAL.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
            ))}
          </select>
        </Campo>
      )}
    </CardSection>
  );
}
