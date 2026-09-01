# Auditoría de Normalización e Integridad de Base de Datos

**Sistema:** Sistema de Historial Clínico Ocupacional  
**Motor:** PostgreSQL 16+  
**ORM:** Prisma ORM  
**Fecha de Auditoría:** 28 de Agosto de 2026  
**Alcance:** Esquema de Base de Datos (`prisma/schema.prisma`), 28 migraciones SQL (`prisma/migrations/`) y repositorios de datos (`src/modulos/**/repositorios/`).

---

## 1. Resumen Ejecutivo

La base de datos del sistema está clasificada globalmente como:

### **Clasificación: 3FN con Desnormalizaciones Temporales Intencionales y Modelo Híbrido Relacional/Documental (3NF with Intentional Temporal Snapshots).**

El diseño de la base de datos es **altamente maduro, sólido y está conscientemente diseñado para el dominio de la medicina ocupacional y legal ecuatoriana**. No se trata de una base de datos descuidada o mal estructurada; por el contrario, aplica patrones avanzados de:
1. **Snapshots Inmutables de Punto en el Tiempo:** Preservación estricta de la información médica emitida, cumpliendo con regulaciones legales donde un documento firmado nunca debe cambiar aunque la empresa o el paciente cambien de nombre en el futuro.
2. **Patrón de Libro Mayor (Ledger Pattern) para Inventario:** Mantenimiento de balance materializado (`cantidadDisponible`) respaldado por un registro inmutable de auditoría de movimientos (`MovimientoInventario`).
3. **Integridad Referencial Preventiva (`onDelete: Restrict`):** Bloqueo total de borrado en cascada para registros clínicos sensibles.
4. **Almacenamiento Documental JSON Controlado:** Uso de JSON para sub-secciones clínicas de baja variabilidad del Formulario 078 (MSP/IESS).

---

## 2. Inventario Completo de Modelos (32 Modelos Reales)

