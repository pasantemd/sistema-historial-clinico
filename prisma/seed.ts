import "dotenv/config";

import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validarEntornoDatos } from "../scripts/validar-entorno-datos";

validarEntornoDatos({
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const PERMISOS = [
  ["trabajador.ver", "Ver trabajadores", "trabajadores"],
  ["trabajador.crear", "Crear trabajadores", "trabajadores"],
  ["trabajador.editar", "Editar trabajadores", "trabajadores"],
  ["vinculo-laboral.ver", "Ver vínculos laborales", "vinculos-laborales"],
  ["vinculo-laboral.crear", "Crear vínculos laborales", "vinculos-laborales"],
  ["vinculo-laboral.editar", "Editar vínculos laborales", "vinculos-laborales"],
  ["departamento.ver", "Ver departamentos", "departamentos"],
  ["departamento.crear", "Crear departamentos", "departamentos"],
  ["departamento.editar", "Editar departamentos", "departamentos"],
  ["departamento.desactivar", "Desactivar departamentos", "departamentos"],
  ["empresa.ver", "Ver empresas", "empresas"],
  ["empresa.administrar", "Administrar empresas", "empresas"],
  ["usuario.administrar", "Administrar usuarios", "usuarios"],
  ["configuracion.editar", "Editar configuración", "configuracion"],
  ["auditoria.ver", "Ver auditoría del sistema", "auditoria"],
  ["ficha-ocupacional.ver", "Ver fichas ocupacionales", "fichas-ocupacionales"],
  ["ficha-ocupacional.crear", "Crear fichas ocupacionales", "fichas-ocupacionales"],
  ["ficha-ocupacional.editar", "Editar fichas ocupacionales", "fichas-ocupacionales"],
  ["ficha-ocupacional.finalizar", "Finalizar fichas ocupacionales", "fichas-ocupacionales"],
  ["ficha-ocupacional.anular", "Anular fichas ocupacionales", "fichas-ocupacionales"],
  ["certificado-ocupacional.ver", "Ver certificados ocupacionales", "fichas-ocupacionales"],
  ["certificado-ocupacional.exportar", "Exportar certificados ocupacionales", "fichas-ocupacionales"],
  ["evaluacion-medica.ver", "Ver evaluaciones médicas", "evaluaciones-medicas"],
  ["evaluacion-medica.crear", "Crear evaluaciones médicas", "evaluaciones-medicas"],
  ["evaluacion-medica.editar", "Editar evaluaciones médicas", "evaluaciones-medicas"],
  ["evaluacion-medica.finalizar", "Finalizar evaluaciones médicas", "evaluaciones-medicas"],
  ["evaluacion-medica.anular", "Anular evaluaciones médicas", "evaluaciones-medicas"],
  ["evaluacion-medica.exportar", "Exportar evaluaciones médicas", "evaluaciones-medicas"],
  ["alergia.ver", "Ver alergias", "alergias"],
  ["alergia.crear", "Crear alergias", "alergias"],
  ["alergia.editar", "Editar alergias", "alergias"],
  ["receta.ver", "Ver recetas", "recetas"],
  ["receta.crear", "Crear recetas", "recetas"],
  ["receta.editar", "Editar recetas", "recetas"],
  ["receta.emitir", "Emitir recetas", "recetas"],
  ["receta.anular", "Anular recetas", "recetas"],
  ["receta.exportar", "Exportar recetas", "recetas"],
  ["registro-diario.ver", "Ver el registro diario", "registro-diario"],
  ["registro-diario.crear", "Crear registros diarios", "registro-diario"],
  ["registro-diario.editar", "Editar registros diarios", "registro-diario"],
  ["registro-diario.anular", "Anular registros diarios", "registro-diario"],
  ["registro-diario.exportar", "Exportar el registro diario", "registro-diario"],
  ["inventario.ver", "Ver inventario", "inventario"],
  ["inventario.crear", "Crear medicamentos de inventario", "inventario"],
  ["inventario.editar", "Editar medicamentos de inventario", "inventario"],
  ["inventario.movimiento", "Registrar movimientos de inventario", "inventario"],
  ["inventario.desactivar", "Activar o desactivar medicamentos de inventario", "inventario"],
  ["documento-clinico.ver", "Ver documentos clínicos", "documentos-clinicos"],
  ["documento-clinico.crear", "Crear documentos clínicos", "documentos-clinicos"],
  ["documento-clinico.editar", "Editar documentos clínicos", "documentos-clinicos"],
  ["documento-clinico.finalizar", "Finalizar documentos clínicos", "documentos-clinicos"],
  ["documento-clinico.anular", "Anular documentos clínicos", "documentos-clinicos"],
  ["documento-clinico.exportar", "Exportar documentos clínicos", "documentos-clinicos"],
  ["cita.ver", "Ver citas", "citas"],
  ["cita.crear", "Crear citas", "citas"],
  ["cita.editar", "Editar citas", "citas"],
  ["cita.cancelar", "Cancelar citas", "citas"],
  ["cita.atender", "Marcar cita atendida", "citas"],
  ["reporte.ver", "Ver reportes", "reportes"],
  ["reporte.exportar", "Exportar reportes", "reportes"],
] as const;

const EMPRESAS = [
  { ruc: "0992179155001", razonSocial: "APRACOM", actividadEconomicaCodigo: "C20119801" },
  { ruc: "0992179147001", razonSocial: "TRADETEC", actividadEconomicaCodigo: "C10200101" },
  { ruc: "0993383874001", razonSocial: "SEGURITYSTARK", actividadEconomicaCodigo: "N80100301" },
  { ruc: "0992143096001", razonSocial: "KUARELA", actividadEconomicaCodigo: "G46900002" },
  { ruc: "1204727836001", razonSocial: "MARLON MENDOZA", actividadEconomicaCodigo: "F41002001" },
  { ruc: "0918022930001", razonSocial: "HUGO MENDOZA", actividadEconomicaCodigo: "F42202001" },
  { ruc: "1716807092001", razonSocial: "DIANA SOLIS", actividadEconomicaCodigo: "F41002002" },
] as const;

const DEPARTAMENTOS_POR_RUC: Record<string, readonly string[]> = {
  "0992179155001": [
    "COORDINACIÓN DE OPERACIONES",
    "COORDINACION GENERAL",
    "DEPARTAMENTO ADMINISTRATIVO",
    "DEPARTAMENTO DE CALIDAD",
    "DEPARTAMENTO DE DISEÑO Y COMUNICACIÓN",
    "DEPARTAMENTO DE INGREDIENTES",
    "DEPARTAMENTO DE IT",
    "DEPARTAMENTO DE LOGÍSTICA",
    "DIRECCION ADMINISTRATIVO FINANCIERA",
    "GERENCIA DE COMPRAS",
    "GERENCIA DE FINANZAS",
    "GERENCIA DE PRODUCCIÓN",
    "GERENCIA DE TALENTO HUMANO",
    "GERENCIA GENERAL",
    "GERENCIA NACIONAL VENTAS INO-SANI-C.ACU-G.FOODIE",
    "GERENCIA REGIONAL ACUACULTURA",
    "GERENCIA REGIONAL DE ACUACULTURA",
    "GERENCIA REGIONAL DE AUDITORIA",
    "GERENCIAL REGIONAL DE VENTAS",
    "INVESTIGACIÓN Y DESARROLLO",
    "MÉXICO",
  ],
  "0992179147001": [
    "COORDINACION DE OPERACIONES",
    "COORDINACIÓN DE OPERACIONES",
    "COORDINACION GENERAL",
    "DEPARTAMENTO ADMINISTRATIVO",
    "DEPARTAMENTO DE CALIDAD",
    "DEPARTAMENTO DE DISEÑO Y COMUNICACIÓN",
    "DEPARTAMENTO DE INGREDIENTES",
    "DEPARTAMENTO DE IT",
    "DEPARTAMENTO DE LOGÍSTICA",
    "GERENCIA AGROINDUSTRIAL",
    "GERENCIA DE COMPRAS",
    "GERENCIA DE FINANZAS",
    "GERENCIA DE PRODUCCIÓN",
    "GERENCIA DE TALENTO HUMANO",
    "GERENCIA GENERAL",
    "GERENCIA NACIONAL VENTAS INO-SANI-C.ACU-G.FOODIE",
    "GERENCIA REGIONAL ACUACULTURA",
    "GERENCIA REGIONAL DE ACUACULTURA",
    "GERENCIA REGIONAL DE AUDITORIA",
    "INVESTIGACIÓN Y DESARROLLO",
    "MARKETING",
    "PROYECTOS",
  ],
  "0992143096001": [
    "COORDINACION GENERAL",
    "GERENCIA DE COMPRAS",
    "GERENCIA DE FINANZAS",
    "MÉXICO",
  ],
  "0993383874001": ["SEGURIDAD"],
};

const PERMISOS_RRHH = [
  "trabajador.ver",
  "trabajador.crear",
  "trabajador.editar",
  "departamento.ver",
  "empresa.ver",
  "cita.ver",
  "cita.crear",
  "cita.editar",
  "registro-diario.ver",
  "inventario.ver",
  "evaluacion-medica.ver",
  "ficha-ocupacional.ver",
  "receta.ver",
  "documento-clinico.ver",
  "reporte.ver",
  "reporte.exportar",
];

const PERMISOS_MEDICO = [
  "trabajador.ver",
  "cita.ver",
  "cita.crear",
  "cita.editar",
  "cita.atender",
  "registro-diario.ver",
  "registro-diario.crear",
  "registro-diario.editar",
  "registro-diario.exportar",
  "inventario.ver",
  "inventario.movimiento",
  "evaluacion-medica.ver",
  "evaluacion-medica.crear",
  "evaluacion-medica.editar",
  "evaluacion-medica.finalizar",
  "ficha-ocupacional.ver",
  "ficha-ocupacional.crear",
  "ficha-ocupacional.editar",
  "ficha-ocupacional.finalizar",
  "certificado-ocupacional.ver",
  "certificado-ocupacional.exportar",
  "receta.ver",
  "receta.crear",
  "receta.editar",
  "receta.emitir",
  "reporte.ver",
  "documento-clinico.ver",
  "documento-clinico.crear",
  "documento-clinico.editar",
  "documento-clinico.finalizar",
  "alergia.ver",
  "alergia.crear",
  "alergia.editar",
];

function crearHash(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 64).toString("hex");
  return `scrypt:${sal.toString("hex")}:${hash}`;
}

async function main() {
  const correo = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const clave = process.env.SEED_ADMIN_PASSWORD;
  if (!correo || !clave) {
    throw new Error("Faltan SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env");
  }
  if (correo !== "administrador@desarrollo.local") {
    throw new Error("SEED_ADMIN_EMAIL debe ser administrador@desarrollo.local en este entorno.");
  }

  await prisma.$transaction(async (tx) => {
    for (const [codigo, nombre, modulo] of PERMISOS) {
      await tx.permiso.upsert({
        where: { codigo },
        update: { nombre, modulo, estado: "ACTIVO" },
        create: { codigo, nombre, modulo, estado: "ACTIVO" },
      });
    }

    await tx.permiso.updateMany({
      where: { codigo: { startsWith: "atencion-medica." } },
      data: { estado: "INACTIVO" },
    });

    const rolAdministrador = await tx.rol.upsert({
      where: { nombre: "ADMINISTRADOR" },
      update: { descripcion: "Administrador con acceso total al sistema", estado: "ACTIVO" },
      create: { nombre: "ADMINISTRADOR", descripcion: "Administrador con acceso total al sistema" },
    });

    const permisos = await tx.permiso.findMany({ where: { estado: "ACTIVO" }, select: { id: true } });
    for (const { id: permisoId } of permisos) {
      await tx.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rolAdministrador.id, permisoId } },
        update: {},
        create: { rolId: rolAdministrador.id, permisoId },
      });
    }

    const rolRrhh = await tx.rol.upsert({
      where: { nombre: "RECURSOS_HUMANOS" },
      update: { descripcion: "Recursos Humanos con acceso administrativo y de consulta", estado: "ACTIVO" },
      create: { nombre: "RECURSOS_HUMANOS", descripcion: "Recursos Humanos con acceso administrativo y de consulta" },
    });

    const permisosRrhh = await tx.permiso.findMany({
      where: { codigo: { in: PERMISOS_RRHH }, estado: "ACTIVO" },
      select: { id: true, codigo: true },
    });
    for (const { id: permisoId } of permisosRrhh) {
      await tx.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rolRrhh.id, permisoId } },
        update: {},
        create: { rolId: rolRrhh.id, permisoId },
      });
    }

    const rolMedico = await tx.rol.upsert({
      where: { nombre: "MÉDICO" },
      update: { descripcion: "Médico con acceso clínico completo", estado: "ACTIVO" },
      create: { nombre: "MÉDICO", descripcion: "Médico con acceso clínico completo" },
    });

    const permisosMedico = await tx.permiso.findMany({
      where: { codigo: { in: PERMISOS_MEDICO }, estado: "ACTIVO" },
      select: { id: true },
    });
    for (const { id: permisoId } of permisosMedico) {
      await tx.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: rolMedico.id, permisoId } },
        update: {},
        create: { rolId: rolMedico.id, permisoId },
      });
    }

    for (const datos of EMPRESAS) {
      const empresa = await tx.empresa.upsert({
        where: { ruc: datos.ruc },
        update: {
          razonSocial: datos.razonSocial,
          nombreComercial: datos.razonSocial,
          actividadEconomicaCodigo: datos.actividadEconomicaCodigo,
          estado: "ACTIVO",
        },
        create: {
          ...datos,
          nombreComercial: datos.razonSocial,
          estado: "ACTIVO",
        },
      });

      for (const nombre of DEPARTAMENTOS_POR_RUC[datos.ruc] ?? []) {
        await tx.departamento.upsert({
          where: { empresaId_nombre: { empresaId: empresa.id, nombre } },
          update: { estado: "ACTIVO" },
          create: { empresaId: empresa.id, nombre, estado: "ACTIVO" },
        });
      }
    }

    const usuario = await tx.usuario.upsert({
      where: { correo },
      update: {
        nombres: "Administrador",
        apellidos: "Desarrollo",
        claveHash: crearHash(clave),
        estado: "ACTIVO",
      },
      create: {
        nombres: "Administrador",
        apellidos: "Desarrollo",
        correo,
        claveHash: crearHash(clave),
        estado: "ACTIVO",
      },
    });

    await tx.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: usuario.id, rolId: rolAdministrador.id } },
      update: {},
      create: { usuarioId: usuario.id, rolId: rolAdministrador.id },
    });

    const correoRrhh = "rrhh@desarrollo.local";
    const claveRrhh = "rrhh123";
    const usuarioRrhh = await tx.usuario.upsert({
      where: { correo: correoRrhh },
      update: {
        nombres: "Usuario",
        apellidos: "Recursos Humanos",
        claveHash: crearHash(claveRrhh),
        estado: "ACTIVO",
      },
      create: {
        nombres: "Usuario",
        apellidos: "Recursos Humanos",
        correo: correoRrhh,
        claveHash: crearHash(claveRrhh),
        estado: "ACTIVO",
      },
    });

    await tx.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: usuarioRrhh.id, rolId: rolRrhh.id } },
      update: {},
      create: { usuarioId: usuarioRrhh.id, rolId: rolRrhh.id },
    });

    const correoMedico = "medico@desarrollo.local";
    const claveMedico = "medico123";
    const usuarioMedico = await tx.usuario.upsert({
      where: { correo: correoMedico },
      update: {
        nombres: "Usuario",
        apellidos: "Médico",
        claveHash: crearHash(claveMedico),
        estado: "ACTIVO",
      },
      create: {
        nombres: "Usuario",
        apellidos: "Médico",
        correo: correoMedico,
        claveHash: crearHash(claveMedico),
        estado: "ACTIVO",
      },
    });

    await tx.usuarioRol.upsert({
      where: { usuarioId_rolId: { usuarioId: usuarioMedico.id, rolId: rolMedico.id } },
      update: {},
      create: { usuarioId: usuarioMedico.id, rolId: rolMedico.id },
    });

    const empresasActivas = await tx.empresa.findMany({
      where: { estado: "ACTIVO" },
      select: { id: true },
    });
    const usuariosIniciales = [usuario.id, usuarioRrhh.id, usuarioMedico.id];
    for (const usuarioId of usuariosIniciales) {
      for (const { id: empresaId } of empresasActivas) {
        await tx.usuarioEmpresa.upsert({
          where: { usuarioId_empresaId: { usuarioId, empresaId } },
          update: {},
          create: { usuarioId, empresaId },
        });
      }
    }
  }, { timeout: 30000, maxWait: 15000 });

  console.log("Seed completado: permisos, roles (ADMINISTRADOR, MÉDICO, RECURSOS_HUMANOS), usuarios y datos demo actualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
