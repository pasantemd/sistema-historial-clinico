# Arquitectura del Sistema de Historial Clínico Ocupacional

Este documento explica de forma clara, didáctica y con ejemplos reales cómo está construido y organizado el sistema.

---

## 1. Estructura General del Proyecto

El repositorio está dividido en 4 directorios principales:

```text
sistema-historial-clinico/
├── src/        → Código fuente de la aplicación (Frontend, Backend, Dominio)
├── prisma/     → Modelado de Base de Datos PostgreSQL, migraciones y seeds
├── tests/      → Pruebas automatizadas (Unitarias con Vitest y E2E con Playwright)
└── docs/       → Documentación viva (Estado actual, arquitectura y mapas)
```

### ¿Para qué sirve cada carpeta?

| Carpeta | Tipo de Código | Responsabilidad | ¿Quién la llama? |
| :--- | :--- | :--- | :--- |
| **`src/app/`** | Next.js App Router (Server & Client Pages) | Rutas web, layouts visuales, protección de sesión por permisos y APIs mínimas. | El navegador del usuario cuando visita una URL. |
| **`src/modulos/`** | Módulos de Dominio (Vertical Slices) | La lógica médica, formularios, acciones de servidor, reglas de negocio y persistencia. | Las páginas de `src/app/` y componentes cliente. |
| **`src/componentes/`**| UI Compartida (Design System) | Botones, tablas, tarjetas, diálogos, barra lateral, formularios genéricos. | Los módulos y las páginas. |
| **`src/servicios/`**  | Servicios Técnicos Transversales | Autenticacion, Auditoría segura, cliente Prisma y generador de PDFs. | Los módulos y acciones del servidor. |
| **`src/utilidades/`** | Funciones Puras | Formateo de fechas, manipulación de cadenas, cálculo de clases Tailwind. | Cualquier parte del sistema. |
| **`prisma/`**         | ORM & Base de Datos | Archivo `schema.prisma`, migraciones SQL inmutables y semillas de datos (`seed.ts`). | El cliente de Prisma ejecutado en Node.js. |
| **`tests/`**          | Testing Automatizado | Pruebas de regresión, cálculos clínicos, validaciones y pruebas de navegación E2E. | Vitest (`npm run test`) y Playwright (`npm run test:e2e`). |
| **`docs/`**           | Documentación de Gobernanza | Mapas conceptuales (`cerebro/`), auditorías técnicas y estado del sistema. | Desarrolladores y agentes de IA. |

---

## 2. Clasificación de la Arquitectura

### **Tipo detectado:** **Arquitectura Modular Vertical (Vertical Slice) con CQRS Ligero y Capas Internas.**

```text
                 ┌────────────────────────────────────────────────────────┐
                 │                NAVEGADOR / USUARIO                     │
                 └───────────────────────────┬────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
             [Lectura de Página]                           [Envío de Formulario]
                       │                                           │
                       ▼                                           ▼
             Next.js Server Page                           Componente Cliente
             (src/app/.../page.tsx)                       (useActionState / RHF)
                       │                                           │
                       ▼                                           ▼
                CONSULTA (Query)                         SERVER ACTION (Command)
             (Lectura directa DTO)                     (Validación Zod + Permiso)
                       │                                           │
                       │                                           ▼
                       │                                    SERVICIO DOMINIO
                       │                              (Reglas clínicas + Auditoría)
                       │                                           │
                       │                                           ▼
                       │                                 REPOSITORIO (Persistencia)
                       │                                 (Transacciones ACID / Locks)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                    PRISMA CLIENT (ORM)
                                             │
                                             ▼
                                   POSTGRESQL (Base de Datos)
```

### ¿Por qué no es una Arquitectura por Capas tradicional ni Clean Architecture pura?

1. **No es por capas horizontal tradicional:** En lugar de tener una carpeta global `services/` con 200 archivos mezclados de todos los temas, el código está particionado por **módulos de negocio** (`recetas`, `inventario`, `evaluaciones-medicas`, `trabajadores`).
2. **Usa CQRS ligero (Command Query Responsibility Segregation):**
   - Para **LEER** datos en pantalla (Server Components), se llama directamente a `consultas/` que devuelven DTOs optimizados sin pasar por capas intermedias innecesarias.
   - Para **ESCRIBIR** datos (mutaciones), se exige el flujo estricto: `Action` → `Servicio` → `Repositorio` → `Prisma` → `Auditoría`.
