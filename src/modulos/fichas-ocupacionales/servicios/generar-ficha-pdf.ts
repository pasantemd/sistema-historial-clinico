import type { FichaPdfDto } from "@/modulos/fichas-ocupacionales/tipos";
import {
  GRUPOS_RIESGO_SEGURIDAD,
  RIESGOS_BIOLOGICO,
  RIESGOS_ERGONOMICO,
  RIESGOS_FISICO,
  RIESGOS_PSICOSOCIAL,
  RIESGOS_QUIMICO,
  RIESGOS_SEGURIDAD,
} from "@/modulos/fichas-ocupacionales/constantes";
import {
  agregarPaginacionPdf,
  anchoUtilPdf,
  asegurarEspacioPdf,
  crearDocumentoPdf,
  dibujarEncabezadoPdfApracom,
  finalizarPdf,
  recolectarPdf,
} from "@/servicios/documentos/pdf/pdf-comun";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

const GRIS = "#e5e7eb";
const BORDE = "#4b5563";
const TEXTO = "#111827";

const TIPOS_EVAL: Record<string, string> = {
  INGRESO: "INGRESO", PERIODICA: "PERIÓDICO",
  REINGRESO: "REINTEGRO", RETIRO: "RETIRO",
};

function celda(
  doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number,
  txt: string, bold?: boolean, center?: boolean, bg?: string, sz = 7.4,
) {
  if (bg) { doc.save().fillColor(bg).rect(x, y, w, h).fill().restore(); }
  doc.rect(x, y, w, h).lineWidth(0.45).strokeColor(BORDE).stroke()
    .font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(sz).fillColor(TEXTO)
    .text(txt || "", x + 2, y + 2, { width: w - 4, height: h - 4, align: center ? "center" : "left", lineGap: 0.3 });
}

function filaFilas(
  doc: PDFKit.PDFDocument, y: number, ws: number[], vs: string[], h: number,
  bold?: boolean, center?: boolean, bg?: string, sz = 7.4,
): number {
  let x = doc.page.margins.left;
  vs.forEach((v, i) => { celda(doc, x, y, ws[i], h, v, bold, center, bg, sz); x += ws[i]; });
  return y + h;
}

function tituloSec(doc: PDFKit.PDFDocument, t: string, y: number, w: number): number {
  celda(doc, doc.page.margins.left, y, w, 16, t, true, false, "#f0fdf4", 8.5);
  return y + 16;
}

function chk(v: unknown): string {
  if (typeof v === "boolean") return v ? "[X]" : "[ ]";
  if (typeof v === "string") return v === "SI" ? "[X]" : "[ ]";
  return "[ ]";
}

