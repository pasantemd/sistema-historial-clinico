import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo, CampoGrupo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { APTITUDES_MEDICAS } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionLAptitudMedica({ register, errors }: PropsSeccion) {
  return (
    <Card>
      <CardHeader><CardTitle>L. Aptitud médica para el trabajo</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <CampoGrupo etiqueta="Aptitud" error={obtenerError(errors, "aptitudMedica")}>
          <div className="flex flex-wrap gap-4">
            {APTITUDES_MEDICAS.map((item) => (
              <label key={item.valor} className="flex items-center gap-2 text-sm">
                <input type="radio" value={item.valor} className="size-4" {...register("aptitudMedica")} />
                {item.etiqueta}
              </label>
            ))}
          </div>
        </CampoGrupo>
        <Campo etiqueta="Observaciones" error={obtenerError(errors, "observacionesAptitud")}>
          <Textarea {...register("observacionesAptitud")} />
        </Campo>
      </CardContent>
    </Card>
  );
}
