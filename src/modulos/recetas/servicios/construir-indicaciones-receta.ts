interface DatosIndicacionesReceta {
  indicacionesGenerales?: string | null;
  recomendaciones?: string | null;
  observaciones?: string | null;
  medicamentos: Array<{
    nombreMedicamentoHistorico: string;
    indicaciones?: string | null;
  }>;
}

export function construirIndicacionesReceta(receta: DatosIndicacionesReceta): string | null {
  const fragmentos = receta.medicamentos.map((medicamento) =>
    medicamento.indicaciones?.trim() || null,
  );
  const vistos = new Set<string>();
  const unicos = fragmentos
    .map((fragmento) => fragmento?.trim())
    .filter((fragmento): fragmento is string => Boolean(fragmento))
    .filter((fragmento) => {
      const clave = fragmento.toLocaleLowerCase("es").replace(/\s+/g, " ");
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });

  return unicos.length > 0 ? unicos.join("\n") : null;
}