function txt(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function hTexto(doc: PDFKit.PDFDocument, t: string, w: number, s: number): number {
  if (!t) return 0;
  return doc.font("Helvetica").fontSize(s).heightOfString(t, { width: w, lineGap: 0.3 });
}

export async function generarFichaPdf(ficha: FichaPdfDto): Promise<Buffer> {
  const doc = crearDocumentoPdf({
    titulo: `Ficha ocupacional ${ficha.tipoEvaluacion}`,
    autor: ficha.profesional,
  });
  const res = recolectarPdf(doc);
  const v = ficha.valores;

  function hdr(cont = false) {
    return dibujarEncabezadoPdfApracom(doc, {
      titulo: cont ? "FICHA MÉDICA OCUPACIONAL - CONTINUACIÓN" : "FICHA MÉDICA OCUPACIONAL",
      subtitulo: `${TIPOS_EVAL[ficha.tipoEvaluacion] ?? ficha.tipoEvaluacion} · ${formatearFecha(ficha.fechaAtencion)}`,
      metadatos: [`${ficha.trabajador} · ${ficha.numeroDocumento}`, `${ficha.empresa} · ${ficha.departamento}`],
      compacto: cont,
    });
  }

  // Safe page check: syncs doc.y, adds page if needed, returns current Y position
  function sp(need: number): boolean {
    doc.y = y;
    if (asegurarEspacioPdf(doc, need, () => { hdr(true); })) {
      y = doc.y;
      return true;
    }
    return false;
  }

  hdr();
  const x = doc.page.margins.left;
  const A = anchoUtilPdf(doc);
  let y = doc.y;

  // ========================================================================
  // A. DATOS DEL ESTABLECIMIENTO - DATOS DEL USUARIO
  // ========================================================================
  sp(120);
  y = tituloSec(doc, "A. DATOS DEL ESTABLECIMIENTO - DATOS DEL USUARIO", y, A);
  const a1 = [A * 0.17, A * 0.17, A * 0.14, A * 0.22, A * 0.15, A * 0.15];
  y = filaFilas(doc, y, a1, ["INSTITUCIÓN DEL SISTEMA", "RUC", "CIIU", "ESTABLECIMIENTO / CENTRO DE TRABAJO", "N° HISTORIA CLÍNICA", "N° ARCHIVO"], 18, true, true, GRIS, 6.5);
  y = filaFilas(doc, y, a1, [v.institucionSistema || "PRIVADO", v.ruc || "", v.ciiu || "", v.establecimiento || ficha.empresa, v.numeroHistoriaClinica || "", ficha.numeroArchivo || ""], 20, false, true, undefined, 7);
  const a2 = [A * 0.17, A * 0.17, A * 0.17, A * 0.17, A * 0.12, A * 0.20];
  y = filaFilas(doc, y, a2, ["PRIMER APELLIDO", "SEGUNDO APELLIDO", "PRIMER NOMBRE", "SEGUNDO NOMBRE", "SEXO", "PUESTO DE TRABAJO (CIUO)"], 18, true, true, GRIS, 6.5);
  y = filaFilas(doc, y, a2, [v.primerApellido || "", v.segundoApellido || "", v.primerNombre || "", v.segundoNombre || "", sexoLabel(v.sexo), v.puestoTrabajoCIUO || ""], 20, false, true, undefined, 7);
  const a3 = [A * 0.50, A * 0.10, A * 0.15, A * 0.08, A * 0.09, A * 0.08];
  y = filaFilas(doc, y, a3, ["ATENCIÓN PRIORITARIA", "SEXO", "FECHA NACIMIENTO", "EDAD", "GRUPO SANG.", "LATERALIDAD"], 18, true, true, GRIS, 6.5);
  const prio = `Emb:${chk(v.atencionEmbarazada)} Disc:${chk(v.atencionDiscapacidad)} Cat:${chk(v.atencionCatastrofica)} Lac:${chk(v.atencionLactancia)} AM:${chk(v.atencionAdultoMayor)}`;
  y = filaFilas(doc, y, a3, [prio, sexoLabel(v.sexo), String(v.fechaNacimiento ?? ""), v.edad != null ? String(v.edad) : "", v.grupoSanguineo || "", v.lateralidad || ""], 22, false, false, undefined, 6.5);

  // ========================================================================
  // B. MOTIVO DE CONSULTA
  // ========================================================================
  sp(90);
  y = tituloSec(doc, "B. MOTIVO DE CONSULTA", y, A);
  const tipoE = TIPOS_EVAL[ficha.tipoEvaluacion] ?? ficha.tipoEvaluacion;
  const b1 = [A * 0.35, A * 0.35, A * 0.30];
  y = filaFilas(doc, y, b1, [`PUESTO DE TRABAJO CIUO: ${v.puestoTrabajoCIUO || ""}`, `FECHA ATENCIÓN: ${v.fechaAtencion || ""}`, ""], 18, false, false, undefined, 6.5);
  y = filaFilas(doc, y, b1, [`F.INGRESO TRABAJO: ${v.fechaIngresoTrabajo || ""}`, `F.REINTEGRO: ${v.fechaReintegro || ""}`, `F.SALIDA: ${v.fechaSalida || ""}`], 18, false, false, undefined, 6.5);
  y = filaFilas(doc, y, [A / 4, A / 4, A / 4, A / 4], ["INGRESO", "PERIÓDICO", "REINTEGRO", "RETIRO"].map(t => `${chk(tipoE === t)} ${t}`), 18, false, true, undefined, 7);
  const obsH = Math.max(20, hTexto(doc, v.observacionMotivo || "", A - 8, 6.5) + 6);
  celda(doc, x, y, A, obsH, `OBSERVACIÓN: ${v.observacionMotivo || ""}`, false, false, undefined, 6.5);
  y += obsH + 3;

  // ========================================================================
  // C. ANTECEDENTES PERSONALES
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "C. ANTECEDENTES PERSONALES", y, A);
  const cH = (t: string) => Math.max(20, hTexto(doc, t || "", A - 8, 6.5) + 6);
  let ch = cH(v.antecedentesClinicosQuirurgicos || "");
  celda(doc, x, y, A, ch, `ANTECEDENTES CLÍNICOS Y QUIRÚRGICOS: ${v.antecedentesClinicosQuirurgicos || ""}`, false, false, undefined, 6.5);
  y += ch + 2;
  ch = cH(v.antecedentesFamiliares || "");
  celda(doc, x, y, A, ch, `ANTECEDENTES FAMILIARES: ${v.antecedentesFamiliares || ""}`, false, false, undefined, 6.5);
  y += ch + 2;
  const c2 = [A * 0.25, A * 0.08, A * 0.08, A * 0.25, A * 0.08, A * 0.08, A * 0.18];
  y = filaFilas(doc, y, c2, ["AUTORIZA TRANSFUSIONES", `S:${chk(v.autorizaTransfusiones === "SI")}`, `N:${chk(v.autorizaTransfusiones === "NO")}`, "TRATAMIENTO HORMONAL", `S:${chk(v.tratamientoHormonal === "SI")}`, `N:${chk(v.tratamientoHormonal === "NO")}`, v.tratamientoHormonalCual || ""], 20, false, false, undefined, 6.5);

  y = tituloSec(doc, "ANTECEDENTES GINECO-OBSTÉTRICOS", y, A);
  const go = [A * 0.22, A * 0.12, A * 0.12, A * 0.12, A * 0.12, A * 0.30];
  y = filaFilas(doc, y, go, ["F.U.M", "GESTAS", "PARTOS", "CESÁREAS", "ABORTOS", "PLANIFICACIÓN FAMILIAR"], 18, true, true, GRIS, 6.5);
  y = filaFilas(doc, y, go, [String(v.fechaUltimaMenstruacion ?? ""), v.gestas != null ? String(v.gestas) : "", v.partos != null ? String(v.partos) : "", v.cesareas != null ? String(v.cesareas) : "", v.abortos != null ? String(v.abortos) : "", `${v.planificacionFamiliarFemenina || ""} ${v.metodoPlanificacionFemenina || ""}`], 20, false, false, undefined, 6.5);

  const exF = v.examenesFemeninos as Array<Record<string, unknown>> | undefined;
  if (exF && exF.length > 0) {
    exF.forEach((ex) => {
      const et = `EXAMEN: ${txt(ex.examen)}  TIEMPO: ${txt(ex.tiempo)}  RESULTADO: ${txt(ex.resultado)}`;
      const eh = Math.max(20, hTexto(doc, et, A - 8, 6.5) + 6); celda(doc, x, y, A, eh, et, false, false, undefined, 6.5); y += eh + 2;
    });
  }

  y = tituloSec(doc, "ANTECEDENTES REPRODUCTIVOS MASCULINOS", y, A);
  y = filaFilas(doc, y, [A * 0.40, A * 0.30, A * 0.30], [`PLANIFICACIÓN: ${v.planificacionFamiliarMasculina || ""}`, `MÉTODO: ${v.metodoPlanificacionMasculina || ""}`, ""], 20, false, false, undefined, 6.5);
  const exM = v.examenesMasculinos as Array<Record<string, unknown>> | undefined;
  if (exM && exM.length > 0) {
    exM.forEach((ex) => {
      const et = `EXAMEN: ${txt(ex.examen)}  TIEMPO: ${txt(ex.tiempo)}  RESULTADO: ${txt(ex.resultado)}`;
      const eh = Math.max(20, hTexto(doc, et, A - 8, 6.5) + 6); celda(doc, x, y, A, eh, et, false, false, undefined, 6.5); y += eh + 2;
    });
  }

  const csA = v.consumoSustancias as Array<Record<string, unknown>> | undefined;
  if (csA && csA.length > 0) {
    y = tituloSec(doc, "CONSUMO DE SUSTANCIAS", y, A);
    const csW = [A * 0.20, A * 0.20, A * 0.12, A * 0.12, A * 0.12, A * 0.24];
    y = filaFilas(doc, y, csW, ["SUSTANCIA", "TIEMPO CONSUMO", "EX CONSUM.", "TIEMPO ABST.", "NO CONSUME", "OBSERVACIÓN"], 18, true, true, GRIS, 6.5);
    csA.forEach((cs) => { y = filaFilas(doc, y, csW, [txt(cs.sustancia), txt(cs.tiempoConsumo), chk(cs.exConsumidor), txt(cs.tiempoAbstinencia), chk(cs.noConsume), ""], 20, false, false, undefined, 6.5); });
  }

  const ev = [A * 0.20, A * 0.20, A * 0.15, A * 0.20, A * 0.15, A * 0.10];
  y = filaFilas(doc, y, ev, ["ACTIVIDAD FÍSICA", "¿CUÁL?", "TIEMPO", "MEDICACIÓN HABITUAL", "¿CUÁL?", "CANTIDAD"], 18, true, true, GRIS, 6.5);
  y = filaFilas(doc, y, ev, [v.actividadFisica || "", v.actividadFisicaCual || "", v.actividadFisicaTiempo || "", v.medicacionHabitual || "", v.medicacionHabitualCual || "", v.medicacionHabitualCantidad || ""], 20, false, false, undefined, 6.5);
  if (v.observacionEstiloVida) {
    const oe = Math.max(20, hTexto(doc, v.observacionEstiloVida, A - 8, 6.5) + 6);
    celda(doc, x, y, A, oe, `OBSERVACIÓN: ${v.observacionEstiloVida}`, false, false, undefined, 6.5); y += oe + 2;
  }

  // ========================================================================
  // D. ENFERMEDAD O PROBLEMA ACTUAL
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "D. ENFERMEDAD O PROBLEMA ACTUAL", y, A);
  celda(doc, x, y, A, 22, `${chk(v.noRefiereSintomatologia)} NO REFIERE NINGÚN TIPO DE SINTOMATOLOGÍA AL MOMENTO`, false, false, undefined, 7);
  y += 24;
  const dH = Math.max(22, hTexto(doc, v.descripcionProblemaActual || "", A - 8, 6.5) + 8);
  celda(doc, x, y, A, dH, v.descripcionProblemaActual || "", false, false, undefined, 6.5);
  y += dH + 3;

  // ========================================================================
  // E. CONSTANTES VITALES Y ANTROPOMETRÍA
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "E. CONSTANTES VITALES Y ANTROPOMETRÍA", y, A);
  const ew = [A * 0.12, A * 0.13, A * 0.13, A * 0.13, A * 0.13, A * 0.10, A * 0.10, A * 0.08, A * 0.08];
  y = filaFilas(doc, y, ew, ["TEMP.(°C)", "P.ARTERIAL (mmHg)", "F.CARD.(Lat/min)", "F.RESP.(rpm)", "SAT.O2 (%)", "PESO (Kg)", "TALLA (cm)", "IMC", "PERÍM.ABD.(cm)"], 18, true, true, GRIS, 6);
  y = filaFilas(doc, y, ew, [v.temperatura != null ? String(v.temperatura) : "", v.presionArterial || "", v.frecuenciaCardiaca != null ? String(v.frecuenciaCardiaca) : "", v.frecuenciaRespiratoria != null ? String(v.frecuenciaRespiratoria) : "", v.saturacionOxigeno != null ? String(v.saturacionOxigeno) : "", v.peso != null ? String(v.peso) : "", v.talla != null ? String(v.talla) : "", v.imc != null ? String(v.imc) : "", v.perimetroAbdominal != null ? String(v.perimetroAbdominal) : ""], 22, false, true, undefined, 7);

  // ========================================================================
  // F. EXAMEN FÍSICO REGIONAL
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "F. EXAMEN FÍSICO REGIONAL", y, A);
  const regiones = ["Piel y anexos", "Ojos", "Oído", "Orofaringe", "Nariz", "Cuello", "Tórax", "Abdomen", "Columna", "Pelvis", "Extremidades", "Neurológico"];
  const fw = [A * 0.25, A * 0.08, A * 0.25, A * 0.08, A * 0.25, A * 0.09];
  const efV = v.examenFisico as Record<string, { presente?: boolean; descripcion?: string }> | undefined;
  for (let i = 0; i < regiones.length; i += 2) {
    const r1 = regiones[i]; const r2 = regiones[i + 1];
    const e1 = efV?.[r1]; const e2 = r2 ? efV?.[r2] : undefined;
    y = filaFilas(doc, y, fw, [r1, chk(e1?.presente), r2 || "", r2 ? chk(e2?.presente) : "", e1?.descripcion || "", e2?.descripcion || ""], 20, false, false, undefined, 6.5);
  }
  if (v.observacionesExamenFisico) {
    const fe = Math.max(20, hTexto(doc, v.observacionesExamenFisico, A - 8, 6.5) + 6);
    celda(doc, x, y, A, fe, `OBSERVACIÓN: ${v.observacionesExamenFisico}`, false, false, undefined, 6.5); y += fe + 2;
  }

  // ========================================================================
  // G. FACTORES DE RIESGO DEL TRABAJO ACTUAL
  // ========================================================================
  sp(80);
  y = tituloSec(doc, "G. FACTORES DE RIESGO DEL TRABAJO ACTUAL", y, A);
  const rf = v.factoresRiesgo as Record<string, string[]> | undefined;
  const rfCats: Array<{ label: string; key: string; items: readonly string[] }> = [
    { label: "FÍSICO", key: "fisico", items: RIESGOS_FISICO },
    { label: "SEGURIDAD", key: "seguridad", items: RIESGOS_SEGURIDAD },
    { label: "QUÍMICO", key: "quimico", items: RIESGOS_QUIMICO },
    { label: "BIOLÓGICO", key: "biologico", items: RIESGOS_BIOLOGICO },
    { label: "ERGONÓMICO", key: "ergonomico", items: RIESGOS_ERGONOMICO },
    { label: "PSICOSOCIAL", key: "psicosocial", items: RIESGOS_PSICOSOCIAL },
  ];
  const actividades = Array.isArray(v.actividadesRiesgo)
    ? v.actividadesRiesgo.filter(
      (actividad): actividad is {
        descripcion?: string;
        factores?: Record<string, string[]>;
        otros?: Record<string, string | undefined>;
      } =>
        Boolean(actividad) && typeof actividad === "object",
    )
    : [];
  const actividadesConMatriz = actividades.filter((actividad) => actividad.factores);
  const subcategoriaSeguridad = new Map<string, string>(
    GRUPOS_RIESGO_SEGURIDAD.flatMap((grupo) =>
      grupo.riesgos.map((riesgo) => [riesgo, grupo.subcategoria] as const),
    ),
  );

  if (actividadesConMatriz.length > 0) {
    for (let inicio = 0; inicio < actividadesConMatriz.length; inicio += 5) {
      const grupo = actividadesConMatriz.slice(inicio, inicio + 5);
      const anchoFactor = A * 0.42;
      const anchoActividad = (A - anchoFactor) / grupo.length;
      const anchos = [anchoFactor, ...grupo.map(() => anchoActividad)];
      const imprimirEncabezadoMatriz = () => {
        y = filaFilas(
          doc,
          y,
          anchos,
          ["FACTOR DE RIESGO", ...grupo.map((actividad, indice) => actividad.descripcion || `Actividad ${inicio + indice + 1}`)],
          28,
          true,
          true,
          GRIS,
          6,
        );
      };
      const nuevaPaginaMatriz = () => {
        doc.addPage();
        hdr(true);
        y = doc.y;
        imprimirEncabezadoMatriz();
      };
      if (inicio > 0) nuevaPaginaMatriz();
      else {
        sp(42);
        imprimirEncabezadoMatriz();
      }

      rfCats.forEach((categoria) => {
        if (categoria.key === "quimico") {
          nuevaPaginaMatriz();
        } else if (sp(categoria.items.length * 14 + 200)) {
          imprimirEncabezadoMatriz();
        }
        categoria.items.forEach((factor) => {
          const subcategoria = categoria.key === "seguridad"
            ? subcategoriaSeguridad.get(factor)
            : undefined;
          const etiqueta = [categoria.label, subcategoria, factor].filter(Boolean).join(" / ");
          const selecciones = grupo.map((actividad) => {
            const seleccionado = (actividad.factores?.[categoria.key] ?? []).includes(factor);
            if (!seleccionado) return chk(false);
            const detalleOtro = factor === "Otros" ? actividad.otros?.[categoria.key]?.trim() : "";
            return detalleOtro ? `${chk(true)} ${detalleOtro}` : chk(true);
          });
          const alto = Math.max(
            14,
            hTexto(doc, etiqueta, anchoFactor - 4, 5.5) + 4,
            ...selecciones.map((seleccion) => hTexto(doc, seleccion, anchoActividad - 4, 5.5) + 4),
          );
          sp(alto + 2);
          y = filaFilas(
            doc,
            y,
            anchos,
            [etiqueta, ...selecciones],
            alto,
            false,
            true,
            undefined,
            5.5,
          );
        });
      });
    }
  } else {
    const gw = [A * 0.18, A * 0.10, A * 0.18, A * 0.10, A * 0.18, A * 0.10, A * 0.16];
    rfCats.forEach((cat) => {
      const sel = (rf?.[cat.key] as string[]) || [];
      for (let i = 0; i < cat.items.length; i += 3) {
        const r = [i === 0 ? cat.label : "", chk(sel.includes(cat.items[i])), cat.items[i], chk(sel.includes(cat.items[i + 1] ?? "")), cat.items[i + 1] ?? "", chk(sel.includes(cat.items[i + 2] ?? "")), cat.items[i + 2] ?? ""];
        sp(20); y = filaFilas(doc, y, gw, r, 14, false, false, undefined, 5.8);
      }
    });
  }
  if (v.medidasPreventivas) {
    const mp = Math.max(20, hTexto(doc, v.medidasPreventivas, A - 8, 6.5) + 6);
    celda(doc, x, y, A, mp, `MEDIDAS PREVENTIVAS: ${v.medidasPreventivas}`, false, false, undefined, 6.5); y += mp + 2;
  }

  // ========================================================================
  // H. ANTECEDENTES LABORALES
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "H. ACTIVIDAD LABORAL / INCIDENTES / ACCIDENTES / ENFERMEDADES OCUPACIONALES", y, A);
  const alA = v.antecedentesLaborales as Array<Record<string, unknown>> | undefined;
  const hw = [A * 0.20, A * 0.18, A * 0.08, A * 0.08, A * 0.08, A * 0.08, A * 0.08, A * 0.08, A * 0.14];
  y = filaFilas(doc, y, hw, ["CENTRO TRABAJO", "ACTIVIDADES", "ANT.", "ACT.", "TIEMPO", "INC.", "ACC.", "ENF.PROF.", "OBSERVACIONES"], 18, true, true, GRIS, 6);
  if (alA && alA.length > 0) {
    alA.forEach((al) => { y = filaFilas(doc, y, hw, [txt(al.centroTrabajo), txt(al.actividades), chk(al.trabajoAnterior), chk(al.trabajoActual), txt(al.tiempo), chk(al.incidente), chk(al.accidente), chk(al.enfermedad), txt(al.observaciones)], 20, false, false, undefined, 6); });
  } else {
    celda(doc, x, y, A, 20, "Sin antecedentes laborales registrados.", false, false, undefined, 6.5); y += 22;
  }

  // ========================================================================
  // I. ACTIVIDADES EXTRALABORALES
  // ========================================================================
  sp(40);
  y = tituloSec(doc, "I. ACTIVIDADES EXTRALABORALES", y, A);
  const aeA = v.actividadesExtralaborales as Array<Record<string, unknown>> | undefined;
  const iw = [A * 0.25, A * 0.55, A * 0.20];
  y = filaFilas(doc, y, iw, ["TIPO DE ACTIVIDAD", "DESCRIPCIÓN", "FECHA"], 18, true, true, GRIS, 6.5);
  if (aeA && aeA.length > 0) {
    aeA.forEach((ae) => { y = filaFilas(doc, y, iw, [txt(ae.tipo), txt(ae.descripcion), txt(ae.fecha)], 20, false, false, undefined, 6.5); });
  } else {
    celda(doc, x, y, A, 20, "Sin actividades extralaborales registradas.", false, false, undefined, 6.5); y += 22;
  }

  // ========================================================================
  // J. RESULTADOS DE EXÁMENES
  // ========================================================================
  sp(40);
  y = tituloSec(doc, "J. RESULTADOS DE EXÁMENES GENERALES Y ESPECÍFICOS", y, A);
  const reA = v.resultadosExamenes as Array<Record<string, unknown>> | undefined;
  const jw = [A * 0.30, A * 0.20, A * 0.50];
  y = filaFilas(doc, y, jw, ["NOMBRE DEL EXAMEN", "FECHA", "RESULTADOS"], 18, true, true, GRIS, 6.5);
  if (reA && reA.length > 0) {
    reA.forEach((re) => { y = filaFilas(doc, y, jw, [txt(re.nombre), txt(re.fecha), txt(re.resultados)], 20, false, false, undefined, 6.5); });
  } else {
    celda(doc, x, y, A, 20, "Sin resultados de exámenes registrados.", false, false, undefined, 6.5); y += 22;
  }
  if (v.observacionesResultados) {
    const jo = Math.max(20, hTexto(doc, v.observacionesResultados, A - 8, 6.5) + 6);
    celda(doc, x, y, A, jo, `OBSERVACIONES: ${v.observacionesResultados}`, false, false, undefined, 6.5); y += jo + 2;
  }

  // ========================================================================
  // K. DIAGNÓSTICOS
  // ========================================================================
  sp(40);
  y = tituloSec(doc, "K. DIAGNÓSTICO - PRE: PRESUNTIVO / DEF: DEFINITIVO", y, A);
  const kw = [A * 0.08, A * 0.12, A * 0.50, A * 0.15, A * 0.15];
  y = filaFilas(doc, y, kw, ["N°", "CIE-10", "DESCRIPCIÓN", "PRE", "DEF"], 18, true, true, GRIS, 6.5);
  const dA = v.diagnosticos as Array<{ codigo?: string; descripcion?: string; pre?: boolean; def?: boolean }> | undefined;
  if (dA && dA.length > 0) {
    dA.forEach((d, i) => {
      const dh = Math.max(20, hTexto(doc, d.descripcion || "", kw[2] - 6, 6.5) + 6);
      const ml = doc.page.margins.left;
      sp(dh + 5);
      let cx = ml; celda(doc, cx, y, kw[0], dh, String(i + 1), false, true, undefined, 6.5); cx += kw[0];
      celda(doc, cx, y, kw[1], dh, d.codigo || "", false, true, undefined, 6.5); cx += kw[1];
      celda(doc, cx, y, kw[2], dh, d.descripcion || "", false, false, undefined, 6.5); cx += kw[2];
      celda(doc, cx, y, kw[3], dh, chk(d.pre), false, true, undefined, 6.5); cx += kw[3];
      celda(doc, cx, y, kw[4], dh, chk(d.def), false, true, undefined, 6.5);
      y += dh;
    });
  }
  for (let i = 0; i < 3; i++) {
    sp(24); y = filaFilas(doc, y, kw, [String((dA?.length || 0) + i + 1), "", "", "", ""], 18, false, false, undefined, 6.5);
  }

  // ========================================================================
  // L. APTITUD MÉDICA PARA EL TRABAJO
  // ========================================================================
  sp(80);
  y = tituloSec(doc, "L. APTITUD MÉDICA PARA EL TRABAJO", y, A);
  const apts = ["APTO", "APTO EN OBSERVACIÓN", "APTO CON LIMITACIONES", "NO APTO"];
  const aLbl = aptLabel(v.aptitudMedica as string | null);
  y = filaFilas(doc, y, [A / 4, A / 4, A / 4, A / 4], apts.map(a => `${chk(aLbl === a)} ${a}`), 20, false, true, undefined, 7);
  const lo = Math.max(28, hTexto(doc, v.observacionesAptitud || "", A - 8, 6.5) + 10);
  celda(doc, x, y, A, lo, `DETALLE DE OBSERVACIONES:\n${v.observacionesAptitud || "Sin observaciones registradas."}`, false, false, undefined, 6.5);
  y += lo + 3;

  // ========================================================================
  // M. RECOMENDACIONES
  // ========================================================================
  sp(40);
  y = tituloSec(doc, "M. RECOMENDACIONES Y/O TRATAMIENTO", y, A);
  const recA = v.recomendaciones as Array<{ descripcion?: string }> | undefined;
  const rTxt = recA?.map((r) => r.descripcion).filter(Boolean).join("\n") || "";
  const mr = Math.max(28, hTexto(doc, rTxt || "SEGUIR NORMATIVA DE SEGURIDAD Y SALUD DE LA EMPRESA", A - 8, 6.5) + 10);
  celda(doc, x, y, A, mr, rTxt || "SEGUIR NORMATIVA DE SEGURIDAD Y SALUD DE LA EMPRESA", false, false, undefined, 6.5);
  y += mr + 3;

  // ========================================================================
  // N. RETIRO
  // ========================================================================
  sp(60);
  y = tituloSec(doc, "N. RETIRO (EVALUACIÓN)", y, A);
  const nw = [A * 0.50, A * 0.08, A * 0.08, A * 0.34];
  y = filaFilas(doc, y, nw, ["SE REALIZA LA EVALUACIÓN", `S:${chk(v.retiroRealizaEvaluacion === "SI")}`, `N:${chk(v.retiroRealizaEvaluacion === "NO")}`, ""], 20, false, false, undefined, 6.5);
  y = filaFilas(doc, y, nw, ["LA CONDICIÓN DE SALUD ESTÁ RELACIONADA CON EL TRABAJO", `S:${chk(v.retiroRelacionadoTrabajo === "SI")}`, `N:${chk(v.retiroRelacionadoTrabajo === "NO")}`, ""], 20, false, false, undefined, 6.5);
  if (v.retiroObservacion) {
    const no = Math.max(20, hTexto(doc, v.retiroObservacion, A - 8, 6.5) + 6);
    celda(doc, x, y, A, no, `OBSERVACIÓN: ${v.retiroObservacion}`, false, false, undefined, 6.5); y += no + 2;
  }

  // ========================================================================
  // O. DATOS DEL MÉDICO
  // ========================================================================
  sp(130);
  y = tituloSec(doc, "O. DATOS DEL MÉDICO", y, A);
  const ow = [A * 0.30, A * 0.70];
  y = filaFilas(doc, y, ow, ["NOMBRES Y APELLIDOS DEL MÉDICO", v.profesionalNombres || "No registrado"], 22, false, false, undefined, 7);
  y = filaFilas(doc, y, ow, ["CÓDIGO MÉDICO", v.profesionalCodigoMedico || "No registrado"], 22, false, false, undefined, 7);
  y = filaFilas(doc, y, ow, ["FIRMA Y SELLO", ""], 45, false, false, undefined, 7);

  // ========================================================================
  // P. FIRMA DEL TRABAJADOR
  // ========================================================================
  sp(130);
  y = tituloSec(doc, "P. FIRMA DEL TRABAJADOR", y, A);
  y = filaFilas(doc, y, ow, ["NOMBRE DEL TRABAJADOR", ficha.trabajador], 22, false, false, undefined, 7);
  y = filaFilas(doc, y, ow, ["DOCUMENTO", ficha.numeroDocumento], 22, false, false, undefined, 7);
  y = filaFilas(doc, y, ow, ["FIRMA", ""], 45, false, false, undefined, 7);
  y = filaFilas(doc, y, ow, ["FECHA", String(v.firmaTrabajadorFecha || ficha.fechaAtencion || "")], 22, false, false, undefined, 7);

  agregarPaginacionPdf(doc, `Ficha ${ficha.tipoEvaluacion} · ${ficha.numeroDocumento}`);
  return finalizarPdf(doc, res);
}

function aptLabel(v: string | null): string {
  if (!v) return "NO REGISTRADO";
  const m: Record<string, string> = { APTO: "APTO", APTO_EN_OBSERVACION: "APTO EN OBSERVACIÓN", APTO_CON_LIMITACIONES: "APTO CON LIMITACIONES", NO_APTO: "NO APTO" };
  return m[v] ?? v;
}

function sexoLabel(s: string | null | undefined): string {
  if (!s) return "";
  const m: Record<string, string> = { MASCULINO: "MASCULINO", FEMENINO: "FEMENINO", OTRO: "OTRO", NO_ESPECIFICADO: "NO ESPECIFICADO" };
  return m[s] ?? s;
}
