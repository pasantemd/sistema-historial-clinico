import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nombres: string;
      apellidos: string;
      correo: string;
      roles: string[];
      permisos: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    roles: string[];
    permisos: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string;
    roles: string[];
    permisos: string[];
  }
}
