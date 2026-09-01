import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";

import { FilaCheckbox } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import type { PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionPFirmaTrabajador({ register }: PropsSeccion) {
  return (
    <Card>
      <CardHeader><CardTitle>P. Firma del trabajador</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <FilaCheckbox registro={register("firmaTrabajadorAcepta")} etiqueta="El trabajador acepta y confirma la información registrada." />
      </CardContent>
    </Card>
  );
}
