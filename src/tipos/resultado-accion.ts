export type ResultadoAccion<T = undefined> =
  | { exito: true; datos?: T; mensaje?: string }
  | { exito: false; mensaje: string; erroresCampos?: Record<string, string[]> };
