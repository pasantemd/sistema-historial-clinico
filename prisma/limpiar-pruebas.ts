/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const FORCE_FLAG = process.argv.includes("--force");
const NODE_ENV = process.env.NODE_ENV ?? "development";

const DB_LOCAL_PATTERNS = ["localhost", "127.0.0.1", "::1", "host.docker.internal"];
const DB_DESARROLLO_SUFFIX = ["_dev", "_test", "_development", "desarrollo"];

function esBaseLocalODesarrollo(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const path = u.pathname.replace(/^\//, "");
    if (DB_LOCAL_PATTERNS.some((p) => host.includes(p) || host === p)) return true;
    if (DB_DESARROLLO_SUFFIX.some((s) => path.toLowerCase().endsWith(s))) return true;
    if (path.toLowerCase().includes("desarrollo")) return true;
    return false;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== LIMPIEZA DE DATOS DE PRUEBA ===");
  console.log("");

  if (!FORCE_FLAG) {
    console.error("ERROR: Debes usar --force para ejecutar la limpieza.");
    console.error("  npm run limpiar:pruebas -- --force");
    process.exit(1);
  }

  if (NODE_ENV === "production") {
    console.error("ERROR: NODE_ENV es 'production'. Bloqueando ejecución.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL no está definida.");
    process.exit(1);
  }

  if (!esBaseLocalODesarrollo(databaseUrl)) {
    console.error("ERROR: DATABASE_URL no parece ser local o de desarrollo.");
    console.error(`  URL: ${databaseUrl.replace(/:[^:@]+@/, ":****@")}`);
    console.error("  No se puede ejecutar contra una base remota o de producción.");
    process.exit(1);
  }

  const urlObj = new URL(databaseUrl);
  const host = urlObj.hostname;
  const port = urlObj.port;
  const dbName = urlObj.pathname.replace(/^\//, "");
  const user = urlObj.username;

  console.log("Entorno:", NODE_ENV);
  console.log("Host:", host);
  console.log("Puerto:", port);
  console.log("Base de datos:", dbName);
  console.log("Usuario:", user);
  console.log("");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const conteos = await prisma.$transaction(async (tx) => {
      const counts: Record<string, number> = {};

      const tablas = [
        "documentoClinicoTratamiento",
        "documentoClinicoDiagnostico",
        "recetaMedicamento",
        "medicamentoEvaluacion",
        "diagnosticoEvaluacion",
        "diagnosticoFicha",
        "alergiaTrabajador",
        "recetaMedica",
        "documentoClinico",
        "citaMedica",
        "evaluacionMedica",
        "fichaOcupacional",
        "registroDiarioAtencion",
        "atencionMedica",
        "auditoria",
        "asignacionLaboral",
        "trabajador",
      ] as const;

      const ordenLectura: Record<string, string> = {
        documentoClinicoTratamiento: "DocumentoClinicoTratamiento",
        documentoClinicoDiagnostico: "DocumentoClinicoDiagnostico",
        recetaMedicamento: "RecetaMedicamento",
        medicamentoEvaluacion: "MedicamentoEvaluacion",
        diagnosticoEvaluacion: "DiagnosticoEvaluacion",
        diagnosticoFicha: "DiagnosticoFicha",
        alergiaTrabajador: "AlergiaTrabajador",
        recetaMedica: "RecetaMedica",
        documentoClinico: "DocumentoClinico",
        citaMedica: "CitaMedica",
        evaluacionMedica: "EvaluacionMedica",
        fichaOcupacional: "FichaOcupacional",
        registroDiarioAtencion: "RegistroDiarioAtencion",
        atencionMedica: "AtencionMedica",
        auditoria: "Auditoria",
        asignacionLaboral: "AsignacionLaboral",
        trabajador: "Trabajador",
      };

      for (const key of tablas) {
        const model = ordenLectura[key];
        const count = await (tx as any)[key].count();
        counts[model] = count;
      }

      return { counts, tablas, ordenLectura };
    });

    console.log("TABLAS AFECTADAS Y REGISTROS ACTUALES:");
    console.log("---------------------------------------");
    for (const [model, count] of Object.entries(conteos.counts)) {
      if (count > 0) {
        console.log(`  ${model.padEnd(35)} ${String(count).padStart(6)}`);
      }
    }
    console.log("");

    const total = Object.values(conteos.counts).reduce((a, b) => a + b, 0);
    console.log(`Total de registros a eliminar: ${total}`);
    console.log("");

    console.log("DATOS QUE SE CONSERVARÁN:");
    console.log("  - Usuarios (admin, RRHH)");
    console.log("  - Roles y permisos");
    console.log("  - Empresas y departamentos");
    console.log("  - Catálogo CIE-10 y sinónimos");
    console.log("  - Catálogo de medicamentos");
    console.log("  - Migraciones y secuencias");
    console.log("");

    console.log("PRESIONE Ctrl+C PARA ABORTAR o espere 5 segundos para continuar...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const eliminados = await prisma.$transaction(async (tx) => {
      const results: Record<string, number> = {};

      const ordenBorrado: Array<{ key: string; model: string; label: string }> = [
        { key: "documentoClinicoTratamiento", model: "DocumentoClinicoTratamiento", label: "Tratamientos de documentos clínicos" },
        { key: "documentoClinicoDiagnostico", model: "DocumentoClinicoDiagnostico", label: "Diagnósticos de documentos clínicos" },
        { key: "recetaMedicamento", model: "RecetaMedicamento", label: "Medicamentos de recetas" },
        { key: "medicamentoEvaluacion", model: "MedicamentoEvaluacion", label: "Medicamentos de evaluaciones" },
        { key: "diagnosticoEvaluacion", model: "DiagnosticoEvaluacion", label: "Diagnósticos de evaluaciones" },
        { key: "diagnosticoFicha", model: "DiagnosticoFicha", label: "Diagnósticos de fichas" },
        { key: "alergiaTrabajador", model: "AlergiaTrabajador", label: "Alergias de trabajadores" },
        { key: "recetaMedica", model: "RecetaMedica", label: "Recetas médicas" },
        { key: "documentoClinico", model: "DocumentoClinico", label: "Documentos clínicos" },
        { key: "citaMedica", model: "CitaMedica", label: "Citas médicas" },
        { key: "evaluacionMedica", model: "EvaluacionMedica", label: "Evaluaciones médicas" },
        { key: "fichaOcupacional", model: "FichaOcupacional", label: "Fichas ocupacionales" },
        { key: "registroDiarioAtencion", model: "RegistroDiarioAtencion", label: "Registros diarios de atención" },
        { key: "atencionMedica", model: "AtencionMedica", label: "Atenciones médicas" },
        { key: "auditoria", model: "Auditoria", label: "Registros de auditoría" },
        { key: "asignacionLaboral", model: "AsignacionLaboral", label: "Asignaciones laborales" },
        { key: "trabajador", model: "Trabajador", label: "Trabajadores" },
      ];

      for (const { key, label } of ordenBorrado) {
        const count = await (tx as any)[key].count();
        if (count > 0) {
          await (tx as any)[key].deleteMany({});
          results[label] = count;
        }
      }

      return results;
    });

    console.log("");
    console.log("REGISTROS ELIMINADOS:");
    console.log("---------------------");
    let totalEliminados = 0;
    for (const [label, count] of Object.entries(eliminados)) {
      console.log(`  ${label.padEnd(40)} ${String(count).padStart(6)}`);
      totalEliminados += count;
    }
    console.log(`  ${"TOTAL".padEnd(40)} ${String(totalEliminados).padStart(6)}`);
    console.log("");

    const verificaciones = await prisma.$transaction(async (tx) => {
      const checks: Record<string, number> = {};
      const modelos = [
        ["trabajador", "Trabajadores"],
        ["asignacionLaboral", "Asignaciones laborales"],
        ["alergiaTrabajador", "Alergias de trabajadores"],
        ["citaMedica", "Citas médicas"],
        ["registroDiarioAtencion", "Registros diarios"],
        ["evaluacionMedica", "Evaluaciones médicas"],
        ["fichaOcupacional", "Fichas ocupacionales"],
        ["recetaMedica", "Recetas médicas"],
        ["documentoClinico", "Documentos clínicos"],
        ["atencionMedica", "Atenciones médicas"],
      ] as const;
      for (const [key, label] of modelos) {
        checks[label] = await (tx as any)[key].count();
      }
      checks["Usuarios"] = await tx.usuario.count();
      checks["Roles"] = await tx.rol.count();
      checks["Permisos"] = await tx.permiso.count();
      checks["Empresas"] = await tx.empresa.count();
      checks["Departamentos"] = await tx.departamento.count();
      checks["Diagnósticos CIE-10"] = await tx.enfermedadCie10.count();
      checks["Medicamentos"] = await tx.medicamento.count();
      return checks;
    });

    console.log("VERIFICACIÓN POST-LIMPIEZA:");
    console.log("----------------------------");
    for (const [label, count] of Object.entries(verificaciones)) {
      const estado = count === 0 && !["Usuarios", "Roles", "Permisos", "Empresas", "Departamentos", "Diagnósticos CIE-10", "Medicamentos"].includes(label)
        ? "OK"
        : count > 0 && ["Usuarios", "Roles", "Permisos", "Empresas", "Departamentos", "Diagnósticos CIE-10", "Medicamentos"].includes(label)
          ? `OK (${count})`
          : count === 0 && ["Usuarios", "Roles", "Permisos", "Empresas", "Departamentos", "Diagnósticos CIE-10", "Medicamentos"].includes(label)
            ? "!!! VACÍO !!!"
            : `OK (${count})`;
      console.log(`  ${label.padEnd(30)} ${estado}`);
    }

    console.log("");
    console.log("=== LIMPIEZA COMPLETADA ===");
  } catch (error) {
    console.error("");
    console.error("ERROR durante la limpieza. Rollback ejecutado.");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();