3. **Mantiene bajo acoplamiento:** Si mañana se actualiza el módulo de `recetas`, los archivos de `evaluaciones-medicas` o `inventario` no se ven alterados.

---

## 3. Mapa de Flujo del Sistema con Archivos Reales

Tomemos como ejemplo el flujo de guardar una receta médica:

```text
1. NAVEGADOR (Usuario completa formulario y hace clic en "Guardar")
   ↓
2. COMPONENTE CLIENTE (React Hook Form + Zod)
   [src/modulos/recetas/componentes/formulario-receta.tsx]
   ↓
3. SERVER ACTION (use server, valida permiso "receta.crear" y esquema Zod)
   [src/modulos/recetas/acciones/recetas.acciones.ts -> crearRecetaAccion()]
   ↓
4. SERVICIO DE DOMINIO (Orquesta reglas, contexto y dispara auditoría)
   [src/modulos/recetas/servicios/recetas.servicio.ts -> crearRecetaServicio()]
   ↓
5. REPOSITORIO (Genera correlativo REC-001, resuelve snapshots históricos y persistencia)
   [src/modulos/recetas/repositorios/recetas.repositorio.ts -> crearRecetaRepositorio()]
   ↓
6. PRISMA CLIENT (ORM / Type-Safe SQL)
   [src/servicios/base-datos/prisma.ts -> prisma.recetaMedica.create()]
   ↓
7. POSTGRESQL (Persistencia física en la tabla "RecetaMedica")
```

---

## 4. Explicación Detallada de Cada Capa

### `app/` (Adaptador de Rutas y Páginas Web)
- **Qué hace:** Expone las URLs del sistema usando Next.js App Router. Cada `page.tsx` es un **Server Component** que comprueba autenticación/permisos, ejecuta una consulta de solo lectura (`consulta.ts`) y le entrega los datos ya listos al componente visual.
- **Ejemplo real:** [`src/app/(dashboard)/trabajadores/[id]/page.tsx`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/app/(dashboard)/trabajadores/[id]/page.tsx)
  - Verifica permiso: `await requerirPermiso("trabajador.ver")`.
  - Lee datos: `await consultarTrabajadorPorId(id, usuario.id)`.
  - Renderiza: `<PaginaPerfilTrabajador trabajador={trabajador} />`.

### `componentes/` (UI Compartida e Interfaz)
- **Qué hace:** Contiene elementos visuales reutilizables que no contienen lógica de base de datos.
- **Ejemplo real:** [`src/componentes/ui/button.tsx`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/componentes/ui/button.tsx), [`src/componentes/visualizacion-datos/tarjeta-metrica.tsx`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/componentes/visualizacion-datos/tarjeta-metrica.tsx).

### `acciones/` (Server Actions - Entrada de Escritura)
- **Qué hace:** Funciones con `"use server"` que reciben la petición desde el formulario del navegador.
- **Responsabilidades:**
  1. Revalidar el permiso en servidor (`requerirPermiso`).
  2. Validar tipos y campos con esquemas Zod (`schema.parse`).
  3. Llamar al servicio correspondiente.
  4. Devolver un objeto estandarizado `{ exito: true, datos }` o `{ exito: false, mensaje, erroresCampos }`.
- **Ejemplo real:** [`src/modulos/trabajadores/acciones/trabajadores.acciones.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/trabajadores/acciones/trabajadores.acciones.ts).

### `servicios/` (Lógica de Negocio y Reglas Clínicas)
- **Qué hace:** Define **QUÉ** se puede hacer y bajo qué condiciones. Aplica reglas de negocio independientes de la base de datos (por ejemplo: si una receta emitida no puede modificarse, o si debe registrarse un evento en la tabla de auditoría).
- **Ejemplo real:** [`src/modulos/recetas/servicios/recetas.servicio.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/recetas/servicios/recetas.servicio.ts) (Llama al repositorio y después ejecuta `registrarAuditoriaSegura(...)`).

