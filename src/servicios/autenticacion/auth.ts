import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { CredencialesInvalidasError } from "@/modulos/autenticacion/errores/credenciales-invalidas.error";
import { DemasiadosIntentosError } from "@/modulos/autenticacion/errores/demasiados-intentos.error";
import { UsuarioInactivoError } from "@/modulos/autenticacion/errores/usuario-inactivo.error";
import { autenticarUsuario } from "@/modulos/autenticacion/servicios/autenticar-usuario.servicio";
import { iniciarSesionSchema } from "@/modulos/autenticacion/validaciones/iniciar-sesion.schema";
import {
  crearClaveLimiteInicioSesion,
  limpiarIntentosInicioSesion,
  registrarIntentoFallido,
  verificarLimiteInicioSesion,
} from "@/modulos/autenticacion/servicios/limite-intentos-inicio-sesion";

const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: DURACION_SESION_SEGUNDOS,
  },
  pages: {
    signIn: "/iniciar-sesion",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales, solicitud) {
        let claveLimite: string | null = null;
        try {
          const datos = iniciarSesionSchema.parse(credenciales);
          const direccionIp = String(solicitud.headers?.["x-forwarded-for"] ?? "")
            .split(",")[0]
            .trim() || null;
          claveLimite = crearClaveLimiteInicioSesion(datos.correo, direccionIp);
          await verificarLimiteInicioSesion(claveLimite);
          const agenteUsuario = solicitud.headers?.["user-agent"] ?? null;
          const usuario = await autenticarUsuario(datos, { agenteUsuario });
          await limpiarIntentosInicioSesion(claveLimite);
          return usuario;
        } catch (error) {
          if (
            error instanceof z.ZodError ||
            error instanceof CredencialesInvalidasError ||
            error instanceof UsuarioInactivoError ||
            error instanceof DemasiadosIntentosError
          ) {
            if (
              claveLimite &&
              !(error instanceof z.ZodError) &&
              !(error instanceof DemasiadosIntentosError)
            ) {
              await registrarIntentoFallido(claveLimite);
            }
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nombres = user.nombres;
        token.apellidos = user.apellidos;
        token.correo = user.correo;
        token.roles = [...new Set(user.roles)];
        token.permisos = [...new Set(user.permisos)];
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        nombres: token.nombres,
        apellidos: token.apellidos,
        correo: token.correo,
        email: token.correo,
        name: `${token.nombres} ${token.apellidos}`,
        roles: [...new Set(token.roles)],
        permisos: [...new Set(token.permisos)],
      };
      return session;
    },
  },
};
