export interface ResultadoCie10 {
  id: string;
  codigo: string;
  descripcion: string;
  nivel: "CATEGORIA" | "SUBCATEGORIA";
  categoriaPadreCodigo: string | null;
  coincidenciaEncontrada: string;
  sugeridoPorSinonimo: boolean;
  prioridad: number;
}