| Modelo | Tabla SQL | Clave Primaria (PK) | Claves Foráneas (FKs) | Claves Únicas (@unique / @@unique) | Índices Adicionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Usuario`** | `Usuario` | `id` (UUID) | — | `cedula`, `correo` | — |
| **`Rol`** | `Rol` | `id` (UUID) | — | `nombre` | — |
| **`Permiso`** | `Permiso` | `id` (UUID) | — | `codigo` | — |
| **`UsuarioRol`** | `UsuarioRol` | `@@id([usuarioId, rolId])` | `usuarioId`, `rolId` | — | — |
| **`RolPermiso`** | `RolPermiso` | `@@id([rolId, permisoId])` | `rolId`, `permisoId` | — | — |
| **`Empresa`** | `Empresa` | `id` (UUID) | — | `ruc` | `estado` |
| **`UsuarioEmpresa`** | `UsuarioEmpresa` | `@@id([usuarioId, empresaId])`| `usuarioId`, `empresaId`| — | `empresaId` |
| **`Departamento`** | `Departamento` | `id` (UUID) | `empresaId` | `@@unique([empresaId, nombre])` | `empresaId`, `estado` |
| **`Trabajador`** | `Trabajador` | `id` (UUID) | `empresaId`, `departamentoId`, `creadoPorId`, `actualizadoPorId` | `@@unique([tipoDocumento, numeroDocumento])` | `empresaId`, `departamentoId` |
| **`AsignacionLaboral`** | `VinculoLaboral` | `id` (UUID) | `trabajadorId`, `empresaId`, `departamentoId` | — | `trabajadorId`, `empresaId`, `departamentoId`, `[trabajadorId, activa]` |
| **`Auditoria`** | `Auditoria` | `id` (UUID) | `usuarioId` | — | — |
| **`EnfermedadCie10`** | `enfermedades_cie10` | `id` (UUID) | `categoriaPadreCodigo` | `codigo` | `codigo`, `descripcion`, `categoriaPadreCodigo` |
| **`SinonimoCie10`** | `sinonimos_cie10` | `id` (UUID) | `enfermedadId` | `@@unique([termino, enfermedadId])` | `termino`, `enfermedadId` |
| **`FichaOcupacional`** | `FichaOcupacional` | `id` (UUID) | `trabajadorId`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `atencionMedicaId`, `registroDiarioId`, `usuarioId`, `creadoPorId`, `actualizadoPorId` | `numeroFicha` | `trabajadorId`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `atencionMedicaId`, `registroDiarioId`, `usuarioId`, `tipoEvaluacion`, `estado` |
| **`AlergiaTrabajador`** | `AlergiaTrabajador`| `id` (UUID) | `trabajadorId` | — | `[trabajadorId, activa]`, `[tipo, sustancia]` |
| **`EvaluacionMedica`** | `EvaluacionMedica` | `id` (UUID) | `trabajadorId`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `atencionMedicaId`, `registroDiarioId`, `usuarioId`, `creadoPorId`, `actualizadoPorId` | `numeroEvaluacion` | `[trabajadorId, estado]`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `atencionMedicaId`, `registroDiarioId`, `usuarioId`, `fechaAtencion` |
| **`DiagnosticoEvaluacion`** | `DiagnosticoEvaluacion` | `id` (UUID) | `evaluacionId`, `enfermedadId` | `@@unique([evaluacionId, enfermedadId])` | `enfermedadId` |
| **`Medicamento`** | `Medicamento` | `id` (UUID) | — | `@@unique([nombreGenerico, presentacion])` | `nombreGenerico`, `activo` |
| **`MedicamentoEvaluacion`**| `MedicamentoEvaluacion`| `id` (UUID) | `evaluacionId`, `medicamentoId` | — | `evaluacionId`, `medicamentoId` |
| **`RecetaMedica`** | `Receta` | `id` (UUID) | `atencionMedicaId`, `evaluacionId`, `registroDiarioId`, `fichaOcupacionalId`, `documentoClinicoId`, `trabajadorId`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `profesionalId`, `creadoPorId`, `alergiaConfirmadaPorId` | `numeroReceta`, `evaluacionId` | `atencionMedicaId`, `evaluacionId`, `registroDiarioId`, `fichaOcupacionalId`, `documentoClinicoId`, `asignacionLaboralId`, `trabajadorId`, `empresaId`, `profesionalId`, `alergiaConfirmadaPorId`, `fechaEmision`, `estado` |
| **`RecetaMedicamento`** | `RecetaMedicamento` | `id` (UUID) | `recetaId`, `medicamentoId` | — | `recetaId`, `medicamentoId` |
| **`DiagnosticoFicha`** | `DiagnosticoFicha` | `id` (UUID) | `fichaId`, `enfermedadId` | `@@unique([fichaId, enfermedadId])` | `fichaId`, `enfermedadId` |
| **`AtencionMedica`** | `AtencionMedica` | `id` (UUID) | `trabajadorId`, `empresaId`, `departamentoId`, `asignacionLaboralId`, `profesionalResponsableId`, `creadoPorId` | — | `trabajadorId`, `empresaId`, `departamentoId`, `fechaAtencion`, `estado` |
| **`RegistroDiarioAtencion`**| `registros_diarios_atencion` | `id` (UUID) | `trabajadorId`, `atencionMedicaId`, `empresaId`, `departamentoId`, `profesionalId`, `creadoPorId` | `numeroRegistro` | `trabajadorId`, `diaAtencion`, `empresaId`, `cedula`, `estado` |
| **`MedicamentoInventario`** | `medicamentos_inventario` | `id` (UUID) | `creadoPorUsuarioId`, `actualizadoPorUsuarioId` | — | `nombre`, `estado` |
| **`MovimientoInventario`** | `movimientos_inventario` | `id` (UUID) | `medicamentoInventarioId`, `usuarioId` | — | `medicamentoInventarioId`, `tipoMovimiento`, `[referenciaTipo, referenciaId]`, `usuarioId` |
| **`RegistroDiarioMedicamento`**| `registro_diario_medicamentos` | `id` (UUID) | `registroDiarioId`, `medicamentoInventarioId`, `movimientoInventarioId` | `@@unique([registroDiarioId, medicamentoInventarioId])`, `movimientoInventarioId` | `registroDiarioId`, `medicamentoInventarioId` |
| **`DocumentoClinico`** | `DocumentoClinico` | `id` (UUID) | `trabajadorId`, `registroDiarioId`, `evaluacionMedicaId`, `fichaOcupacionalId`, `empresaId`, `departamentoId`, `profesionalId`, `creadoPorId`, `actualizadoPorId` | `numeroDocumento` | `[trabajadorId, fechaDocumento]`, `registroDiarioId`, `evaluacionMedicaId`, `fichaOcupacionalId`, `empresaId`, `profesionalId`, `estado` |
| **`DocumentoClinicoDiagnostico`** | `DocumentoClinicoDiagnostico` | `id` (UUID) | `documentoClinicoId`, `enfermedadId` | `@@unique([documentoClinicoId, enfermedadId])` | `enfermedadId` |
| **`DocumentoClinicoTratamiento`** | `DocumentoClinicoTratamiento` | `id` (UUID) | `documentoClinicoId`, `medicamentoId` | — | `documentoClinicoId`, `medicamentoId` |
| **`CitaMedica`** | `CitaMedica` | `id` (UUID) | `trabajadorId`, `empresaId`, `departamentoId`, `profesionalId`, `atencionMedicaId`, `creadoPorId` | — | `trabajadorId`, `empresaId`, `profesionalId`, `atencionMedicaId`, `fecha`, `estado` |
| **`Morbilidad`** | `Morbilidad` | `id` (UUID) | — | `nombreNormalizado` | — |

---

## 3. Análisis de Primera Forma Normal (1FN)

**Regla 1FN:** Cada columna debe contener valores atómicos indivisibles; no debe haber listas repetidas dentro de una celda.

### Evaluación del Esquema:
1. **Campos Escalares Relacionales:** Todos los modelos principales (`Trabajador`, `Usuario`, `Empresa`, `Departamento`, `AtencionMedica`, `CitaMedica`, `MedicamentoInventario`, `MovimientoInventario`) tienen tipos de datos estrictamente atómicos (`String`, `Int`, `Decimal`, `DateTime`, `Uuid`, `Boolean`).
2. **Entidades Relacionales vs Strings Separados por Comas:**
   - Los diagnósticos CIE-10 no se guardan como cadenas separadas por comas; tienen sus tablas normalizadas `DiagnosticoEvaluacion`, `DiagnosticoFicha` y `DocumentoClinicoDiagnostico`.
   - Los medicamentos no se guardan como texto plano; tienen `RecetaMedicamento`, `MedicamentoEvaluacion`, `RegistroDiarioMedicamento` y `DocumentoClinicoTratamiento`.
   - Las alergias están normalizadas en `AlergiaTrabajador`.
3. **Uso de Columnas `Json` en `FichaOcupacional`:**
   - La `FichaOcupacional` incluye columnas `Json` (`examenFisico`, `consumoSustancias`, `examenesFemeninos`, `examenesMasculinos`, `actividadesRiesgo`, `factoresRiesgo`, `antecedentesLaborales`, `actividadesExtralaborales`, `resultadosExamenes`).
   - **Evaluación:** En teoría pura de base de datos relacional, JSON no es 1FN estricto. **Sin embargo, en la práctica de bases de datos PostgreSQL modernas, este modelo híbrido relacional-documental es la solución estándar recomendada por la industria** para formularios médicos con más de 120 campos variables (evita crear 15 tablas puente de 1 sola fila por ficha).
4. **Campo `RegistroDiarioAtencion.medicacion`:**
   - Guarda un resumen de texto generado automáticamente (`"Paracetamol (10 TABLETAS); Ibuprofeno (5 CAPSULAS)"`).
   - **Evaluación:** No viola la integridad porque las entregas reales y su descuento de stock están normalizados en la tabla 1:N `RegistroDiarioMedicamento`. El campo `medicacion` actúa como un resumen para visualización rápida y respaldo de texto.

---

## 4. Análisis de Segunda Forma Normal (2FN)

**Regla 2FN:** Cumple 1FN y ningún atributo no clave depende funcionalmente de una parte de una clave primaria compuesta (dependencia parcial).

### Evaluación de Claves Compuestas:
1. **`UsuarioRol` (`@@id([usuarioId, rolId])`):** El único atributo es `asignadoEn`, que depende de la combinación de usuario y rol (cuándo se asignó). **Cumple 2FN.**
2. **`RolPermiso` (`@@id([rolId, permisoId])`):** Atributo `asignadoEn` depende de ambos. **Cumple 2FN.**
3. **`UsuarioEmpresa` (`@@id([usuarioId, empresaId])`):** Atributo `asignadoEn` depende de ambos. **Cumple 2FN.**
4. **Tablas con PK simple (`id: UUID`) y `@@unique` compuesto:**
   - `DiagnosticoEvaluacion` (`@@unique([evaluacionId, enfermedadId])`): `pre` y `def` indican si el diagnóstico es presuntivo o definitivo *para esa evaluación y esa enfermedad*. **Cumple 2FN.**
   - `DiagnosticoFicha` (`@@unique([fichaId, enfermedadId])`): **Cumple 2FN.**
   - `DocumentoClinicoDiagnostico` (`@@unique([documentoClinicoId, enfermedadId])`): **Cumple 2FN.**
   - `RegistroDiarioMedicamento` (`@@unique([registroDiarioId, medicamentoInventarioId])`): `cantidadEntregada` depende del par registro-medicamento. **Cumple 2FN.**

---

## 5. Análisis de Tercera Forma Normal (3FN) y Snapshots Históricos

**Regla 3FN:** Cumple 2FN y no existen dependencias transitivas (ningún atributo no clave depende de otro atributo no clave: $X \to Y \to Z$).

### Diferenciación Crítica: Redundancia Injustificada vs Snapshot Histórico Legal

En sistemas administrativos comunes, tener `empresaId` y `empresaNombre` en la misma tabla se consideraría una violación de 3FN. **En un sistema de historial clínico ocupacional, NO lo es**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ¿POR QUÉ EXISTEN LOS CAMPOS HISTÓRICOS?                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Un documento médico emitido (Ficha, Evaluación, Receta) es un ACTO LEGAL.│
│ 2. Si la Empresa "Apracam S.A." cambia de RUC o razón social en 2027 a     │
│    "Apracam Corp", una receta emitida en 2025 DEBE SEGUIR DICIENDO          │
│    "Apracam S.A." con su RUC original al imprimirse o auditarse.            │
│ 3. La FK (empresaId) permite consultar la empresa actual en tiempo real.    │
│ 4. El snapshot (empresaNombreHistorico) preserva el valor inmutable del día │
│    de la firma médica.                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tabla de Snapshots Históricos Justificados:

| Modelo | Campo Snapshot | FK Relacionada | Justificación Legal / Clínica | Clasificación |
| :--- | :--- | :--- | :--- | :--- |
| **`RecetaMedica`** | `trabajadorNombreHistorico`, `trabajadorDocumentoHistorico`, `trabajadorSexoHistorico`, `trabajadorNacimientoHistorico` | `trabajadorId` | Conservar datos del paciente exactos al momento de la prescripción. | **SNAPSHOT JUSTIFICADO** |
| **`RecetaMedica`** | `empresaNombreHistorico`, `empresaRucHistorico`, `empresaDireccionHistorica`, `empresaTelefonoHistorico` | `empresaId` | Conservar membrete de la empresa empleadora al momento de emitir la receta. | **SNAPSHOT JUSTIFICADO** |
| **`RecetaMedica`** | `profesionalNombreHistorico`, `profesionalCodigoHistorico`, `profesionalEspecialidadHistorica` | `profesionalId` | Conservar credenciales del médico prescriptor inmutables. | **SNAPSHOT JUSTIFICADO** |
| **`RecetaMedicamento`** | `nombreMedicamentoHistorico`, `presentacionHistorica`, `concentracionHistorica` | `medicamentoId` | Si el catálogo de medicamentos cambia o se da de baja, la receta histórica no se altera. | **SNAPSHOT JUSTIFICADO** |
| **`EvaluacionMedica`** | `empresaNombreHistorico`, `empresaRucHistorico`, `departamentoNombreHistorico`, `trabajadorNombreHistorico`, `trabajadorDocumentoHistorico`, `profesionalNombreHistorico` | `empresaId`, `departamentoId`, `trabajadorId`, `usuarioId` | Inmutabilidad de la evaluación clínica periódica. | **SNAPSHOT JUSTIFICADO** |
| **`RegistroDiarioAtencion`**| `apellidosNombres`, `cedula`, `empresaNombreHistorico`, `empresaRucHistorico`, `profesionalNombreHistorico` | `trabajadorId`, `empresaId`, `profesionalId` | Inmutabilidad de la atención rápida en tópico de enfermería. | **SNAPSHOT JUSTIFICADO** |
| **`RegistroDiarioMedicamento`**| `nombreSnapshot`, `unidadSnapshot` | `medicamentoInventarioId` | Conservar nombre y unidad del fármaco entregado aunque se edite en bodega. | **SNAPSHOT JUSTIFICADO** |
| **`DocumentoClinico`** | `trabajadorNombreHistorico`, `empresaNombreHistorico`, `profesionalNombreHistorico` | `trabajadorId`, `empresaId`, `profesionalId` | Inmutabilidad del certificado o documento emitido. | **SNAPSHOT JUSTIFICADO** |
| **`DocumentoClinicoDiagnostico`** | `codigoHistorico`, `descripcionHistorica` | `enfermedadId` | Preservar texto diagnóstico de CIE-10 al momento de la emisión. | **SNAPSHOT JUSTIFICADO** |

### Redundancia Detectada en Entidades Maestras (Observación de 3FN menor):
- **Modelo `Trabajador`:** Contiene `empresaId` y `departamentoId` directamente, mientras que el modelo `AsignacionLaboral` (`VinculoLaboral`) también relaciona `trabajadorId`, `empresaId` y `departamentoId`.
  - **Evaluación:** El campo en `Trabajador` representa la adscripción actual rápida para consultas directas, mientras que `AsignacionLaboral` registra el historial de ingresos, reingresos y salidas con `activa = true/false`.
  - **Recomendación:** Mantener como está. Es un compromiso deliberado de rendimiento muy común en App Router.

---

## 6. Análisis de Forma Normal de Boyce-Codd (BCNF)

En todos los modelos donde existen dependencias funcionales $X \to Y$, $X$ es una superclave:
- `Empresa`: `ruc` es clave candidata (`@unique`).
- `Usuario`: `correo` y `cedula` son claves candidatas (`@unique`).
- `EnfermedadCie10`: `codigo` es clave candidata (`@unique`).
- `Departamento`: `(empresaId, nombre)` es clave candidata (`@@unique`).
- `Morbilidad`: `nombreNormalizado` es clave candidata (`@unique`).

**Conclusión BCNF:** Se cumple en todas las entidades maestras y catálogos.

---

## 7. Análisis del Patrón de Stock e Inventario

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PATRÓN DE CONTROL DE STOCK DE INVENTARIO                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   MedicamentoInventario ─────────────┐                                      │
│   (cantidadDisponible)               │                                      │
│                                      ▼ (Actualización en $transaction)      │
│                            MovimientoInventario                             │
│                            - tipoMovimiento: ENTRADA | SALIDA | AJUSTE      │
│                            - cantidad: Decimal                              │
│                            - cantidadAnterior: Decimal                      │
│                            - cantidadPosterior: Decimal                     │
│                            - referenciaTipo: REGISTRO_DIARIO                │
│                            - referenciaId: ID_REGISTRO                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

1. **¿Es `cantidadDisponible` un dato derivado?**  
   Teóricamente sí: es la suma algebraica de todos los movimientos históricos.
2. **¿Por qué está persistido en `MedicamentoInventario`?**  
   **Por rendimiento y concurrencia.** En bases de datos con miles de salidas diarias, ejecutar un `SUM()` sobre la tabla de movimientos cada vez que se lista el inventario o se abre un selector de medicamentos saturaría la CPU de PostgreSQL.
3. **Mecanismo de Reconciliación:**
   Cada fila de `MovimientoInventario` almacena explícitamente `cantidadAnterior` y `cantidadPosterior`. Esto permite:
   - Auditar cualquier discrepancia matemática instantáneamente.
   - Revertir movimientos de forma determinista (como se hace en `registrarDevolucionRegistroDiarioTx`).
   - Evitar condiciones de carrera mediante validación atómica en `prisma.$transaction`.

---

## 8. Análisis de Claves Únicas e Identificadores Naturales

| Modelo | Campo Natural | Tipo de Restricción | Estado |
| :--- | :--- | :--- | :--- |
| **`Usuario`** | `correo` | `@unique` (Global) | ✅ Correcto |
| **`Usuario`** | `cedula` | `@unique` (Global) | ✅ Correcto |
| **`Empresa`** | `ruc` | `@unique` (Global) | ✅ Correcto |
| **`Trabajador`** | `(tipoDocumento, numeroDocumento)` | `@@unique` (Global) | ✅ Correcto |
| **`Departamento`** | `(empresaId, nombre)` | `@@unique` (Por empresa) | ✅ Correcto (mismo nombre de departamento puede existir en otra empresa) |
| **`RecetaMedica`** | `numeroReceta` | `@unique` (Correlativo global) | ✅ Correcto (`REC-xxx`) |
| **`RegistroDiarioAtencion`** | `numeroRegistro` | `@unique` (Correlativo global) | ✅ Correcto |
| **`EvaluacionMedica`** | `numeroEvaluacion`| `@unique` (Correlativo global) | ✅ Correcto |
| **`FichaOcupacional`** | `numeroFicha` | `@unique` (Correlativo global) | ✅ Correcto |
| **`DocumentoClinico`** | `numeroDocumento` | `@unique` (Correlativo global) | ✅ Correcto |
| **`Morbilidad`** | `nombreNormalizado` | `@unique` (Global) | ✅ Correcto |
| **`Medicamento`** | `(nombreGenerico, presentacion)` | `@@unique` (Global) | ✅ Correcto |
| **`SinonimoCie10`** | `(termino, enfermedadId)` | `@@unique` | ✅ Correcto |

---

## 9. Análisis de Políticas de Cascada (`onDelete`)

| Relación Principal | Regla `onDelete` | Justificación |
| :--- | :--- | :--- |
| `Trabajador` → Documentos clínicos (`Ficha`, `Evaluacion`, `Receta`, `RegistroDiario`) | `Restrict` | **CRÍTICO:** Impide que se borre un trabajador si tiene historial médico legal. |
| `Empresa` → `Trabajador`, `Departamento`, `Atenciones` | `Restrict` | **CRÍTICO:** Impide borrado accidental de una empresa con trabajadores adscritos. |
| `Usuario` → `UsuarioRol`, `UsuarioEmpresa` | `Cascade` | **CORRECTO:** Si se elimina un usuario del sistema, sus asignaciones de roles y empresas se limpian. |
| `Usuario` (médico) → `Receta`, `Evaluacion`, `Ficha` | `Restrict` | **CORRECTO:** No se puede borrar la cuenta de un médico si es el responsable legal de documentos emitidos. |
| `Usuario` (auditoría/autor) → `creadoPor`, `actualizadoPor` | `SetNull` | **CORRECTO:** Si un usuario administrativo secundario es dado de baja, los metadatos de autoría no rompen el documento. |

---

## 10. Detección de Posibles Anomalías Clásicas

### 1. Anomalía de Inserción: **NO DETECTADA**
- Se puede crear una `Empresa` sin trabajadores.
- Se puede crear un `Departamento` sin trabajadores.
- Se puede crear un `Medicamento` en catálogo sin registrar recetas.
- Se puede crear un `MedicamentoInventario` sin registrar salidas.

### 2. Anomalía de Actualización: **CONTROLADA POR DISEÑO**
- Cambiar la razón social de una `Empresa` en la tabla `Empresa` actualiza inmediatamente el catálogo actual en 1 sola fila.
- Los documentos emitidos del pasado conservan intencionalmente `empresaNombreHistorico` sin actualizarse, lo cual es el comportamiento deseado por ley médica.

### 3. Anomalía de Borrado: **PROTEGIDA POR `onDelete: Restrict`**
- No es posible borrar una empresa o un trabajador y dejar recetas o evaluaciones huérfanas en la base de datos.

---

## 11. Tabla Consolidada de Hallazgos y Observaciones

| Prioridad | Modelo | Aspecto Analizado | Clasificación | Riesgo | Recomendación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INFORMATIVA** | `FichaOcupacional` | Columnas `Json` para secciones del Formulario 078 MSP | Modelo Híbrido Relacional/Documental | Ninguno | **MANTENER:** Es la solución óptima en PostgreSQL para formularios con >100 variables clínicas. |
| **INFORMATIVA** | `RecetaMedica`, `EvaluacionMedica`, `RegistroDiarioAtencion` | Campos con sufijo `Historico` (`empresaNombreHistorico`, etc.) | Snapshot Temporal Intencional | Ninguno | **MANTENER:** Requisito legal indispensable para inmutabilidad de documentos médicos firmados. |
| **INFORMATIVA** | `MedicamentoInventario` | `cantidadDisponible` como balance materializado | Patrón de Libro Mayor (Ledger) | Bajo (gestionado por `$transaction`) | **MANTENER:** Garantiza lecturas instantáneas del stock con trazabilidad total en `MovimientoInventario`. |
| **INFORMATIVA** | `Trabajador` vs `AsignacionLaboral` | Duplicidad de `empresaId` y `departamentoId` | Desnormalización de acceso rápido | Ninguno | **MANTENER:** `Trabajador` tiene el puntero activo y `AsignacionLaboral` el historial temporal. |
| **BAJA** | `RecetaMedicamento` | `cantidad`, `dosis`, `duracion` almacenados como `String` | Flexibilidad de Prescripción Libre | Muy bajo | **MANTENER:** Permite indicaciones médicas libres como *"1/2 tableta"*, *"5 ml cada 8h por 3 días"*. |

---

## 12. Qué NO Cambiar

1. **NO eliminar las columnas `*Historico`:** Destruiría la inmutabilidad y validez legal de las recetas y evaluaciones emitidas en el pasado.
2. **NO desmembrar los campos `Json` de `FichaOcupacional` en 15 tablas relacionales:** Aumentaría innecesariamente la complejidad de consultas (`JOIN` masivos) y la lentitud del sistema sin aportar ningún beneficio clínico.
3. **NO eliminar `cantidadDisponible` de `MedicamentoInventario`:** Forzaría a calcular sumatorias en tiempo real sobre la tabla de movimientos en cada carga de página.
4. **NO cambiar las restricciones `onDelete: Restrict` a `Cascade` en documentos clínicos:** Podría causar pérdidas catastróficas de historiales médicos ante un borrado accidental.

---

## 13. Conclusión Final

La base de datos del **Sistema de Historial Clínico Ocupacional** presenta un diseño **altamente profesional, normalizado en 3FN en todo su núcleo transaccional, con desnormalizaciones históricas deliberadas y técnicamente justificadas**. Cumple a cabalidad con los estándares de integridad referencial, seguridad médica y rendimiento en PostgreSQL con Prisma.
