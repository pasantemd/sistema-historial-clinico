import "dotenv/config";

import { createInterface } from "node:readline";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

function esProduccion(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("production") ||
    u.includes("producao") ||
    u.includes("prod.") ||
    u.includes("produccion") ||
    u.includes("render.com") ||
    u.includes("railway") ||
    u.includes("heroku") ||
    u.includes("aws") ||
    u.includes("neon.tech") ||
    u.includes("fly.io") ||
    !u.includes("localhost")
  );
}

function preguntar(query: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (respuesta) => {
      rl.close();
      resolve(respuesta);
    });
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL no definida.");
    process.exit(1);
  }

  if (esProduccion(databaseUrl)) {
    console.error("Parece una base de producción. Cancelando.");
    process.exit(1);
  }

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     LIMPIEZA DE DATOS DE PRUEBA                 ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log("Se eliminarán TODOS los registros de:");
  console.log("  Trabajadores");
  console.log("  Asignaciones laborales");
  console.log("  Alergias");
  console.log("  Citas médicas");
  console.log("  Atenciones médicas");
  console.log("  Evaluaciones médicas (con diagnósticos y medicamentos)");
  console.log("  Fichas ocupacionales (con diagnósticos)");
  console.log("  Recetas (con medicamentos)");
  console.log("  Auditorías");
  console.log("");
  console.log("Se CONSERVARÁN:");
  console.log("  Usuarios, Roles, Permisos");
  console.log("  Empresas, Departamentos");
  console.log("  Catálogo CIE-10, Sinónimos");
  console.log("  Catálogo de medicamentos");
  console.log("  Configuración del sistema");
  console.log("");

  if (process.argv.includes("--force")) {
    console.log("Modo --force: omitiendo confirmación.\n");
  } else {
    const respuesta = await preguntar("Escriba 'BORRAR DATOS DE PRUEBA' y Enter: ");
    if (respuesta.trim() !== "BORRAR DATOS DE PRUEBA") {
      console.log("Confirmación incorrecta. Cancelando.");
      process.exit(0);
    }
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const resultados: Record<string, number> = {};

    await prisma.$transaction(async (tx) => {
      const r1 = await tx.recetaMedicamento.deleteMany();
      resultados["RecetaMedicamento"] = r1.count;

      const r2 = await tx.medicamentoEvaluacion.deleteMany();
      resultados["MedicamentoEvaluacion"] = r2.count;

      const r3 = await tx.diagnosticoEvaluacion.deleteMany();
      resultados["DiagnosticoEvaluacion"] = r3.count;

      const r4 = await tx.diagnosticoFicha.deleteMany();
      resultados["DiagnosticoFicha"] = r4.count;

      const r5 = await tx.recetaMedica.deleteMany();
      resultados["RecetaMedica"] = r5.count;

      const r6 = await tx.citaMedica.deleteMany();
      resultados["CitaMedica"] = r6.count;

      const r7 = await tx.atencionMedica.deleteMany();
      resultados["AtencionMedica"] = r7.count;

      const r8 = await tx.fichaOcupacional.deleteMany();
      resultados["FichaOcupacional"] = r8.count;

      const r9 = await tx.evaluacionMedica.deleteMany();
      resultados["EvaluacionMedica"] = r9.count;

      const r10 = await tx.alergiaTrabajador.deleteMany();
      resultados["AlergiaTrabajador"] = r10.count;

      const r11 = await tx.asignacionLaboral.deleteMany();
      resultados["AsignacionLaboral"] = r11.count;

      const r12 = await tx.auditoria.deleteMany();
      resultados["Auditoria"] = r12.count;

      const r13 = await tx.trabajador.deleteMany();
      resultados["Trabajador"] = r13.count;
    });

    console.log("\n=== REGISTROS ELIMINADOS ===");
    let total = 0;
    for (const [tabla, count] of Object.entries(resultados)) {
      console.log(`  ${tabla.padEnd(25)} ${count}`);
      total += count;
    }
    console.log(`  ${"-".repeat(35)}`);
    console.log(`  TOTAL:                        ${total}\n`);
    console.log("Limpieza completada exitosamente.");
  } catch (error) {
    console.error("Error durante la limpieza:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
