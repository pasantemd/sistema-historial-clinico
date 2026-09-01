import { TablaDiagnosticos } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-diagnosticos";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionKDiagnosticos({ register, errors, control }: PropsTabla) {
  return <TablaDiagnosticos register={register} errors={errors} control={control} />;
}
