import { ExamenFisicoRegiones } from "@/modulos/fichas-ocupacionales/componentes/tablas/examen-fisico-regiones";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionFExamenFisico({ register, errors, control }: PropsTabla) {
  return <ExamenFisicoRegiones register={register} errors={errors} control={control} />;
}
