import {
  actualizarDatosProfesionalRepositorio,
  consultarDatosProfesionalRepositorio,
} from "@/modulos/configuracion-profesional/repositorios/profesional.repositorio";
import type { DatosProfesional } from "@/modulos/configuracion-profesional/validaciones/profesional.schema";

function dividirNombreCompleto(nombreCompleto: string) {
  const partes = nombreCompleto.trim().replace(/\s+/g, " ").split(" ");

  if (partes.length === 1) {
    return { nombres: partes[0], apellidos: "" };
  }

  if (partes.length === 2) {
    return { nombres: partes[0], apellidos: partes[1] };
  }

  const corte = partes.length >= 4 ? Math.ceil(partes.length / 2) : 2;

  return {
    nombres: partes.slice(0, corte).join(" "),
    apellidos: partes.slice(corte).join(" "),
  };
}

export async function actualizarDatosProfesional(usuarioId: string, datos: DatosProfesional) {
  const identidad = dividirNombreCompleto(datos.nombreCompleto);

  return actualizarDatosProfesionalRepositorio(usuarioId, {
    ...datos,
    ...identidad,
  });
}

export async function consultarDatosProfesional(usuarioId: string) {
  return consultarDatosProfesionalRepositorio(usuarioId);
}