### `consultas/` (Lecturas de Datos / Query CQRS)
- **Qué hace:** Consultas directas a Prisma optimizadas para lectura. No hacen validaciones de negocio complejas de escritura ni transacciones; simplemente obtienen los datos requeridos por las pantallas rápidamente.
- **Ejemplo real:** [`src/modulos/trabajadores/consultas/trabajadores.consulta.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/trabajadores/consultas/trabajadores.consulta.ts).

### `repositorios/` (Persistencia / Mutaciones / Command CQRS)
- **Qué hace:** Encapsula las operaciones de base de datos de escritura. Maneja transacciones ACID (`prisma.$transaction`), bloqueos, creación de registros hijos, secuencias correlativas y guardado de **snapshots históricos** (para que un documento médico emitido nunca cambie su empresa o cargo aunque el trabajador cambie de puesto en el futuro).
- **Ejemplo real:** [`src/modulos/registro-diario/repositorios/registro-diario.repositorio.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/registro-diario/repositorios/registro-diario.repositorio.ts).

### `utilidades/` (Funciones Auxiliares Puras)
- **Qué hace:** Funciones matemáticas, formateo de fechas civiles ecuatorianas, normalización de textos. No tocan base de datos ni React.
- **Ejemplo real:** [`src/utilidades/fechas/formatear-fecha.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/utilidades/fechas/formatear-fecha.ts).

### `prisma/` (Esquema de Base de Datos y Migraciones)
- **Qué hace:** Fuente única de verdad sobre las tablas, tipos enumerados y relaciones en PostgreSQL.
- **Ejemplo real:** [`prisma/schema.prisma`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/prisma/schema.prisma).

---

## 5. Cinco Flujos Reales Paso a Paso

### 1. Crear Trabajador
```text
src/modulos/trabajadores/componentes/formulario-trabajador.tsx
  ↓ (submit del formulario)
src/modulos/trabajadores/acciones/trabajadores.acciones.ts [crearTrabajadorAccion]
  ↓ (valida permiso "trabajador.crear" y schema trabajadorSchema)
src/modulos/trabajadores/servicios/crear-trabajador.servicio.ts [crearTrabajador]
  ↓ (valida unicidad de cédula y asignación de empresa)
src/modulos/trabajadores/repositorios/trabajadores.repositorio.ts [crearTrabajadorRepositorio]
  ↓ (prisma.trabajador.create y prisma.asignacionLaboral.create)
Prisma Client → PostgreSQL (Tablas "Trabajador", "AsignacionLaboral", "Auditoria")
```

### 2. Crear Registro Diario
```text
src/modulos/registro-diario/componentes/formulario-registro-diario.tsx
  ↓ (submit)
src/modulos/registro-diario/acciones/registro-diario.acciones.ts [crearRegistroDiarioAccion]
  ↓ (valida permiso "registro-diario.crear" y schema registroDiarioSchema)
src/modulos/registro-diario/servicios/crear-registro-diario.servicio.ts [crearRegistroDiario]
  ↓ (verifica estado laboral activo del trabajador)
src/modulos/registro-diario/repositorios/registro-diario.repositorio.ts [crearRegistroDiarioRepositorio]
  ↓ (prisma.$transaction: crea atención + descuenta stock en inventario)
Prisma Client → PostgreSQL (Tablas "RegistroDiarioAtencion", "MedicamentoInventario", "MovimientoInventario")
```

### 3. Crear Evaluación Médica
```text
src/modulos/evaluaciones-medicas/componentes/formulario-evaluacion.tsx
  ↓ (submit / autoguardado)
src/modulos/evaluaciones-medicas/acciones/evaluaciones.acciones.ts [guardarEvaluacionAccion]
  ↓ (valida permiso "evaluacion.crear" y schema evaluacionMedicaSchema)
src/modulos/evaluaciones-medicas/servicios/guardar-evaluacion.servicio.ts [guardarEvaluacion]
  ↓ (calcula IMC, clasifica diagnósticos CIE-10 y aptitud laboral)
src/modulos/evaluaciones-medicas/repositorios/evaluaciones.repositorio.ts [guardarEvaluacionRepositorio]
  ↓ (prisma.evaluacionMedica.upsert con diagnósticos y antecedentes)
Prisma Client → PostgreSQL (Tabla "EvaluacionMedica")
```

### 4. Crear Receta Médica
```text
src/modulos/recetas/componentes/formulario-receta.tsx
  ↓ (submit)
src/modulos/recetas/acciones/recetas.acciones.ts [crearRecetaAccion]
  ↓ (valida permiso "receta.crear" y schema recetaBorradorSchema)
src/modulos/recetas/servicios/recetas.servicio.ts [crearRecetaServicio]
  ↓ (verifica alergias conocidas a sustancias y llama auditoría)
src/modulos/recetas/repositorios/recetas.repositorio.ts [crearRecetaRepositorio]
  ↓ (obtiene secuencia correlativa REC-xxx y genera snapshot de datos de empresa y médico)
Prisma Client → PostgreSQL (Tabla "RecetaMedica")
```

### 5. Entregar Medicamento / Movimiento de Inventario
```text
src/modulos/inventario/componentes/dialogo-eliminar-cantidad.tsx
  ↓ (submit de egreso)
src/modulos/inventario/acciones/inventario.acciones.ts [registrarEgresoInventarioAccion]
  ↓ (valida permiso "inventario.ajustar" y cantidad numérica positiva)
src/modulos/inventario/servicios/inventario.servicio.ts [registrarEgresoInventario]
  ↓ (comprueba que cantidadDisponible >= cantidadSolicitada)
src/modulos/inventario/repositorios/inventario.repositorio.ts [registrarSalidaInventarioTx]
  ↓ (prisma.$transaction: decrementa stock y crea fila de auditoría de movimiento)
Prisma Client → PostgreSQL (Tablas "MedicamentoInventario", "MovimientoInventario")
```

---

## 6. Flujo Detallado: Crear Receta

1. **Usuario pulsa "Guardar Receta":**
   - El componente [`formulario-receta.tsx`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/recetas/componentes/formulario-receta.tsx) intercepta el evento `onSubmit` de React Hook Form.
2. **Ejecución de la Server Action:**
   - Se invoca `crearRecetaAccion(valores)` en [`recetas.acciones.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/recetas/acciones/recetas.acciones.ts).
   - Valida la sesión activa y el permiso `receta.crear`.
   - `recetaBorradorSchema.parse(entrada)` valida que los medicamentos y dosis sean válidos.
