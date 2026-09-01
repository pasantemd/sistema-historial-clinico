import { prisma } from "@/servicios/base-datos/prisma";
import { headers } from "next/headers";

type ResultadoAuditoria = "EXITOSO" | "FALLIDO";

interface EventoAuditoria {
  usuarioId?: string | null;
  accion: string;
  modulo: string;
  entidad: string;
  entidadId?: string | null;
  agenteUsuario?: string | null;
  resultado: ResultadoAuditoria;
  datosAnteriores?: Record<string, string | boolean | null>;
  datosNuevos?: Record<string, string | boolean | null>;
}

function sanearAgenteUsuario(valor?: string | null): string | null {
  if (!valor) return null;
  return valor.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, 512) || null;
}

export async function registrarAuditoriaSegura(evento: EventoAuditoria): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: evento.usuarioId ?? null,
        accion: evento.accion,
        modulo: evento.modulo,
        entidad: evento.entidad,
        entidadId: evento.entidadId ?? null,
        direccionIp: null,
        agenteUsuario: sanearAgenteUsuario(evento.agenteUsuario),
        datosAnteriores: evento.datosAnteriores,
        datosNuevos: evento.datosNuevos,
        resultado: evento.resultado,
      },
      select: { id: true },
    });
  } catch {
    console.error("No fue posible registrar un evento de auditoría.");
  }
}

export async function obtenerAgenteUsuarioSolicitud(): Promise<string | null> {
  const cabeceras = await headers();
  return sanearAgenteUsuario(cabeceras.get("user-agent"));
}
