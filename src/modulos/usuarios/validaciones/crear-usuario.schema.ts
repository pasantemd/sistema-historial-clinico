import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombres: z.string().trim().min(2).max(100),
  apellidos: z.string().trim().min(2).max(100),
  correo: z.string().trim().toLowerCase().pipe(z.email()),
  contrasena: z.string().min(8).max(128),
  rolId: z.uuid(),
  empresaIds: z.array(z.uuid()).min(1, "Seleccione al menos una empresa."),
  cedula: z.string().trim().max(30).optional().or(z.literal("")),
  codigoProfesional: z.string().trim().max(50).optional().or(z.literal("")),
  especialidad: z.string().trim().max(100).optional().or(z.literal("")),
});

export type EntradaCrearUsuario = z.infer<typeof crearUsuarioSchema>;