3. **Llamada al Servicio:**
   - `crearRecetaServicio(datos, usuario.id)` en [`recetas.servicio.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/recetas/servicios/recetas.servicio.ts).
4. **Persistencia en Repositorio:**
   - `crearRecetaRepositorio(datos, usuarioId)` en [`recetas.repositorio.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/modulos/recetas/repositorios/recetas.repositorio.ts).
   - Genera el correlativo con la secuencia de PostgreSQL: `REC-014`.
   - Congela los datos históricos: nombre del trabajador, RUC de empresa, nombre y código del médico responsable.
5. **Cambio en el Modelo Prisma:**
   - `tx.recetaMedica.create({...})` inserta la fila en la tabla `RecetaMedica` en estado `BORRADOR`.
6. **Registro de Auditoría:**
   - `registrarAuditoriaSegura(...)` inserta un evento inmutable con acción `RECETA_CREADA` en la tabla `Auditoria`.
7. **Respuesta y Redirección:**
   - La acción devuelve `{ exito: true, datos: { id: "...", numeroReceta: "REC-014" } }`.
   - El formulario muestra el Toast animado de confirmación y redirige a la ficha del trabajador o detalle de la receta.

---

## 7. Flujo Detallado: Registro Diario e Inventario

```text
Formulario Registro Diario
        │
        ▼
   crearRegistroDiarioRepositorio (Transacción ACID)
        │
        ├─► 1. Valida trabajador activo en la empresa
        ├─► 2. Inserta la atención clínica en `RegistroDiarioAtencion`
        ├─► 3. ¿Tiene medicamentos entregados en cabina?
        │        │
        │        ▼ (SI)
        │     Llama a `registrarSalidaInventarioTx`
        │        │
        │        ├─► Descuenta `cantidadDisponible` en `MedicamentoInventario`
        │        └─► Registra el movimiento tipo `SALIDA` en `MovimientoInventario`
        │            con `referenciaTipo = 'REGISTRO_DIARIO'`
        │
        └─► 4. Inserta auditoría general del sistema
```

