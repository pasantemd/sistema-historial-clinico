import "dotenv/config";

import { prisma } from "../src/servicios/base-datos/prisma";
import { validarEntornoDatos } from "./validar-entorno-datos";

validarEntornoDatos({
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  exigirBaseLocal: true,
});

async function main() {
  console.log("🧹 Iniciando limpieza segura de registros QA E2E...");

  // 1. Documentos clínicos, recetas, evaluaciones, fichas, registros de trabajadores QA
  const trabajadoresQa = await prisma.trabajador.findMany({
    where: { numeroDocumento: { startsWith: "QA-" } },
    select: { id: true },
  });
  const trabajadorIds = trabajadoresQa.map((t) => t.id);

  if (trabajadorIds.length > 0) {
    await prisma.movimientoInventario.deleteMany({
      where: {
        entregasRegistro: { some: { registroDiario: { trabajadorId: { in: trabajadorIds } } } },
      },
    });

    await prisma.registroDiarioMedicamento.deleteMany({
      where: { registroDiario: { trabajadorId: { in: trabajadorIds } } },
    });

    await prisma.recetaMedicamento.deleteMany({
      where: { receta: { trabajadorId: { in: trabajadorIds } } },
    });
    await prisma.recetaMedica.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.evaluacionMedica.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.fichaOcupacional.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.registroDiarioAtencion.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.atencionMedica.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.citaMedica.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.documentoClinico.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.asignacionLaboral.deleteMany({
      where: { trabajadorId: { in: trabajadorIds } },
    });

    await prisma.trabajador.deleteMany({
      where: { id: { in: trabajadorIds } },
    });
  }

  // 2. Movimientos y medicamentos QA
  const medicamentosQa = await prisma.medicamentoInventario.findMany({
    where: { nombre: { startsWith: "QA_" } },
    select: { id: true },
  });
  const medIds = medicamentosQa.map((m) => m.id);
  if (medIds.length > 0) {
    await prisma.movimientoInventario.deleteMany({
      where: { medicamentoInventarioId: { in: medIds } },
    });
    await prisma.medicamentoInventario.deleteMany({
      where: { id: { in: medIds } },
    });
  }

  // 3. Usuarios QA
  const usuariosQa = await prisma.usuario.findMany({
    where: { correo: { startsWith: "qa_" } },
    select: { id: true },
  });
  const usuarioIds = usuariosQa.map((u) => u.id);
  if (usuarioIds.length > 0) {
    await prisma.movimientoInventario.deleteMany({ where: { usuarioId: { in: usuarioIds } } });
    await prisma.usuarioRol.deleteMany({ where: { usuarioId: { in: usuarioIds } } });
    await prisma.usuarioEmpresa.deleteMany({ where: { usuarioId: { in: usuarioIds } } });
    await prisma.usuario.deleteMany({ where: { id: { in: usuarioIds } } });
  }

  // 4. Departamentos QA
  await prisma.departamento.deleteMany({
    where: { nombre: { startsWith: "QA_" } },
  });

  // 5. Empresas QA
  await prisma.empresa.deleteMany({
    where: { ruc: { startsWith: "QA-" } },
  });

  console.log("✅ Limpieza de dataset QA completada con éxito.");
}

main()
  .catch((e) => {
    console.error("❌ Error limpiando dataset QA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
