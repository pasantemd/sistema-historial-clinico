/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizarMorbilidad } from "../src/modulos/morbilidades/utilidades/normalizar-morbilidad";

// ==========================================
// 1. VERIFICACIÓN DE ENTORNO SEGURO
// ==========================================

function verificarEntornoSeguro(): { databaseUrl: string; host: string; port: string; dbName: string } {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv === "production") {
    console.error("❌ ERROR CRÍTICO: NODE_ENV es 'production'. Abortando por seguridad.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL no está definida en el entorno.");
    process.exit(1);
  }

  let urlObj: URL;
  try {
    urlObj = new URL(databaseUrl);
  } catch {
    console.error("❌ ERROR: DATABASE_URL no tiene un formato de URL válido.");
    process.exit(1);
  }

  const host = urlObj.hostname;
  const port = urlObj.port || "5432";
  const dbName = urlObj.pathname.replace(/^\//, "");

  const DB_LOCAL_PATTERNS = ["localhost", "127.0.0.1", "::1", "host.docker.internal"];
  const esHostLocal = DB_LOCAL_PATTERNS.some((p) => host.includes(p) || host === p);
  const esBaseValida = dbName === "sistema-historial-clinico" || dbName.includes("dev") || dbName.includes("test");

  if (!esHostLocal || !esBaseValida) {
    console.error("❌ ERROR DE SEGURIDAD: DATABASE_URL no parece ser un entorno local seguro de desarrollo/testing.");
    console.error(`  Host: ${host}, Puerto: ${port}, Base: ${dbName}`);
    console.error("  Ejecución bloqueada para proteger bases de producción.");
    process.exit(1);
  }

  return { databaseUrl, host, port, dbName };
}

// ==========================================
// 2. CONSTANTES Y CONFIGURACIÓN DEL DATASET
// ==========================================

const PREFIJO = "TEST-REPORTES-";
const ORIGEN_TAG = "TEST_REPORTES";

function crearHash(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, 64).toString("hex");
  return `scrypt:${sal.toString("hex")}:${hash}`;
}

const EMPRESAS_CONFIG = [
  {
    razonSocial: `${PREFIJO}TRADETEK`,
    ruc: "9999999900001",
    nombreComercial: "TRADETEK TEST",
    departamentos: ["SISTEMAS", "MARKETING"],
  },
  {
    razonSocial: `${PREFIJO}APRACOM`,
    ruc: "9999999900002",
    nombreComercial: "APRACOM TEST",
    departamentos: ["ADMINISTRACIÓN", "OPERACIONES"],
  },
];

const MEDICOS_CONFIG = [
  {
    nombres: "TEST-REPORTES Dra. Ana",
    apellidos: "López",
    correo: "ana.lopez.test@tradetek.local",
    codigoProfesional: "MED-TEST-001",
    especialidad: "Medicina Ocupacional",
    rol: "MÉDICO",
  },
  {
    nombres: "TEST-REPORTES Dr. Juan",
    apellidos: "Pérez",
    correo: "juan.perez.test@tradetek.local",
    codigoProfesional: "MED-TEST-002",
    especialidad: "Medicina General",
    rol: "MÉDICO",
  },
  {
    nombres: "TEST-REPORTES RRHH",
    apellidos: "Operativo",
    correo: "rrhh.test@tradetek.local",
    codigoProfesional: null,
    especialidad: null,
    rol: "RECURSOS_HUMANOS",
  },
];

const TRABAJADORES_CONFIG = [
  { cod: "TRAB-001", doc: "9900000001", nombres: "Carlos", apellidos: "Mendoza", empresaRuc: "9999999900001", deptoIni: "SISTEMAS", deptoActual: "MARKETING" },
  { cod: "TRAB-002", doc: "9900000002", nombres: "María", apellidos: "Gómez", empresaRuc: "9999999900001", deptoIni: "SISTEMAS", deptoActual: "SISTEMAS" },
  { cod: "TRAB-003", doc: "9900000003", nombres: "David", apellidos: "Torres", empresaRuc: "9999999900001", deptoIni: "SISTEMAS", deptoActual: "SISTEMAS" },
  { cod: "TRAB-004", doc: "9900000004", nombres: "Elena", apellidos: "Ríos", empresaRuc: "9999999900001", deptoIni: "MARKETING", deptoActual: "MARKETING" },
  { cod: "TRAB-005", doc: "9900000005", nombres: "Jorge", apellidos: "Morales", empresaRuc: "9999999900001", deptoIni: "MARKETING", deptoActual: "MARKETING" },
  { cod: "TRAB-006", doc: "9900000006", nombres: "Lucía", apellidos: "Castro", empresaRuc: "9999999900002", deptoIni: "ADMINISTRACIÓN", deptoActual: "ADMINISTRACIÓN" },
  { cod: "TRAB-007", doc: "9900000007", nombres: "Roberto", apellidos: "Salas", empresaRuc: "9999999900002", deptoIni: "ADMINISTRACIÓN", deptoActual: "ADMINISTRACIÓN" },
  { cod: "TRAB-008", doc: "9900000008", nombres: "Patricia", apellidos: "Vega", empresaRuc: "9999999900002", deptoIni: "OPERACIONES", deptoActual: "OPERACIONES" },
];

