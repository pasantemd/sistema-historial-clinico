import { TablaActividadesExtralaborales } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-actividades-extralaborales";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionIActividadesExtralaborales({ register, errors, control }: PropsTabla) {
  return <TablaActividadesExtralaborales register={register} errors={errors} control={control} />;
}