> **Regla de Negocio Clave:**
> La **Receta Médica** es una prescripción libre (no descuenta inventario físico de bodega).
> El **Registro Diario**, al ser una entrega directa en tópico/enfermería, **sí** descuenta stock en tiempo real dentro de la misma transacción.

---

## 8. ¿Por qué existen `consultas/` y `repositorios/`? (CQRS)

| Capa | Propósito | Operaciones | ¿Quién la usa? |
| :--- | :--- | :--- | :--- |
| **`consultas/` (Query)** | **Solo lectura.** Recuperar datos de forma ultra-rápida con `findMany`, `select` de solo las columnas necesarias y mapeo a DTOs. | `SELECT` | **Server Components (`page.tsx`)** directamente para renderizar la pantalla inicial. |
| **`repositorios/` (Command)** | **Mutaciones y persistencia.** Asegurar integridad referencial, transacciones ACID, secuencias de correlativos y validaciones de unicidad. | `INSERT`, `UPDATE`, `DELETE`, `$transaction` | **Servicios de dominio (`servicios/`)** cuando se procesa un formulario. |

Esta separación evita sobrecargar las lecturas con lógica pesada de validación de escrituras y permite optimizar cada una de manera independiente.

---

## 9. Servicios de Dominio: Qué va y qué NO va

### ✅ Lo que SÍ debe ir en un Servicio:
- Validaciones de reglas de negocio complejas (ej: "un documento finalizado ya no puede editarse").
- Orquestación entre varios repositorios (ej: verificar alergias antes de emitir una receta).
- Disparo de eventos de auditoría y notificaciones.
- Cálculos clínicos puros (ej: cálculo de IMC, clasificación de aptitud médica laboral).

### ❌ Lo que NO debe ir en un Servicio:
- Código JSX o componentes de React.
- Acceso a `cookies()`, `headers()` o parámetros HTTP de Next.js.
- Consultas SQL crudas o directas a la base de datos (eso le corresponde al repositorio).

---

## 10. Server Actions: Anatomía Real

Ejemplo tomado directamente del código:

```typescript
"use server"; // Indica a Next.js que esta función se ejecuta exclusivamente en el servidor Node.js

export async function crearTrabajadorAccion(
  entrada: unknown // 1. Recibe los datos sin tipar del formulario
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    // 2. Comprueba autenticación y permiso en el servidor (nunca confía en el cliente)
    const usuario = await requerirPermiso("trabajador.crear");

    // 3. Valida estrictamente la estructura con Zod
    const datos = trabajadorSchema.parse(entrada);

    // 4. Delega la lógica de negocio al servicio
    const trabajador = await crearTrabajador(datos, usuario.id);

    // 5. Devuelve respuesta tipada
    return { exito: true, datos: { id: trabajador.id } };
  } catch (error) {
    if (error instanceof ZodError) {
      return { exito: false, mensaje: "Campos inválidos", erroresCampos: error.flatten().fieldErrors };
    }
    return { exito: false, mensaje: "Error al crear trabajador" };
  }
}
```

---

## 11. Conexión con Prisma

```text
Server Action  ──►  Servicio  ──►  Repositorio  ──►  Prisma Client  ──►  PostgreSQL
```

