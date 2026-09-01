import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionODatosProfesional({ register, errors }: PropsSeccion) {
  return (
    <Card>
      <CardHeader><CardTitle>O. Datos del profesional</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombres y apellidos del profesional" error={obtenerError(errors, "profesionalNombres")}><Input {...register("profesionalNombres")} /></Campo>
        <Campo etiqueta="Código médico" error={obtenerError(errors, "profesionalCodigoMedico")}><Input {...register("profesionalCodigoMedico")} /></Campo>
      </CardContent>
    </Card>
  );
}
