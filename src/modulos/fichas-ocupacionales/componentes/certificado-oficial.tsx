import { APTITUDES_MEDICAS } from "@/modulos/fichas-ocupacionales/constantes";
import type { CertificadoFicha } from "@/modulos/fichas-ocupacionales/tipos";

import "./certificado-plantilla.css";

interface Props {
  ficha: CertificadoFicha;
}

const ETIQUETAS_EVALUACION: Record<string, string> = {
  INGRESO: "INGRESO",
  PERIODICA: "PERIÓDICO",
  REINGRESO: "REINTEGRO",
  RETIRO: "RETIRO",
};

const TIPOS_EVALUACION = ["INGRESO", "PERIÓDICO", "REINTEGRO", "RETIRO"];
const APTITUDES = ["APTO", "APTO EN OBSERVACIÓN", "APTO CON LIMITACIONES", "NO APTO"];

function etiquetaAptitud(valor: string | null): string {
  if (!valor) return "";
  return APTITUDES_MEDICAS.find((item) => item.valor === valor)?.etiqueta?.toUpperCase() ?? valor;
}

function primeraParte(valor: string, indice: number): string {
  return valor.trim().split(/\s+/)[indice] ?? "";
}

function Casilla({ marcada }: { marcada: boolean }) {
  return (
    <span className="certificado-casilla" aria-label={marcada ? "Seleccionado" : "No seleccionado"}>
      {marcada ? "X" : ""}
    </span>
  );
}

