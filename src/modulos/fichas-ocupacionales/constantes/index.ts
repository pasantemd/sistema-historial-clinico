import type { AptitudMedicaOcupacional, EstadoFichaOcupacional, TipoEvaluacionOcupacional } from "@/generated/prisma/enums";

export const TIPOS_EVALUACION: Array<{ valor: TipoEvaluacionOcupacional; etiqueta: string }> = [
  { valor: "INGRESO", etiqueta: "Ingreso" },
  { valor: "PERIODICA", etiqueta: "Periódica" },
  { valor: "REINGRESO", etiqueta: "Reingreso" },
  { valor: "RETIRO", etiqueta: "Retiro" },
];

export const ESTADOS_FICHA: Array<{ valor: EstadoFichaOcupacional; etiqueta: string }> = [
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "FINALIZADA", etiqueta: "Finalizada" },
  { valor: "ANULADA", etiqueta: "Anulada" },
];

export const APTITUDES_MEDICAS: Array<{ valor: AptitudMedicaOcupacional; etiqueta: string }> = [
  { valor: "APTO", etiqueta: "Apto" },
  { valor: "APTO_EN_OBSERVACION", etiqueta: "Apto en observación" },
  { valor: "APTO_CON_LIMITACIONES", etiqueta: "Apto con limitaciones" },
  { valor: "NO_APTO", etiqueta: "No apto" },
];

export const GRUPOS_SANGUINEOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

export const LATERALIDADES = [
  { valor: "DIESTRO", etiqueta: "Diestro" },
  { valor: "ZURDO", etiqueta: "Zurdo" },
  { valor: "AMBIDESTRO", etiqueta: "Ambidiestro" },
] as const;

export const INSTITUCIONES_SISTEMA = [
  { valor: "PRIVADO", etiqueta: "Privado" },
  { valor: "PUBLICO", etiqueta: "Público" },
  { valor: "OTRO", etiqueta: "Otro" },
] as const;

export const SI_NO = [
  { valor: "SI", etiqueta: "Sí" },
  { valor: "NO", etiqueta: "No" },
] as const;

export const SI_NO_NO_RESPONDE = [
  { valor: "SI", etiqueta: "Sí" },
  { valor: "NO", etiqueta: "No" },
  { valor: "NO_RESPONDE", etiqueta: "No responde" },
] as const;

export const RIESGOS_FISICO = [
  "Temperaturas altas",
  "Temperaturas bajas",
  "Radiación Ionizante",
  "Radiación No Ionizante",
  "Ruido",
  "Vibración",
  "Iluminación",
  "Ventilación",
  "Fluido eléctrico",
  "Otros",
];

export const GRUPOS_RIESGO_SEGURIDAD = [
  {
    subcategoria: "Locativos",
    riesgos: ["Falta de señalización, aseo, desorden"],
  },
  {
    subcategoria: "Mecánicos",
    riesgos: [
      "Atrapamiento entre máquinas y superficies",
      "Atrapamiento entre objetos",
      "Caída de objetos",
      "Caídas al mismo nivel",
      "Caídas a diferente nivel",
      "Pinchazos",
      "Cortes",
      "Choques / colisión vehicular",
      "Atropellamientos por vehículos",
      "Proyección de fluidos",
      "Proyección de partículas o fragmentos",
      "Contacto con superficies de trabajos",
    ],
  },
  {
    subcategoria: "Eléctricos",
    riesgos: ["Contacto eléctrico"],
  },
  {
    subcategoria: "Otros",
    riesgos: ["Otros"],
  },
] as const;

export const RIESGOS_SEGURIDAD = GRUPOS_RIESGO_SEGURIDAD.flatMap(
  (grupo) => [...grupo.riesgos],
);

export const RIESGOS_QUIMICO = [
  "Polvos",
  "Sólidos",
  "Humos",
  "Líquidos",
  "Vapores",
  "Aerosoles",
  "Neblinas",
  "Gaseosos",
  "Otros",
];

export const RIESGOS_BIOLOGICO = [
  "Virus",
  "Hongos",
  "Bacterias",
  "Parásitos",
  "Exposición a vectores",
  "Exposición a animales selváticos",
  "Otros",
];

export const RIESGOS_ERGONOMICO = [
  "Manejo manual de cargas",
  "Movimientos repetitivos",
  "Posturas forzadas",
  "Trabajos con PVD",
  "Diseño inadecuado del puesto",
  "Otros",
];

export const RIESGOS_PSICOSOCIAL = [
  "Monotonía del trabajo",
  "Sobrecarga laboral",
  "Minuciosidad de la tarea",
  "Alta responsabilidad",
  "Autonomía en la toma de decisiones",
  "Supervisión y estilos de dirección deficientes",
  "Conflicto de rol",
  "Falta de claridad en las funciones",
  "Incorrecta distribución del trabajo",
  "Turnos rotativos",
  "Relaciones interpersonales",
  "Inestabilidad laboral",
  "Amenaza delincuencial",
  "Otros",
];

export const REGIONES_EXAMEN_FISICO = [
  "Piel",
  "Ojos",
  "Oído",
  "Oro faringe",
  "Nariz",
  "Cuello",
  "Tórax",
  "Abdomen",
  "Columna",
  "Pelvis",
  "Extremidades",
  "Neurológico",
] as const;

export const PERMISOS_FICHA = {
  ver: "ficha-ocupacional.ver",
  crear: "ficha-ocupacional.crear",
  editar: "ficha-ocupacional.editar",
  finalizar: "ficha-ocupacional.finalizar",
  anular: "ficha-ocupacional.anular",
  certificado: "certificado-ocupacional.ver",
  exportarCertificado: "certificado-ocupacional.exportar",
} as const;

export function filtrarDepartamentos(
  departamentos: Array<{ id: string; empresaId: string; nombre: string }>,
  empresaId: string,
): Array<{ id: string; empresaId: string; nombre: string }> {
  if (!empresaId) return [];
  return departamentos.filter((item) => item.empresaId === empresaId);
}
