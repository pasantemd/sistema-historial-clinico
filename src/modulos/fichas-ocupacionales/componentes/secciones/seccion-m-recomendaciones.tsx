import { TablaRecomendaciones } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-recomendaciones";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionMRecomendaciones({ register, errors, control }: PropsTabla) {
  return <TablaRecomendaciones register={register} errors={errors} control={control} />;
}
