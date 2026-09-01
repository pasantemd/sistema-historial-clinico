"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo, CampoGrupo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { TablaConsumoSustancias } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-consumo-sustancias";
import { TablaExamenesReproductivos } from "@/modulos/fichas-ocupacionales/componentes/tablas/tabla-examenes-reproductivos";
import { SI_NO, SI_NO_NO_RESPONDE } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

function RadiosSI_NO({ name, register }: { name: "autorizaTransfusiones" | "tratamientoHormonal" | "planificacionFamiliarFemenina" | "planificacionFamiliarMasculina" | "actividadFisica" | "medicacionHabitual"; register: PropsSeccion["register"] }) {
  return (
    <div className="flex gap-4">
      {SI_NO.map((item) => (
        <label key={item.valor} className="flex items-center gap-2 text-sm">
          <input type="radio" value={item.valor} className="size-4" {...register(name)} />
          {item.etiqueta}
        </label>
      ))}
    </div>
  );
}

export function SeccionCAntecedentesPersonales({ register, errors, control, watch }: PropsSeccion) {
  const tratamientoHormonal = watch("tratamientoHormonal");
  const planificacionFemenina = watch("planificacionFamiliarFemenina");
  const planificacionMasculina = watch("planificacionFamiliarMasculina");
  return (
    <Card>
      <CardHeader><CardTitle>C. Antecedentes personales</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Campo etiqueta="Antecedentes clínicos y quirúrgicos" error={obtenerError(errors, "antecedentesClinicosQuirurgicos")}><Textarea {...register("antecedentesClinicosQuirurgicos")} /></Campo>
        <Campo etiqueta="Antecedentes familiares" error={obtenerError(errors, "antecedentesFamiliares")}><Textarea {...register("antecedentesFamiliares")} /></Campo>

        <CampoGrupo etiqueta="¿Autoriza transfusiones?" error={obtenerError(errors, "autorizaTransfusiones")}>
          <RadiosSI_NO name="autorizaTransfusiones" register={register} />
        </CampoGrupo>

        <CampoGrupo etiqueta="Tratamiento hormonal" error={obtenerError(errors, "tratamientoHormonal")}>
          <div className="space-y-2">
            <RadiosSI_NO name="tratamientoHormonal" register={register} />
            {tratamientoHormonal === "SI" && (
              <Campo etiqueta="¿Cuál?" error={obtenerError(errors, "tratamientoHormonalCual")}><Input {...register("tratamientoHormonalCual")} /></Campo>
            )}
          </div>
        </CampoGrupo>

        <div className="grid gap-4 sm:grid-cols-4">
          <Campo etiqueta="Fecha última menstruación" error={obtenerError(errors, "fechaUltimaMenstruacion")}><Input type="date" {...register("fechaUltimaMenstruacion")} /></Campo>
          <Campo etiqueta="Gestas" error={obtenerError(errors, "gestas")}><Input type="number" {...register("gestas")} /></Campo>
          <Campo etiqueta="Partos" error={obtenerError(errors, "partos")}><Input type="number" {...register("partos")} /></Campo>
          <Campo etiqueta="Cesáreas" error={obtenerError(errors, "cesareas")}><Input type="number" {...register("cesareas")} /></Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Abortos" error={obtenerError(errors, "abortos")}><Input type="number" {...register("abortos")} /></Campo>
        </div>

        <CampoGrupo etiqueta="Planificación familiar femenina" error={obtenerError(errors, "planificacionFamiliarFemenina")}>
          <div className="space-y-2">
            <div className="flex gap-4">
              {SI_NO_NO_RESPONDE.map((item) => (
                <label key={item.valor} className="flex items-center gap-2 text-sm"><input type="radio" value={item.valor} className="size-4" {...register("planificacionFamiliarFemenina")} />{item.etiqueta}</label>
              ))}
            </div>
            {planificacionFemenina === "SI" && (
              <Campo etiqueta="Método" error={obtenerError(errors, "metodoPlanificacionFemenina")}><Input {...register("metodoPlanificacionFemenina")} /></Campo>
            )}
          </div>
        </CampoGrupo>
        <TablaExamenesReproductivos name="examenesFemeninos" titulo="Exámenes ginecológicos realizados" register={register} control={control} errors={errors} />

        <CampoGrupo etiqueta="Planificación familiar masculina" error={obtenerError(errors, "planificacionFamiliarMasculina")}>
          <div className="space-y-2">
            <div className="flex gap-4">
              {SI_NO_NO_RESPONDE.map((item) => (
                <label key={item.valor} className="flex items-center gap-2 text-sm"><input type="radio" value={item.valor} className="size-4" {...register("planificacionFamiliarMasculina")} />{item.etiqueta}</label>
              ))}
            </div>
            {planificacionMasculina === "SI" && (
              <Campo etiqueta="Método" error={obtenerError(errors, "metodoPlanificacionMasculina")}><Input {...register("metodoPlanificacionMasculina")} /></Campo>
            )}
          </div>
        </CampoGrupo>
        <TablaExamenesReproductivos name="examenesMasculinos" titulo="Exámenes masculinos realizados" register={register} control={control} errors={errors} />

        <TablaConsumoSustancias register={register} control={control} errors={errors} />

        <CampoGrupo etiqueta="Actividad física" error={obtenerError(errors, "actividadFisica")}>
          <div className="space-y-2">
            <RadiosSI_NO name="actividadFisica" register={register} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="¿Cuál?" error={obtenerError(errors, "actividadFisicaCual")}><Input {...register("actividadFisicaCual")} /></Campo>
              <Campo etiqueta="Tiempo" error={obtenerError(errors, "actividadFisicaTiempo")}><Input {...register("actividadFisicaTiempo")} /></Campo>
            </div>
          </div>
        </CampoGrupo>

        <CampoGrupo etiqueta="Medicación habitual" error={obtenerError(errors, "medicacionHabitual")}>
          <div className="space-y-2">
            <RadiosSI_NO name="medicacionHabitual" register={register} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="¿Cuál?" error={obtenerError(errors, "medicacionHabitualCual")}><Input {...register("medicacionHabitualCual")} /></Campo>
              <Campo etiqueta="Cantidad" error={obtenerError(errors, "medicacionHabitualCantidad")}><Input {...register("medicacionHabitualCantidad")} /></Campo>
            </div>
          </div>
        </CampoGrupo>

        <Campo etiqueta="Observación de estilo de vida" error={obtenerError(errors, "observacionEstiloVida")}><Textarea {...register("observacionEstiloVida")} /></Campo>
      </CardContent>
    </Card>
  );
}
