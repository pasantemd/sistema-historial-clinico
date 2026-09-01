import type { Prisma } from "@/generated/prisma/client";

type SecuenciaDocumento =
  | "registro-diario"
  | "evaluacion-medica"
  | "ficha-ocupacional"
  | "documento-clinico";

const CONFIGURACION: Record<
  SecuenciaDocumento,
  { prefijo: string; digitos: number }
> = {
  "registro-diario": { prefijo: "RDA", digitos: 6 },
  "evaluacion-medica": { prefijo: "EM", digitos: 6 },
  "ficha-ocupacional": { prefijo: "FO", digitos: 6 },
  "documento-clinico": { prefijo: "DC", digitos: 6 },
};

export async function obtenerNumeroCorrelativo(
  tx: Prisma.TransactionClient,
  secuencia: SecuenciaDocumento,
): Promise<string> {
  let filas: Array<{ valor: bigint }>;

  switch (secuencia) {
    case "registro-diario":
      filas = await tx.$queryRaw`SELECT nextval('registro_diario_numero_seq')::bigint AS valor`;
      break;
    case "evaluacion-medica":
      filas = await tx.$queryRaw`SELECT nextval('evaluacion_medica_numero_seq')::bigint AS valor`;
      break;
    case "ficha-ocupacional":
      filas = await tx.$queryRaw`SELECT nextval('ficha_ocupacional_numero_seq')::bigint AS valor`;
      break;
    case "documento-clinico":
      filas = await tx.$queryRaw`SELECT nextval('documento_clinico_numero_seq')::bigint AS valor`;
      break;
  }

  const configuracion = CONFIGURACION[secuencia];
  const valor = filas[0]?.valor;
  if (valor === undefined) {
    throw new Error("No fue posible asignar el número correlativo.");
  }

  return `${configuracion.prefijo}-${String(valor).padStart(configuracion.digitos, "0")}`;
}
