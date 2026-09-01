import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo, FilaCheckbox } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionDProblemaActual({ register, errors, watch }: PropsSeccion) {
  const noRefiere = watch("noRefiereSintomatologia");
  return (
    <Card>
      <CardHeader><CardTitle>D. Enfermedad o problema actual</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <FilaCheckbox registro={register("noRefiereSintomatologia")} etiqueta="No refiere ningún tipo de sintomatología al momento" />
        {!noRefiere && (
          <Campo etiqueta="Descripción del problema actual" error={obtenerError(errors, "descripcionProblemaActual")}>
            <Textarea {...register("descripcionProblemaActual")} />
          </Campo>
        )}
      </CardContent>
    </Card>
  );
}
