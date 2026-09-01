export function normalizarSustancia(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9]+/g, " ").trim();
}

const EQUIVALENCIAS: Record<string, string[]> = {
  amoxicilina: ["amoxicillin"],
  acetaminofen: ["paracetamol"],
  ibuprofeno: ["ibuprofen"],
};

export function coincideAlergiaMedicamento(medicamento: string, sustancia: string): boolean {
  const nombre = normalizarSustancia(medicamento);
  const alergeno = normalizarSustancia(sustancia);
  if (!nombre || !alergeno) return false;
  const equivalentes = new Set([alergeno, ...(EQUIVALENCIAS[alergeno] ?? [])].map(normalizarSustancia));
  return [...equivalentes].some((termino) => nombre === termino || nombre.startsWith(`${termino} `));
}

export function indicesMedicamentosAlergenosSinJustificar(
  medicamentos: Array<{ nombreGenerico: string; nombreComercial?: string; alertaAlergiaConfirmada: boolean; justificacionAlergia?: string }>,
  alergias: Array<{ sustancia: string }>,
): number[] {
  return medicamentos.flatMap((medicamento, indice) => {
    const coincide = alergias.some((alergia) => coincideAlergiaMedicamento(medicamento.nombreGenerico, alergia.sustancia) || coincideAlergiaMedicamento(medicamento.nombreComercial ?? "", alergia.sustancia));
    return coincide && (!medicamento.alertaAlergiaConfirmada || !medicamento.justificacionAlergia?.trim()) ? [indice] : [];
  });
}
