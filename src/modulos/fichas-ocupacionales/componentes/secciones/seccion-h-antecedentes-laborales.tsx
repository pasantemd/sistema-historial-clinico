import { TablaAntecedentesLaborales } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-antecedentes-laborales";
import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionHAntecedentesLaborales({ register, errors, control }: PropsTabla) {
  return <TablaAntecedentesLaborales register={register} errors={errors} control={control} />;
}
