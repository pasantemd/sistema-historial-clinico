import { z } from "zod";

export const busquedaCie10Schema = z.string()
  .trim()
  .min(2, "Escriba al menos 2 caracteres.")
  .max(100, "La búsqueda no puede superar 100 caracteres.");