export function CertificadoEvaluacionOcupacionalOficial({ ficha }: Props) {
  const aptitud = etiquetaAptitud(ficha.aptitudMedica);
  const tipoEvaluacion = ETIQUETAS_EVALUACION[ficha.tipoEvaluacion] ?? ficha.tipoEvaluacion;
  const [anio = "", mes = "", dia = ""] = ficha.fechaAtencion.split("-");
  const recomendaciones = ficha.recomendaciones
    .map((recomendacion) => recomendacion.descripcion.trim())
    .filter(Boolean)
    .join("\n");

  return (
    <article id="certificado-ocupacional" className="certificado-oficial print-area">
      <header className="certificado-titulo">
        CERTIFICADO&nbsp; - &nbsp;EVALUACIÓN MÉDICA OCUPACIONAL
      </header>

      <section className="certificado-bloque">
        <h2 className="certificado-seccion-titulo">
          A. DATOS DEL ESTABLECIMIENTO - DATOS DEL USUARIO
        </h2>
        <table className="certificado-tabla certificado-tabla-establecimiento">
          <thead>
            <tr>
              <th>INSTITUCIÓN DEL SISTEMA</th>
              <th>RUC</th>
              <th>CIIU</th>
              <th>ESTABLECIMIENTO<br />(CENTRO DE TRABAJO)</th>
              <th>NÚMERO DE FORMULARIO</th>
              <th>NÚMERO DE ARCHIVO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{ficha.institucionSistema || "PRIVADO"}</td>
              <td>{ficha.ruc || ficha.empresa.ruc}</td>
              <td>{ficha.ciiu || ficha.empresa.actividadEconomicaCodigo || ""}</td>
              <td>{ficha.establecimiento || ficha.empresa.razonSocial}</td>
              <td>{ficha.numeroFormulario || ""}</td>
              <td>{ficha.numeroArchivo || ""}</td>
            </tr>
          </tbody>
        </table>

        <table className="certificado-tabla certificado-tabla-persona">
          <thead>
            <tr>
              <th>PRIMER APELLIDO</th>
              <th>SEGUNDO APELLIDO</th>
              <th>PRIMER NOMBRE</th>
              <th>SEGUNDO NOMBRE</th>
              <th>SEXO</th>
              <th>PUESTO DE TRABAJO (CIUO)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{ficha.primerApellido || primeraParte(ficha.trabajador.apellidos, 0)}</td>
              <td>{ficha.segundoApellido || primeraParte(ficha.trabajador.apellidos, 1)}</td>
              <td>{ficha.primerNombre || primeraParte(ficha.trabajador.nombres, 0)}</td>
              <td>{ficha.segundoNombre || primeraParte(ficha.trabajador.nombres, 1)}</td>
              <td>{ficha.trabajador.sexo}</td>
              <td>{ficha.puestoTrabajoCIUO || ""}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="certificado-separador" />

      <section className="certificado-bloque certificado-bloque-enmarcado">
        <h2 className="certificado-seccion-titulo">B. DATOS GENERALES</h2>
        <div className="certificado-datos-generales">
          <div className="certificado-fecha">
            <span>FECHA DE EMISIÓN:</span>
            <div className="certificado-fecha-campos">
              <span>{anio}</span>
              <span>{mes}</span>
              <span>{dia}</span>
              <small>aaaa</small>
              <small>mm</small>
              <small>dd</small>
            </div>
          </div>
          <div className="certificado-evaluacion">
            <span>EVALUACIÓN:</span>
            {TIPOS_EVALUACION.map((tipo) => (
              <label key={tipo}>
                <span>{tipo}</span>
                <Casilla marcada={tipo === tipoEvaluacion} />
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="certificado-separador" />

      <section className="certificado-bloque certificado-bloque-enmarcado">
        <h2 className="certificado-seccion-titulo">C. APTITUD MÉDICA PARA EL TRABAJO</h2>
        <p className="certificado-introduccion">
          Después de la valoración médica ocupacional se certifica que la persona en mención, es calificada como:
        </p>
        <div className="certificado-opciones-aptitud">
          {APTITUDES.map((opcion) => (
            <div key={opcion}>
              <span>{opcion}</span>
              <Casilla marcada={opcion === aptitud} />
            </div>
          ))}
        </div>
        <div className="certificado-observaciones">
          <strong>DETALLE DE OBSERVACIONES:</strong>
          <div className="certificado-lineas">{ficha.observacionesAptitud || ""}</div>
        </div>
      </section>

      <div className="certificado-separador" />

      <section className="certificado-bloque certificado-bloque-enmarcado">
        <h2 className="certificado-seccion-titulo">D. RECOMENDACIONES/OBSERVACIONES</h2>
        <div className={`certificado-recomendaciones${recomendaciones ? " certificado-recomendaciones-contenido" : ""}`}>
          {recomendaciones || "SEGUIR NORMATIVA DE SEGURIDAD Y SALUD DE LA EMPRESA"}
        </div>
      </section>

      <p className="certificado-declaracion">
        Con este documento certifico que el trabajador se ha sometido a la evaluación médica requerida para (el ingreso /la ejecución/ el reingreso y retiro) al puesto laboral y se le ha informado sobre los riesgos relacionados con el trabajo emitiendo recomendaciones relacionadas con su estado de salud.
      </p>
      <p className="certificado-confidencialidad">
        La presente certificación se expide con base en el formulario de Evaluación Ocupacional, el cual tiene carácter de confidencial.
      </p>

      <footer className="certificado-firmas">
        <section className="certificado-firma-profesional">
          <h2 className="certificado-seccion-titulo">E. DATOS DEL PROFESIONAL</h2>
          <div className="certificado-profesional-grid">
            <span className="certificado-etiqueta">NOMBRE Y APELLIDO</span>
            <span>{ficha.profesionalNombres || ""}</span>
            <span className="certificado-etiqueta">CÓDIGO MÉDICO</span>
            <span>{ficha.profesionalCodigoMedico || ""}</span>
            <span className="certificado-etiqueta certificado-etiqueta-firma">FIRMA Y<br />SELLO</span>
            <span className="certificado-espacio-firma" />
          </div>
        </section>
        <section className="certificado-firma-trabajador">
          <h2 className="certificado-seccion-titulo">F. FIRMA DEL TRABAJADOR</h2>
          <div className="certificado-espacio-firma-trabajador" />
        </section>
      </footer>
    </article>
  );
}
