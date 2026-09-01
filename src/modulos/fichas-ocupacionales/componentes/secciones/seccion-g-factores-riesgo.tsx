import { FactoresRiesgo } from "@/modulos/fichas-ocupacionales/componentes/tablas/factores-riesgo";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionGFactoresRiesgo({ register, errors, control }: PropsTabla) {
  return <FactoresRiesgo register={register} errors={errors} control={control} />;
}
