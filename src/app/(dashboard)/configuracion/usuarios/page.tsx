import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { PaginaUsuarios } from "@/modulos/usuarios/componentes/pagina-usuarios";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import { prisma } from "@/servicios/base-datos/prisma";

export default async function PaginaUsuariosPage() {
  const usuarioActual = await requerirUsuario();
  await requerirPermiso("usuario.administrar");

  const usuarios = await prisma.usuario.findMany({
    where: {
      empresasAutorizadas: {
        some: {
          empresa: { usuariosAutorizados: { some: { usuarioId: usuarioActual.id } } },
        },
      },
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      correo: true,
      estado: true,
      roles: {
        select: {
          rol: { select: { id: true, nombre: true } },
        },
      },
    },
    orderBy: { correo: "asc" },
  });

  const [roles, empresas] = await Promise.all([prisma.rol.findMany({
    where: { nombre: { in: ["ADMINISTRADOR", "MÉDICO", "RECURSOS_HUMANOS"] } },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  }), prisma.empresa.findMany({
    where: {
      estado: "ACTIVO",
      usuariosAutorizados: { some: { usuarioId: usuarioActual.id } },
    },
    select: { id: true, razonSocial: true },
    orderBy: { razonSocial: "asc" },
  })]);

  const usuariosMapeados = usuarios.map((u) => ({
    id: u.id,
    nombres: u.nombres,
    apellidos: u.apellidos,
    correo: u.correo,
    estado: u.estado,
    rolUnico: u.roles[0]?.rol.id ?? null,
  }));

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/configuracion" />
      <Migas />
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Administración de usuarios del sistema"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-5 text-primary" aria-hidden />
            Usuarios del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaginaUsuarios
            usuarios={usuariosMapeados}
            roles={roles}
            empresas={empresas}
            usuarioActualId={usuarioActual.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
