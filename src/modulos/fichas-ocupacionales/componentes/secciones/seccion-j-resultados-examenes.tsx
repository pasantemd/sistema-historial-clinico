import { TablaResultadosExamenes } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-resultados-examenes";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionJResultadosExamenes({ register, errors, control }: PropsTabla) {
  return <TablaResultadosExamenes register={register} errors={errors} control={control} />;
}