const MEDICAMENTOS_INVENTARIO_CONFIG = [
  { nombre: `${PREFIJO}Paracetamol 500mg`, unidad: "TABLETAS" as const, stockInicial: 100 },
  { nombre: `${PREFIJO}Ibuprofeno 400mg`, unidad: "TABLETAS" as const, stockInicial: 80 },
  { nombre: `${PREFIJO}Lemonflu`, unidad: "SOBRES" as const, stockInicial: 60 },
  { nombre: `${PREFIJO}Omeprazol 20mg`, unidad: "CAPSULAS" as const, stockInicial: 50 },
];

const MORBILIDADES_CATALOGO = [
  "Dolor abdominal",
  "Cefalea tensional",
  "Dolor lumbar",
  "Fiebre",
  "Gastritis",
  "Dolor de garganta",
];

interface ItemRegistroPlan {
  num: string;
  fecha: string;
  trabajadorDoc: string;
  empresaRuc: string;
  deptoHistorico: string;
  medicoCorreo: string;
  morbilidad: string;
  tieneEvaluacion: boolean;
  tieneFicha: boolean;
  medicamentoNombre: string;
  cantidadEntregada: number;
  procedimiento?: string;
  anulado?: boolean;
}

const REGISTROS_PLAN: ItemRegistroPlan[] = [
  // 8 registros: Eval = true, Ficha = false
  { num: `${PREFIJO}RD-001`, fecha: "2026-08-01", trabajadorDoc: "9900000001", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2, procedimiento: "Cada 5 horas" },
  { num: `${PREFIJO}RD-002`, fecha: "2026-08-01", trabajadorDoc: "9900000002", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Cefalea tensional", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-003`, fecha: "2026-08-03", trabajadorDoc: "9900000003", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor lumbar", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Ibuprofeno 400mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-004`, fecha: "2026-08-03", trabajadorDoc: "9900000004", empresaRuc: "9999999900001", deptoHistorico: "MARKETING", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Fiebre", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Lemonflu`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-005`, fecha: "2026-08-05", trabajadorDoc: "9900000005", empresaRuc: "9999999900001", deptoHistorico: "MARKETING", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Gastritis", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Omeprazol 20mg`, cantidadEntregada: 1 },
  { num: `${PREFIJO}RD-006`, fecha: "2026-08-05", trabajadorDoc: "9900000006", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Dolor de garganta", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Ibuprofeno 400mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-007`, fecha: "2026-08-10", trabajadorDoc: "9900000007", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 3 },
  { num: `${PREFIJO}RD-008`, fecha: "2026-08-10", trabajadorDoc: "9900000008", empresaRuc: "9999999900002", deptoHistorico: "OPERACIONES", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Cefalea tensional", tieneEvaluacion: true, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2 },

  // 5 registros: Eval = false, Ficha = true
  { num: `${PREFIJO}RD-009`, fecha: "2026-08-10", trabajadorDoc: "9900000001", empresaRuc: "9999999900001", deptoHistorico: "MARKETING", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: false, tieneFicha: true, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 5 },
  { num: `${PREFIJO}RD-010`, fecha: "2026-08-15", trabajadorDoc: "9900000002", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor lumbar", tieneEvaluacion: false, tieneFicha: true, medicamentoNombre: `${PREFIJO}Ibuprofeno 400mg`, cantidadEntregada: 3 },
  { num: `${PREFIJO}RD-011`, fecha: "2026-08-15", trabajadorDoc: "9900000003", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Fiebre", tieneEvaluacion: false, tieneFicha: true, medicamentoNombre: `${PREFIJO}Lemonflu`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-012`, fecha: "2026-08-15", trabajadorDoc: "9900000006", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Gastritis", tieneEvaluacion: false, tieneFicha: true, medicamentoNombre: `${PREFIJO}Omeprazol 20mg`, cantidadEntregada: 1 },
  { num: `${PREFIJO}RD-013`, fecha: "2026-08-20", trabajadorDoc: "9900000007", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Dolor de garganta", tieneEvaluacion: false, tieneFicha: true, medicamentoNombre: `${PREFIJO}Ibuprofeno 400mg`, cantidadEntregada: 2 },

  // 4 registros: Eval = true, Ficha = true
  { num: `${PREFIJO}RD-014`, fecha: "2026-08-20", trabajadorDoc: "9900000004", empresaRuc: "9999999900001", deptoHistorico: "MARKETING", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: true, tieneFicha: true, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-015`, fecha: "2026-08-20", trabajadorDoc: "9900000005", empresaRuc: "9999999900001", deptoHistorico: "MARKETING", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Cefalea tensional", tieneEvaluacion: true, tieneFicha: true, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-016`, fecha: "2026-08-25", trabajadorDoc: "9900000008", empresaRuc: "9999999900002", deptoHistorico: "OPERACIONES", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Dolor lumbar", tieneEvaluacion: true, tieneFicha: true, medicamentoNombre: `${PREFIJO}Ibuprofeno 400mg`, cantidadEntregada: 3 },
  { num: `${PREFIJO}RD-017`, fecha: "2026-08-25", trabajadorDoc: "9900000006", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Fiebre", tieneEvaluacion: true, tieneFicha: true, medicamentoNombre: `${PREFIJO}Lemonflu`, cantidadEntregada: 2 },

  // 3 registros: Eval = false, Ficha = false
  { num: `${PREFIJO}RD-018`, fecha: "2026-08-25", trabajadorDoc: "9900000002", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: false, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-019`, fecha: "2026-08-25", trabajadorDoc: "9900000003", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Cefalea tensional", tieneEvaluacion: false, tieneFicha: false, medicamentoNombre: `${PREFIJO}Lemonflu`, cantidadEntregada: 2 },
  { num: `${PREFIJO}RD-020`, fecha: "2026-08-25", trabajadorDoc: "9900000007", empresaRuc: "9999999900002", deptoHistorico: "ADMINISTRACIÓN", medicoCorreo: "juan.perez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: false, tieneFicha: false, medicamentoNombre: `${PREFIJO}Omeprazol 20mg`, cantidadEntregada: 1 },

  // 1 registro extra para probar caso de ANULACIÓN (Salida 2 + Devolución 2)
  { num: `${PREFIJO}RD-021-ANULADO`, fecha: "2026-08-25", trabajadorDoc: "9900000002", empresaRuc: "9999999900001", deptoHistorico: "SISTEMAS", medicoCorreo: "ana.lopez.test@tradetek.local", morbilidad: "Dolor abdominal", tieneEvaluacion: false, tieneFicha: false, medicamentoNombre: `${PREFIJO}Paracetamol 500mg`, cantidadEntregada: 2, anulado: true },
];

// ==========================================
// 3. MODO DRY RUN
// ==========================================

function ejecutarDryRun() {
  console.log("=================================================");
  console.log("   DRY RUN: PLAN DE DATOS DE PRUEBA DE REPORTES   ");
  console.log("=================================================");
  console.log("");
  console.log("🏢 EMPRESAS (2):");
  for (const emp of EMPRESAS_CONFIG) {
    console.log(`  - ${emp.razonSocial} (RUC: ${emp.ruc}) -> Deptos: ${emp.departamentos.join(", ")}`);
  }
  console.log("");
  console.log("👨‍⚕️ USUARIOS Y MÉDICOS (3):");
  for (const med of MEDICOS_CONFIG) {
    console.log(`  - ${med.nombres} ${med.apellidos} (${med.correo}) [Rol: ${med.rol}]`);
  }
  console.log("");
  console.log("👷 TRABAJADORES (8):");
  for (const trab of TRABAJADORES_CONFIG) {
    console.log(`  - ${trab.nombres} ${trab.apellidos} (Doc: ${trab.doc}) -> Depto Inicial: ${trab.deptoIni}, Depto Actual: ${trab.deptoActual}`);
  }
  console.log("");
  console.log("📋 REGISTROS DIARIOS Y DOCUMENTOS CLÍNICOS:");
  console.log("  - Total Registros Diarios activos: 20");
  console.log("  - Registros Diarios anulados: 1 (RD-021 para validar devoluciones de inventario)");
  console.log("  - Evaluaciones médicas esperadas: 12 (8 exclusivas + 4 combinadas)");
  console.log("  - Fichas ocupacionales esperadas: 9 (5 exclusivas + 4 combinadas)");
  console.log("  - Atenciones totales calculadas en Reporte: 20 (no se duplican por derivación)");
  console.log("");
  console.log("🩺 MORBILIDADES ESPERADAS (20 registros activos):");
  console.log("  - Dolor abdominal: 6");
  console.log("  - Cefalea tensional: 4");
  console.log("  - Dolor lumbar: 3");
  console.log("  - Fiebre: 3");
  console.log("  - Gastritis: 2");
  console.log("  - Dolor de garganta: 2");
  console.log("");
  console.log("💊 ENTREGAS DE MEDICAMENTOS ESPERADAS (Netas en activos):");
  console.log("  - Paracetamol 500mg: 20 tabletas (8 entregas en activos)");
  console.log("  - Ibuprofeno 400mg: 12 tabletas (5 entregas en activos)");
  console.log("  - Lemonflu: 8 sobres (4 entregas en activos)");
  console.log("  - Omeprazol 20mg: 3 cápsulas (3 entregas en activos)");
  console.log("  - Registro anulado RD-021: 2 Paracetamol con SALIDA y posterior DEVOLUCION (Neto: 0)");
  console.log("");
  console.log("👩‍⚕️ DISTRIBUCIÓN POR MÉDICO:");
  console.log("  - TEST-REPORTES Dra. Ana López: 12 registros activos");
  console.log("  - TEST-REPORTES Dr. Juan Pérez: 8 registros activos");
  console.log("");
  console.log("🔄 CASO HISTÓRICO TRABAJADOR 1 (Carlos Mendoza):");
  console.log("  - Semana 1 (2026-08-01) en SISTEMAS: 2 Paracetamol");
  console.log("  - Semana 2 (2026-08-10) en MARKETING: 5 Paracetamol");
  console.log("  - Filtro Empresa A + Sistemas -> Esperado: Paracetamol = 2 (no 7)");
  console.log("");
  console.log("ℹ️  Modo Dry Run finalizado con éxito. No se realizaron cambios en la base de datos.");
  console.log("   Para aplicar los datos, ejecute: npm run datos:reportes -- --apply");
}

// ==========================================
// 4. MODO CLEANUP (LIMPIEZA SEGURA)
// ==========================================

export async function limpiarDatosReportes(prisma: PrismaClient) {
  console.log("🧹 Ejecutando limpieza de datos TEST-REPORTES-*...");

  return prisma.$transaction(async (tx) => {
    // 1. Receta medicamentos y recetas
    const rm = await tx.recetaMedicamento.deleteMany({
      where: {
        receta: {
          OR: [
            { numeroReceta: { startsWith: PREFIJO } },
            { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
          ],
        },
      },
    });
    const r = await tx.recetaMedica.deleteMany({
      where: {
        OR: [
          { numeroReceta: { startsWith: PREFIJO } },
          { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
        ],
      },
    });

    // 2. Medicamentos y diagnósticos de evaluaciones
    await tx.medicamentoEvaluacion.deleteMany({
      where: {
        evaluacion: {
          OR: [
            { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
            { trabajador: { numeroDocumento: { startsWith: "990000000" } } },
          ],
        },
      },
    });
    await tx.diagnosticoEvaluacion.deleteMany({
      where: {
        evaluacion: {
          OR: [
            { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
            { trabajador: { numeroDocumento: { startsWith: "990000000" } } },
          ],
        },
      },
    });
    const ev = await tx.evaluacionMedica.deleteMany({
      where: {
        OR: [
          { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
          { trabajador: { numeroDocumento: { startsWith: "990000000" } } },
        ],
      },
    });

    // 3. Diagnósticos de fichas y fichas ocupacionales
    await tx.diagnosticoFicha.deleteMany({
      where: {
        ficha: {
          OR: [
            { numeroFicha: { startsWith: PREFIJO } },
            { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
          ],
        },
      },
    });
    const fo = await tx.fichaOcupacional.deleteMany({
      where: {
        OR: [
          { numeroFicha: { startsWith: PREFIJO } },
          { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
        ],
      },
    });

    // 4. Medicamentos de registro diario y movimientos de inventario
    await tx.registroDiarioMedicamento.deleteMany({
      where: {
        OR: [
          { registroDiario: { numeroRegistro: { startsWith: PREFIJO } } },
          { medicamentoInventario: { nombre: { startsWith: PREFIJO } } },
        ],
      },
    });
    const mi = await tx.movimientoInventario.deleteMany({
      where: {
        OR: [
          { medicamentoInventario: { nombre: { startsWith: PREFIJO } } },
          { usuario: { correo: { endsWith: "@tradetek.local" } } },
        ],
      },
    });
    const medInv = await tx.medicamentoInventario.deleteMany({
      where: { nombre: { startsWith: PREFIJO } },
    });

    // 5. Registros diarios
    const rd = await tx.registroDiarioAtencion.deleteMany({
      where: {
        OR: [
          { numeroRegistro: { startsWith: PREFIJO } },
          { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
        ],
      },
    });

    // 6. Asignaciones laborales y trabajadores
    await tx.asignacionLaboral.deleteMany({
      where: { trabajador: { numeroDocumento: { startsWith: "990000000" } } },
    });
    const tr = await tx.trabajador.deleteMany({
      where: { numeroDocumento: { startsWith: "990000000" } },
    });

    // 7. Relaciones de usuarios y usuarios
    await tx.usuarioEmpresa.deleteMany({
      where: {
        OR: [
          { usuario: { correo: { endsWith: "@tradetek.local" } } },
          { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
        ],
      },
    });
    await tx.usuarioRol.deleteMany({
      where: { usuario: { correo: { endsWith: "@tradetek.local" } } },
    });
    const u = await tx.usuario.deleteMany({
      where: { correo: { endsWith: "@tradetek.local" } },
    });

    // 8. Departamentos y empresas
    await tx.departamento.deleteMany({
      where: { empresa: { ruc: { in: ["9999999900001", "9999999900002"] } } },
    });
    const emp = await tx.empresa.deleteMany({
      where: { ruc: { in: ["9999999900001", "9999999900002"] } },
    });

    return {
      recetasMedicamentos: rm.count,
      recetas: r.count,
      evaluaciones: ev.count,
      fichas: fo.count,
      registrosDiarios: rd.count,
      movimientosInventario: mi.count,
      medicamentosInventario: medInv.count,
      trabajadores: tr.count,
      usuarios: u.count,
      empresas: emp.count,
    };
  });
}

// ==========================================
// 5. MODO APPLY (INSERCIÓN CONTROLADA)
// ==========================================

export async function aplicarDatosReportes(prisma: PrismaClient) {
  console.log("🚀 Aplicando dataset de prueba para REPORTES...");

  // Primero limpiamos cualquier residuo previo (garantiza idempotencia)
  await limpiarDatosReportes(prisma);

  return prisma.$transaction(async (tx) => {
    // A. Asegurar catálogo de morbilidades en PostgreSQL
    for (const nombre of MORBILIDADES_CATALOGO) {
      const nombreNorm = normalizarMorbilidad(nombre);
      await tx.morbilidad.upsert({
        where: { nombreNormalizado: nombreNorm },
        update: { nombre, activa: true },
        create: { nombre, nombreNormalizado: nombreNorm, activa: true },
      });
    }

    // B. Crear Empresas y Departamentos
    const mapaEmpresas = new Map<string, { id: string; ruc: string; razonSocial: string }>();
    const mapaDeptos = new Map<string, { id: string; nombre: string; empresaId: string }>();

    for (const conf of EMPRESAS_CONFIG) {
      const empresa = await tx.empresa.create({
        data: {
          razonSocial: conf.razonSocial,
          ruc: conf.ruc,
          nombreComercial: conf.nombreComercial,
          estado: "ACTIVO",
        },
      });
      mapaEmpresas.set(conf.ruc, { id: empresa.id, ruc: empresa.ruc, razonSocial: empresa.razonSocial });

      for (const nomDepto of conf.departamentos) {
        const depto = await tx.departamento.create({
          data: {
            empresaId: empresa.id,
            nombre: nomDepto,
            estado: "ACTIVO",
          },
        });
        mapaDeptos.set(`${conf.ruc}_${nomDepto}`, { id: depto.id, nombre: depto.nombre, empresaId: empresa.id });
      }
    }

    // C. Crear Roles y Usuarios
    const rolMedico = await tx.rol.findFirstOrThrow({ where: { nombre: "MÉDICO" } });
    const rolRrhh = await tx.rol.findFirstOrThrow({ where: { nombre: "RECURSOS_HUMANOS" } });

    const mapaUsuarios = new Map<string, { id: string; correo: string; nombres: string; apellidos: string; codigoProfesional: string | null }>();

    for (const uConf of MEDICOS_CONFIG) {
      const usuario = await tx.usuario.create({
        data: {
          correo: uConf.correo,
          nombres: uConf.nombres,
          apellidos: uConf.apellidos,
          claveHash: crearHash("test1234"),
          codigoProfesional: uConf.codigoProfesional,
          especialidad: uConf.especialidad,
          estado: "ACTIVO",
        },
      });
      mapaUsuarios.set(uConf.correo, { id: usuario.id, correo: usuario.correo, nombres: usuario.nombres, apellidos: usuario.apellidos, codigoProfesional: usuario.codigoProfesional });

      const rolAsignar = uConf.rol === "MÉDICO" ? rolMedico.id : rolRrhh.id;
      await tx.usuarioRol.create({
        data: { usuarioId: usuario.id, rolId: rolAsignar },
      });

      // Asignar a ambas empresas de prueba
      for (const emp of mapaEmpresas.values()) {
        await tx.usuarioEmpresa.create({
          data: { usuarioId: usuario.id, empresaId: emp.id },
        });
      }
    }

    // D. Crear Medicamentos de Inventario y Stock Inicial
    const mapaMedicamentos = new Map<string, { id: string; nombre: string; unidad: any }>();
    const adminUser = Array.from(mapaUsuarios.values())[0];

    for (const mConf of MEDICAMENTOS_INVENTARIO_CONFIG) {
      const med = await tx.medicamentoInventario.create({
        data: {
          nombre: mConf.nombre,
          unidad: mConf.unidad,
          cantidadDisponible: mConf.stockInicial,
          estado: "ACTIVO",
          creadoPorUsuarioId: adminUser.id,
        },
      });
      mapaMedicamentos.set(mConf.nombre, { id: med.id, nombre: med.nombre, unidad: med.unidad });

      // Movimiento inicial de entrada
      await tx.movimientoInventario.create({
        data: {
          medicamentoInventarioId: med.id,
          tipoMovimiento: "ENTRADA",
          cantidad: mConf.stockInicial,
          cantidadAnterior: 0,
          cantidadPosterior: mConf.stockInicial,
          motivo: "Stock inicial de prueba para reportes",
          usuarioId: adminUser.id,
        },
      });
    }

    // E. Crear Trabajadores y Asignaciones Laborales
    const mapaTrabajadores = new Map<string, { id: string; doc: string; nombres: string; apellidos: string; empresaId: string; deptoActualId: string; asignacionActualId: string; asignacionPreviaId?: string }>();

    for (const tConf of TRABAJADORES_CONFIG) {
      const emp = mapaEmpresas.get(tConf.empresaRuc)!;
      const deptoActual = mapaDeptos.get(`${tConf.empresaRuc}_${tConf.deptoActual}`)!;

      const trab = await tx.trabajador.create({
        data: {
          empresaId: emp.id,
          departamentoId: deptoActual.id,
          tipoDocumento: "CEDULA",
          numeroDocumento: tConf.doc,
          nombres: `${PREFIJO}${tConf.nombres}`,
          apellidos: tConf.apellidos,
          estadoLaboral: "ACTIVO",
        },
      });

      let asigPreviaId: string | undefined;

      // Caso Trabajador 1 con cambio histórico de departamento:
      if (tConf.deptoIni !== tConf.deptoActual) {
        const deptoIni = mapaDeptos.get(`${tConf.empresaRuc}_${tConf.deptoIni}`)!;
        const asig1 = await tx.asignacionLaboral.create({
          data: {
            trabajadorId: trab.id,
            empresaId: emp.id,
            departamentoId: deptoIni.id,
            activa: false,
            estado: "FINALIZADO",
            fechaInicio: new Date("2026-08-01T00:00:00.000Z"),
            fechaFin: new Date("2026-08-07T00:00:00.000Z"),
          },
        });
        asigPreviaId = asig1.id;
      }

      const asigActual = await tx.asignacionLaboral.create({
        data: {
          trabajadorId: trab.id,
          empresaId: emp.id,
          departamentoId: deptoActual.id,
          activa: true,
          estado: "ACTIVO",
          fechaInicio: new Date(tConf.deptoIni !== tConf.deptoActual ? "2026-08-08T00:00:00.000Z" : "2026-08-01T00:00:00.000Z"),
        },
      });

      mapaTrabajadores.set(tConf.doc, {
        id: trab.id,
        doc: trab.numeroDocumento,
        nombres: trab.nombres,
        apellidos: trab.apellidos,
        empresaId: emp.id,
        deptoActualId: deptoActual.id,
        asignacionActualId: asigActual.id,
        asignacionPreviaId: asigPreviaId,
      });
    }

    // F. Crear Registros Diarios, Evaluaciones, Fichas, Entregas y Movimientos
    let contadorEval = 0;
    let contadorFicha = 0;
    let contadorRecetas = 0;

    for (const item of REGISTROS_PLAN) {
      const trab = mapaTrabajadores.get(item.trabajadorDoc)!;
      const emp = mapaEmpresas.get(item.empresaRuc)!;
      const depto = mapaDeptos.get(`${item.empresaRuc}_${item.deptoHistorico}`)!;
      const med = mapaUsuarios.get(item.medicoCorreo)!;
      const fechaAtencion = new Date(`${item.fecha}T08:00:00.000Z`);

      // 1. Registro Diario
      const reg = await tx.registroDiarioAtencion.create({
        data: {
          numeroRegistro: item.num,
          trabajadorId: trab.id,
          empresaId: emp.id,
          departamentoId: depto.id,
          profesionalId: med.id,
          apellidosNombres: `${trab.apellidos} ${trab.nombres}`,
          cedula: trab.doc,
          diaAtencion: fechaAtencion,
          atencionMorbilidad: item.morbilidad,
          medicacion: `${item.medicamentoNombre} x${item.cantidadEntregada}`,
          empresaNombreHistorico: emp.razonSocial,
          empresaRucHistorico: emp.ruc,
          departamentoNombreHistorico: depto.nombre,
          profesionalNombreHistorico: `${med.apellidos} ${med.nombres}`.trim(),
          procedimiento: item.procedimiento ?? null,
          estado: item.anulado ? "ANULADO" : "REGISTRADO",
          creadoPorId: med.id,
          observaciones: ORIGEN_TAG,
        },
      });

      // 2. Entrega y Movimiento de Inventario
      const medInv = mapaMedicamentos.get(item.medicamentoNombre)!;
      const medDb = await tx.medicamentoInventario.findUniqueOrThrow({ where: { id: medInv.id } });
      const cantAnterior = Number(medDb.cantidadDisponible);
      const cantPosterior = cantAnterior - item.cantidadEntregada;

      await tx.medicamentoInventario.update({
        where: { id: medInv.id },
        data: { cantidadDisponible: cantPosterior },
      });

      const movSalida = await tx.movimientoInventario.create({
        data: {
          medicamentoInventarioId: medInv.id,
          tipoMovimiento: "SALIDA",
          cantidad: item.cantidadEntregada,
          cantidadAnterior: cantAnterior,
          cantidadPosterior: cantPosterior,
          motivo: `Entrega por registro diario ${reg.numeroRegistro}`,
          referenciaTipo: "REGISTRO_DIARIO",
          referenciaId: reg.id,
          usuarioId: med.id,
          creadoEn: fechaAtencion,
        },
      });

      await tx.registroDiarioMedicamento.create({
        data: {
          registroDiarioId: reg.id,
          medicamentoInventarioId: medInv.id,
          nombreSnapshot: medInv.nombre,
          unidadSnapshot: medInv.unidad,
          cantidadEntregada: item.cantidadEntregada,
          movimientoInventarioId: movSalida.id,
        },
      });

      // Si el registro es de tipo ANULADO, registrar devolución inmediata
      if (item.anulado) {
        const cantDevuelto = cantPosterior + item.cantidadEntregada;
        await tx.medicamentoInventario.update({
          where: { id: medInv.id },
          data: { cantidadDisponible: cantDevuelto },
        });

        await tx.movimientoInventario.create({
          data: {
            medicamentoInventarioId: medInv.id,
            tipoMovimiento: "DEVOLUCION",
            cantidad: item.cantidadEntregada,
            cantidadAnterior: cantPosterior,
            cantidadPosterior: cantDevuelto,
            motivo: `Devolución por anulación de registro diario ${reg.numeroRegistro}`,
            referenciaTipo: "REGISTRO_DIARIO_ANULADO",
            referenciaId: reg.id,
            usuarioId: med.id,
            creadoEn: fechaAtencion,
          },
        });
      }

      // 3. Evaluacion Medica (si aplica)
      let evalId: string | null = null;
      if (item.tieneEvaluacion) {
        contadorEval++;
        const evaluacion = await tx.evaluacionMedica.create({
          data: {
            trabajadorId: trab.id,
            empresaId: emp.id,
            departamentoId: depto.id,
            asignacionLaboralId: item.deptoHistorico === "SISTEMAS" && trab.asignacionPreviaId ? trab.asignacionPreviaId : trab.asignacionActualId,
            registroDiarioId: reg.id,
            usuarioId: med.id,
            fechaAtencion,
            morbilidad: item.morbilidad,
            motivoConsulta: "Evaluación clínica ocupacional",
            empresaNombreHistorico: emp.razonSocial,
            empresaRucHistorico: emp.ruc,
            departamentoNombreHistorico: depto.nombre,
            profesionalNombreHistorico: `${med.apellidos} ${med.nombres}`.trim(),
            trabajadorNombreHistorico: `${trab.apellidos} ${trab.nombres}`.trim(),
            trabajadorDocumentoHistorico: trab.doc,
            estado: "FINALIZADA",
            creadoPorId: med.id,
          },
        });
        evalId = evaluacion.id;

        // Crear 4 recetas derivadas de evaluaciones para validar que NO afecten inventario entregado
        if (contadorRecetas < 4 && contadorEval % 3 === 1) {
          contadorRecetas++;
          await tx.recetaMedica.create({
            data: {
              numeroReceta: `${PREFIJO}REC-00${contadorRecetas}`,
              evaluacionId: evalId,
              registroDiarioId: reg.id,
              trabajadorId: trab.id,
              empresaId: emp.id,
              departamentoId: depto.id,
              profesionalId: med.id,
              fechaEmision: fechaAtencion,
              estado: "EMITIDA",
              empresaNombreHistorico: emp.razonSocial,
              empresaRucHistorico: emp.ruc,
              profesionalNombreHistorico: `${med.apellidos} ${med.nombres}`.trim(),
              trabajadorNombreHistorico: `${trab.apellidos} ${trab.nombres}`.trim(),
              trabajadorDocumentoHistorico: trab.doc,
              creadoPorId: med.id,
              medicamentos: {
                create: [
                  {
                    nombreMedicamentoHistorico: "Paracetamol 500mg",
                    presentacionHistorica: "Tabletas",
                    cantidad: "10",
                    dosis: "500mg",
                    frecuencia: "Cada 8 horas",
                    duracion: "3 días",
                    viaAdministracion: "Oral",
                  },
                ],
              },
            },
          });
        }
      }

      // 4. Ficha Ocupacional (si aplica)
      if (item.tieneFicha) {
        contadorFicha++;
        await tx.fichaOcupacional.create({
          data: {
            numeroFicha: `${PREFIJO}FO-00${contadorFicha}`,
            trabajadorId: trab.id,
            empresaId: emp.id,
            departamentoId: depto.id,
            asignacionLaboralId: item.deptoHistorico === "SISTEMAS" && trab.asignacionPreviaId ? trab.asignacionPreviaId : trab.asignacionActualId,
            registroDiarioId: reg.id,
            usuarioId: med.id,
            fechaAtencion,
            tipoEvaluacion: "PERIODICA",
            aptitudMedica: "APTO",
            empresaNombreHistorico: emp.razonSocial,
            empresaRucHistorico: emp.ruc,
            departamentoNombreHistorico: depto.nombre,
            profesionalNombres: `${med.apellidos} ${med.nombres}`.trim(),
            profesionalCodigoMedico: med.codigoProfesional ?? undefined,
            estado: "FINALIZADA",
            creadoPorId: med.id,
          },
        });
      }
    }

    return {
      empresas: mapaEmpresas.size,
      departamentos: mapaDeptos.size,
      usuarios: mapaUsuarios.size,
      trabajadores: mapaTrabajadores.size,
      medicamentosInventario: mapaMedicamentos.size,
      registrosDiarios: REGISTROS_PLAN.length,
      evaluaciones: contadorEval,
      fichas: contadorFicha,
      recetas: contadorRecetas,
    };
  }, { timeout: 30000, maxWait: 15000 });
}

// ==========================================
// 6. PUNTO DE ENTRADA PRINCIPAL
// ==========================================

async function main() {
  const flags = process.argv.slice(2);
  const esDryRun = flags.includes("--dry-run");
  const esApply = flags.includes("--apply");
  const esCleanup = flags.includes("--cleanup");

  if (!esDryRun && !esApply && !esCleanup) {
    console.log("Uso de scripts/cargar-datos-reportes.ts:");
    console.log("  npm run datos:reportes -- --dry-run   (Muestra expectativas sin modificar BD)");
    console.log("  npm run datos:reportes -- --apply     (Aplica el dataset de prueba de forma segura)");
    console.log("  npm run datos:reportes -- --cleanup   (Elimina únicamente los datos de prueba TEST-REPORTES-*)");
    process.exit(0);
  }

  const { databaseUrl, host, port, dbName } = verificarEntornoSeguro();
  console.log(`🔒 Entorno verificado: Host=${host}, Port=${port}, DB=${dbName}`);

  if (esDryRun) {
    ejecutarDryRun();
    process.exit(0);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    if (esCleanup) {
      const res = await limpiarDatosReportes(prisma);
      console.log("✅ Limpieza completada con éxito:");
      console.log(res);
      process.exit(0);
    }

    if (esApply) {
      const res = await aplicarDatosReportes(prisma);
      console.log("✅ Dataset de prueba para REPORTES aplicado con éxito:");
      console.log(res);
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ ERROR durante la ejecución:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
