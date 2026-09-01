import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionEConstantesVitales({ register, errors, watch }: PropsSeccion) {
  const peso = Number(watch("peso")) || 0;
  const talla = Number(watch("talla")) || 0;
  const imcCalculado = peso > 0 && talla > 0 ? (peso / Math.pow(talla / 100, 2)).toFixed(2) : "—";
  return (
    <Card>
      <CardHeader><CardTitle>E. Constantes vitales y antropometría</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Temperatura (°C)" error={obtenerError(errors, "temperatura")}><Input type="number" step="0.1" {...register("temperatura")} /></Campo>
        <Campo etiqueta="Presión arterial (mmHg)" error={obtenerError(errors, "presionArterial")}><Input {...register("presionArterial")} /></Campo>
        <Campo etiqueta="Frecuencia cardíaca (lat/min)" error={obtenerError(errors, "frecuenciaCardiaca")}><Input type="number" {...register("frecuenciaCardiaca")} /></Campo>
        <Campo etiqueta="Frecuencia respiratoria (fr/min)" error={obtenerError(errors, "frecuenciaRespiratoria")}><Input type="number" {...register("frecuenciaRespiratoria")} /></Campo>
        <Campo etiqueta="Saturación O2 (%)" error={obtenerError(errors, "saturacionOxigeno")}><Input type="number" {...register("saturacionOxigeno")} /></Campo>
        <Campo etiqueta="Peso (kg)" error={obtenerError(errors, "peso")}><Input type="number" step="0.1" {...register("peso")} /></Campo>
        <Campo etiqueta="Talla (cm)" error={obtenerError(errors, "talla")}><Input type="number" step="0.1" {...register("talla")} /></Campo>
        <Campo etiqueta={`IMC (kg/m²) — calculado: ${imcCalculado}`} error={obtenerError(errors, "imc")}><Input type="number" step="0.01" {...register("imc")} /></Campo>
        <Campo etiqueta="Perímetro abdominal (cm)" error={obtenerError(errors, "perimetroAbdominal")}><Input type="number" step="0.1" {...register("perimetroAbdominal")} /></Campo>
      </CardContent>
    </Card>
  );
}