En [`src/servicios/base-datos/prisma.ts`](file:///c:/Users/pasantemd/Desktop/sistema-historial-clinico/src/servicios/base-datos/prisma.ts) se gestiona un **Singleton de `PrismaClient`** para evitar saturar las conexiones del pool de PostgreSQL en desarrollo y producción.

---

## 12. Dependencias entre Módulos

```text
                          ┌──────────────────────┐
                          │     TRABAJADORES     │ (Núcleo central del paciente)
                          └──────────┬───────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ REGISTRO DIARIO  │       │   EVALUACIONES   │       │      FICHAS      │
│  (Tópico Diario) │       │     MÉDICAS      │       │  OCUPACIONALES   │
└────────┬─────────┘       └─────────┬────────┘       └─────────┬────────┘
         │                           │                          │
         │ (descuenta stock)         └───────────┬──────────────┘
         ▼                                       │ (genera prescripción)
┌──────────────────┐                             ▼
│    INVENTARIO    │                   ┌──────────────────┐
│ (Medicamentos y  │                   │     RECETAS      │
│   Movimientos)   │                   │ (Prescripciones) │
└──────────────────┘                   └──────────────────┘
```

- **Trabajador:** Es el sujeto central referenciado por todos los actos médicos.
- **Registro Diario → Inventario:** El registro diario se conecta con inventario para descontar medicamentos entregados en cabina.
- **Evaluaciones / Fichas / Registro Diario → Recetas:** Cualquier atención médica puede originar una receta vinculada a ese acto clínico.

---

## 13. Qué NO Hacer (Antipatrones Prohibidos)

1. **Componente Cliente llamando a Prisma directamente ❌**
   - *Por qué:* Inseguro y técnicamente imposible en el navegador (Prisma requiere entorno Node.js y credenciales secretas de BD).
   - *Correcto:* El cliente llama a una Server Action con validación de permisos.

2. **Páginas `page.tsx` con lógica de negocio pesada ❌**
   - *Por qué:* La página debe ser un adaptador de ruta delgado que solo orquesta lectura y pasa props.
   - *Correcto:* La lógica va en `servicios/` o `consultas/`.

3. **Repositorios devolviendo JSX o manipulando el DOM ❌**
   - *Por qué:* Los repositorios solo manejan datos puros de base de datos.

4. **Documentos emitidos/finalizados editables ❌**
   - *Por qué:* En medicina ocupacional y legal, un documento clínico firmado/emitido debe ser **inmutable** y conservar sus datos históricos exactos.

---

## 14. Regla Mental Simple

```text
¿Dónde pongo mi código?

¿Es lo que ve el usuario?               ──► componentes/
¿Es la recepción del formulario?        ──► acciones/
¿Es una regla clínica o validación?     ──► servicios/
¿Es leer datos para mostrar en página?  ──► consultas/
¿Es guardar, actualizar o borrar en BD? ──► repositorios/
¿Es una función pura de fecha o texto?  ──► utilidades/
```

---

## 15. Comparación: Modular (Actual) vs Capas Horizontales

| Criterio | Arquitectura Modular Actual (`modulos/x/...`) | Arquitectura Horizontal (`components/`, `services/`, `repositories/`) |
| :--- | :--- | :--- |
| **Localización de código** | **Alta:** Abres la carpeta `recetas` y tienes todo lo relacionado a recetas en un solo lugar. | **Baja:** Para tocar recetas debes abrir 5 carpetas en extremos opuestos del proyecto. |
| **Escalabilidad** | **Excelente:** Se pueden agregar módulos enteros sin romper los existentes. | **Media:** Las carpetas terminan con cientos de archivos mezclados. |
| **Eliminación/Refactor** | **Seguro:** Borrar o mover un módulo es autocontenido. | **Riesgoso:** Requiere rastrear dependencias dispersas en todo el proyecto. |

---

## 16. Recomendación Arquitectónica

### **Recomendación:** **Opción A (Mantener la arquitectura actual).**

**Fundamentos:**
1. **Tamaño y madurez:** El proyecto cuenta con más de 20 módulos clínicos activos bien delimitados. Cambiar la estructura actual introduciría un **riesgo altísimo de regresión** en formularios médicos sensibles.
2. **Cohesión y claridad:** El esquema modular vertical permite a cualquier desarrollador comprender inmediatamente el alcance de una funcionalidad dentro de su propio módulo.
3. **Consistencia técnica:** La separación Server Actions → Servicios → Repositorios/Prisma + Consultas CQRS cumple con las mejores prácticas de Next.js App Router y seguridad médica en servidor.
