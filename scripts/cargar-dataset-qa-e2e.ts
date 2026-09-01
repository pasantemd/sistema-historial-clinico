import "dotenv/config";

import { prisma } from "../src/servicios/base-datos/prisma";
import { crearClaveScrypt } from "../src/servicios/seguridad/crear-clave-scrypt";
import { validarEntornoDatos } from "./validar-entorno-datos";

validarEntornoDatos({
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
  exigirBaseLocal: true,
});

async function main() {
  console.log("🚀 Iniciando carga de Dataset QA E2E...");

  // 1. Roles del sistema
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: "ADMINISTRADOR" } });
  const rolMedico = await prisma.rol.findUnique({ where: { nombre: "MÉDICO" } });
  const rolRrhh = await prisma.rol.findUnique({ where: { nombre: "RECURSOS_HUMANOS" } });

  if (!rolAdmin || !rolMedico || !rolRrhh) {
    throw new Error("Los roles base no existen en la base de datos.");
  }

  // 2. Empresas QA
  const empresaAlpha = await prisma.empresa.upsert({
    where: { ruc: "QA-RUC-ALPHA-01" },
    update: {
      razonSocial: "QA_EMPRESA_ALPHA",
      nombreComercial: "QA EMPRESA ALPHA",
      estado: "ACTIVO",
    },
    create: {
      razonSocial: "QA_EMPRESA_ALPHA",
      nombreComercial: "QA EMPRESA ALPHA",
      ruc: "QA-RUC-ALPHA-01",
      direccion: "Av. Pruebas Alpha 123",
      estado: "ACTIVO",
    },
  });

  const empresaBeta = await prisma.empresa.upsert({
    where: { ruc: "QA-RUC-BETA-02" },
    update: {
      razonSocial: "QA_EMPRESA_BETA",
      nombreComercial: "QA EMPRESA BETA",
      estado: "ACTIVO",
    },
    create: {
      razonSocial: "QA_EMPRESA_BETA",
      nombreComercial: "QA EMPRESA BETA",
      ruc: "QA-RUC-BETA-02",
      direccion: "Av. Pruebas Beta 456",
      estado: "ACTIVO",
    },
  });

  // 3. Departamentos QA
  const deptoOperaciones = await prisma.departamento.upsert({
    where: {
      empresaId_nombre: {
        empresaId: empresaAlpha.id,
        nombre: "QA_DEPARTAMENTO_OPERACIONES",
      },
    },
    update: { estado: "ACTIVO" },
    create: {
      nombre: "QA_DEPARTAMENTO_OPERACIONES",
      empresaId: empresaAlpha.id,
      estado: "ACTIVO",
    },
  });

  const deptoAdmin = await prisma.departamento.upsert({
    where: {
      empresaId_nombre: {
        empresaId: empresaAlpha.id,
        nombre: "QA_DEPARTAMENTO_ADMINISTRACION",
      },
    },
    update: { estado: "ACTIVO" },
    create: {
      nombre: "QA_DEPARTAMENTO_ADMINISTRACION",
      empresaId: empresaAlpha.id,
      estado: "ACTIVO",
    },
  });

  const deptoBetaOperaciones = await prisma.departamento.upsert({
    where: {
      empresaId_nombre: {
        empresaId: empresaBeta.id,
        nombre: "QA_DEPARTAMENTO_OPERACIONES_BETA",
      },
    },
    update: { estado: "ACTIVO" },
    create: {
      nombre: "QA_DEPARTAMENTO_OPERACIONES_BETA",
      empresaId: empresaBeta.id,
      estado: "ACTIVO",
    },
  });

  // 4. Usuarios QA
  const claveQa = process.env.QA_E2E_PASSWORD;
  if (!claveQa) {
    throw new Error("QA_E2E_PASSWORD no está definida.");
  }
  const claveScrypt = crearClaveScrypt(claveQa);

  const usuarioAdmin = await prisma.usuario.upsert({
    where: { correo: "qa_admin@historial.local" },
    update: {
      nombres: "QA ADMIN",
      apellidos: "GENERAL",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
    create: {
      correo: "qa_admin@historial.local",
      nombres: "QA ADMIN",
      apellidos: "GENERAL",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
  });
  await prisma.usuarioRol.deleteMany({ where: { usuarioId: usuarioAdmin.id } });
  await prisma.usuarioRol.create({
    data: { usuarioId: usuarioAdmin.id, rolId: rolAdmin.id },
  });

  const usuarioMedico = await prisma.usuario.upsert({
    where: { correo: "qa_medico@historial.local" },
    update: {
      nombres: "DRA. QA MÉDICO",
      apellidos: "ALPHA",
      codigoProfesional: "MED-QA-001",
      especialidad: "Medicina Ocupacional",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
    create: {
      correo: "qa_medico@historial.local",
      nombres: "DRA. QA MÉDICO",
      apellidos: "ALPHA",
      codigoProfesional: "MED-QA-001",
      especialidad: "Medicina Ocupacional",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
  });
  await prisma.usuarioRol.deleteMany({ where: { usuarioId: usuarioMedico.id } });
  await prisma.usuarioRol.create({
    data: { usuarioId: usuarioMedico.id, rolId: rolMedico.id },
  });
  await prisma.usuarioEmpresa.deleteMany({ where: { usuarioId: usuarioMedico.id } });
  await prisma.usuarioEmpresa.create({
    data: { usuarioId: usuarioMedico.id, empresaId: empresaAlpha.id },
  });

  const usuarioRrhh = await prisma.usuario.upsert({
    where: { correo: "qa_rrhh@historial.local" },
    update: {
      nombres: "LIC. QA RRHH",
      apellidos: "ALPHA",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
    create: {
      correo: "qa_rrhh@historial.local",
      nombres: "LIC. QA RRHH",
      apellidos: "ALPHA",
      claveHash: claveScrypt,
      estado: "ACTIVO",
    },
  });
  await prisma.usuarioRol.deleteMany({ where: { usuarioId: usuarioRrhh.id } });
  await prisma.usuarioRol.create({
    data: { usuarioId: usuarioRrhh.id, rolId: rolRrhh.id },
  });
  await prisma.usuarioEmpresa.deleteMany({ where: { usuarioId: usuarioRrhh.id } });
  await prisma.usuarioEmpresa.create({
    data: { usuarioId: usuarioRrhh.id, empresaId: empresaAlpha.id },
  });

  // 5. Trabajadores QA
  const trabajador01 = await prisma.trabajador.upsert({
    where: {
      tipoDocumento_numeroDocumento: {
        tipoDocumento: "CEDULA",
        numeroDocumento: "QA-DOC-001",
      },
    },
    update: {
      nombres: "CARLOS ALBERTO",
      apellidos: "QA OPERACIONES",
      fechaNacimiento: new Date("1990-05-15T00:00:00.000Z"),
      sexo: "MASCULINO",
      empresaId: empresaAlpha.id,
      departamentoId: deptoOperaciones.id,
      puestoLaboral: "Operador de Planta",
      estadoLaboral: "ACTIVO",
    },
    create: {
      tipoDocumento: "CEDULA",
      numeroDocumento: "QA-DOC-001",
      nombres: "CARLOS ALBERTO",
      apellidos: "QA OPERACIONES",
      fechaNacimiento: new Date("1990-05-15T00:00:00.000Z"),
      sexo: "MASCULINO",
      empresaId: empresaAlpha.id,
      departamentoId: deptoOperaciones.id,
      puestoLaboral: "Operador de Planta",
      estadoLaboral: "ACTIVO",
    },
  });

  const asignacionLaboral01 = await prisma.asignacionLaboral.findFirst({
    where: { trabajadorId: trabajador01.id, activa: true },
    orderBy: { creadoEn: "desc" },
  });
  const datosAsignacionLaboral01 = {
      trabajadorId: trabajador01.id,
      empresaId: empresaAlpha.id,
      departamentoId: deptoOperaciones.id,
      fechaInicio: new Date("2024-01-01T00:00:00.000Z"),
      activa: true,
      estado: "ACTIVO" as const,
  };
  if (asignacionLaboral01) {
    await prisma.asignacionLaboral.update({
      where: { id: asignacionLaboral01.id },
      data: datosAsignacionLaboral01,
    });
  } else {
    await prisma.asignacionLaboral.create({ data: datosAsignacionLaboral01 });
  }

  const trabajador02 = await prisma.trabajador.upsert({
    where: {
      tipoDocumento_numeroDocumento: {
        tipoDocumento: "CEDULA",
        numeroDocumento: "QA-DOC-002",
      },
    },
    update: {
      nombres: "MARIA ELENA",
      apellidos: "QA INACTIVA",
      fechaNacimiento: new Date("1988-11-20T00:00:00.000Z"),
      sexo: "FEMENINO",
      empresaId: empresaAlpha.id,
      departamentoId: deptoAdmin.id,
      puestoLaboral: "Auxiliar Administrativa",
      estadoLaboral: "INACTIVO",
    },
    create: {
      tipoDocumento: "CEDULA",
      numeroDocumento: "QA-DOC-002",
      nombres: "MARIA ELENA",
      apellidos: "QA INACTIVA",
      fechaNacimiento: new Date("1988-11-20T00:00:00.000Z"),
      sexo: "FEMENINO",
      empresaId: empresaAlpha.id,
      departamentoId: deptoAdmin.id,
      puestoLaboral: "Auxiliar Administrativa",
      estadoLaboral: "INACTIVO",
    },
  });

  const trabajador03Beta = await prisma.trabajador.upsert({
    where: {
      tipoDocumento_numeroDocumento: {
        tipoDocumento: "CEDULA",
        numeroDocumento: "QA-DOC-003",
      },
    },
    update: {
      nombres: "PEDRO JOSE",
      apellidos: "QA BETA",
      fechaNacimiento: new Date("1995-02-10T00:00:00.000Z"),
      sexo: "MASCULINO",
      empresaId: empresaBeta.id,
      departamentoId: deptoBetaOperaciones.id,
      puestoLaboral: "Técnico de Mantenimiento Beta",
      estadoLaboral: "ACTIVO",
    },
    create: {
      tipoDocumento: "CEDULA",
      numeroDocumento: "QA-DOC-003",
      nombres: "PEDRO JOSE",
      apellidos: "QA BETA",
      fechaNacimiento: new Date("1995-02-10T00:00:00.000Z"),
      sexo: "MASCULINO",
      empresaId: empresaBeta.id,
      departamentoId: deptoBetaOperaciones.id,
      puestoLaboral: "Técnico de Mantenimiento Beta",
      estadoLaboral: "ACTIVO",
    },
  });

  // 6. Medicamento QA
  let medicamentoIbuprofeno = await prisma.medicamentoInventario.findFirst({
    where: { nombre: "QA_IBUPROFENO_400" },
  });
  if (medicamentoIbuprofeno) {
    medicamentoIbuprofeno = await prisma.medicamentoInventario.update({
      where: { id: medicamentoIbuprofeno.id },
      data: {
        cantidadDisponible: 20,
        unidad: "TABLETAS",
        estado: "ACTIVO",
        observaciones: "Lote QA-LOT-01 para pruebas E2E",
        fechaCaducidad: new Date("2028-12-31T00:00:00.000Z"),
      },
    });
  } else {
    medicamentoIbuprofeno = await prisma.medicamentoInventario.create({
      data: {
        nombre: "QA_IBUPROFENO_400",
        cantidadDisponible: 20,
        unidad: "TABLETAS",
        estado: "ACTIVO",
        observaciones: "Lote QA-LOT-01 para pruebas E2E",
        fechaCaducidad: new Date("2028-12-31T00:00:00.000Z"),
        creadoPorUsuarioId: usuarioAdmin.id,
      },
    });
  }

  console.log("✅ Dataset QA E2E insertado correctamente:");
  console.log(`- Empresas: ${empresaAlpha.razonSocial} (${empresaAlpha.id}), ${empresaBeta.razonSocial} (${empresaBeta.id})`);
  console.log(`- Usuarios: ${usuarioAdmin.correo}, ${usuarioMedico.correo}, ${usuarioRrhh.correo}`);
  console.log(`- Trabajadores: ${trabajador01.numeroDocumento}, ${trabajador02.numeroDocumento}, ${trabajador03Beta.numeroDocumento}`);
  console.log(`- Medicamento: ${medicamentoIbuprofeno.nombre} (Stock: ${medicamentoIbuprofeno.cantidadDisponible})`);
}

main()
  .catch((e) => {
    console.error("❌ Error cargando dataset QA:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
