# Sistema Médico Ocupacional

<p align="center">
  <img src="public/img/logoAP.png" alt="Logo APRACOM" width="150" />
</p>

Sistema interno para administrar el historial clínico ocupacional de trabajadores, su contexto laboral, atenciones, documentos médicos, medicamentos e inventario con trazabilidad y aislamiento por empresa.

> Proyecto privado: contiene información clínica sensible y debe desplegarse únicamente en infraestructura autorizada.

## Contenido

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías y requisitos](#tecnologías-y-requisitos)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Preparación del repositorio](#preparación-del-repositorio)
- [Base de datos](#base-de-datos)
- [Roles y permisos](#roles-y-permisos)
- [Flujos clínicos](#flujos-clínicos)
- [Documentos e inventario](#documentos-e-inventario)
- [Estructura](#estructura)
- [Comandos](#comandos)
- [Pruebas](#pruebas)
- [Seguridad](#seguridad)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Documentación](#documentación)

## Características

### Organización y trabajadores

- Empresas, departamentos y centros organizacionales.
- Registro y edición de trabajadores.
- Vínculos laborales e historial de asignaciones.
- Aislamiento multiempresa según las empresas autorizadas para cada usuario.
- Perfil consolidado con antecedentes y documentos del trabajador.

### Operación clínica

- Agenda y gestión de citas.
- Registro diario de pacientes y morbilidad.
- Evaluaciones médicas ocupacionales.
- Fichas ocupacionales con borrador, finalización y anulación.
- Alergias activas y alertas al prescribir.
- Diagnósticos CIE-10 por código, descripción y sinónimos.
- Recetas independientes o derivadas del contexto clínico.
- Documentos clínicos adicionales.

### Documentos, inventario y reportes

- PDF de registros diarios, evaluaciones, fichas, certificados, recetas y movimientos.
- Excel de registros diarios y fichas ocupacionales.
- Reportes Word con gráficos seleccionables y rangos temporales.
- Inventario con entradas, salidas, devoluciones, ajustes y caducidad.
- Historial de entregas con trabajador, cantidad, concepto y responsable.
- Reportes por semana, mes o rango personalizado.

### Administración

- Alta, activación y desactivación de usuarios.
- Un rol por usuario y una o varias empresas autorizadas.
- Perfil médico editable con código profesional y especialidad.
- Matriz de permisos por módulo.
- Auditoría de operaciones relevantes.
- Protección persistente contra intentos repetidos de inicio de sesión.

## Arquitectura

La aplicación es un monolito modular basado en Next.js App Router.

```text
Navegador
  → Next.js App Router
  → autenticación y permisos en servidor
  → validación Zod / React Hook Form
  → Server Action o Route Handler
  → servicio de dominio
  → repositorio o consulta
  → Prisma ORM
  → PostgreSQL
```

Principios:

- `src/app` contiene adaptadores pequeños; el dominio vive en `src/modulos`.
- La interfaz no concede permisos: el servidor revalida usuario, empresa, ID y estado.
- Las escrituras importantes usan transacciones.
- Los documentos finalizados son de solo lectura y conservan snapshots históricos.
- Cada PDF clínico usa al médico persistido en el documento.
- No se usa Data Cache para CIE-10, morbilidades ni datos clínicos.
- La receta no mueve inventario; el registro diario sí puede descontarlo.

Consulta [docs/SISTEMA.md](docs/SISTEMA.md) para la arquitectura completa.

## Tecnologías y requisitos

| Capa | Tecnología |
|---|---|
| Aplicación | Next.js 16.3, React 19 y TypeScript |
| Interfaz | Tailwind CSS 4, shadcn/ui y Lucide React |
| Formularios | React Hook Form y Zod |
| Autenticación | Auth.js / NextAuth con credenciales y JWT |
| Persistencia | Prisma 7 y PostgreSQL |
| Documentos | PDFKit, PDF.js, ExcelJS, docx y html-to-image |
| Gráficos | Recharts |
| Calidad | Vitest, Playwright y ESLint |

Requisitos:

- Node.js `20.19+`, `22.12+` o `24+`.
- npm 10 o superior.
- PostgreSQL accesible mediante una URL de conexión.
- Git y un navegador moderno.

Versiones verificadas al redactar este README: Node.js 24.18, npm 11.16, Next.js 16.3.3 y Prisma 7.10.

## Instalación local

```bash
git clone <URL_DEL_REPOSITORIO>
cd sistema-historial-clinico
npm ci
```

Crea el archivo local de entorno desde la plantilla:

```bash
# Linux/macOS
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Reemplaza todos los marcadores de `.env`, aplica las migraciones y genera Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
```

Opcionalmente carga los catálogos y el administrador local:

```bash
npx prisma db seed
```

Inicia el sistema:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

La plantilla versionada está en [.env.example](.env.example).

| Variable | Necesaria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión PostgreSQL para Prisma y scripts |
| `NEXTAUTH_URL` | Sí | URL pública de la aplicación |
| `NEXTAUTH_SECRET` | Sí | Firma de sesiones; debe ser aleatoria y exclusiva del entorno |
| `SEED_ADMIN_EMAIL` | Solo seed | Correo del administrador inicial local |
| `SEED_ADMIN_PASSWORD` | Solo seed | Contraseña del administrador inicial local |
| `PLAYWRIGHT_BASE_URL` | Solo E2E | Servidor que utilizará Playwright |
| `PLAYWRIGHT_EMAIL` | E2E autenticado | Cuenta QA sin datos reales |
| `PLAYWRIGHT_PASSWORD` | E2E autenticado | Contraseña de la cuenta QA |
| `QA_E2E_PASSWORD` | Dataset QA | Clave asignada a los usuarios del dataset; debe coincidir con Playwright |
| `PLAYWRIGHT_PERMITIR_ESCRITURAS` | E2E mutante | Debe ser `SI` para crear documentos durante E2E |

No confirmes `.env` en Git. Genera `NEXTAUTH_SECRET` con una fuente criptográficamente segura y no reutilices secretos entre entornos.

El seed está bloqueado en producción, valida la base antes de escribir y exige el correo administrativo local previsto por el proyecto.

## Preparación del repositorio

El repositorio incluye:

- [.env.example](.env.example), sin credenciales reales;
- [.nvmrc](.nvmrc), con la versión principal de Node.js verificada;
- [.editorconfig](.editorconfig) y [.gitattributes](.gitattributes), para formato y finales de línea consistentes;
- [CONTRIBUTING.md](CONTRIBUTING.md), con el flujo de desarrollo y revisión;
- [SECURITY.md](SECURITY.md), con reglas de divulgación y manejo de secretos;
- [CI de GitHub](.github/workflows/ci.yml), con PostgreSQL aislado, Prisma, tipos, lint, Vitest, build y E2E seguras.
- [Plantilla de pull request](.github/pull_request_template.md), con controles clínicos y de datos.

Antes de publicar:

```bash
git status --short
git check-ignore .env
git ls-files .env
```

`.env` debe estar ignorado y el último comando no debe mostrarlo. Configura los secretos reales en el almacén del proveedor de despliegue, nunca en el repositorio.

No se incluye una licencia porque el proyecto continúa siendo privado. Tampoco se incluye configuración Docker: el despliegue actual no declara contenedores como requisito.

## Base de datos

El modelo se encuentra en [prisma/schema.prisma](prisma/schema.prisma) y el SQL versionado en `prisma/migrations/`.

Dominios principales:

- usuarios, roles, permisos y empresas autorizadas;
- empresas, departamentos, trabajadores y asignaciones laborales;
- citas, registros diarios y atenciones;
- evaluaciones, alergias, diagnósticos y medicamentos indicados;
- fichas ocupacionales, certificados y recetas;
- documentos clínicos;
- inventario, entregas y movimientos;
- CIE-10 y sinónimos;
- auditoría e intentos fallidos de autenticación.

Para cambiar el esquema:

```bash
npx prisma migrate dev --name nombre_descriptivo --create-only
npx prisma validate
```

Revisa el SQL antes de aplicarlo. No uses `prisma db push`, `prisma migrate reset` ni elimines migraciones ya aplicadas. Los datos clínicos históricos no deben reconstruirse ni perderse.

## Roles y permisos

| Rol | Alcance general |
|---|---|
| `ADMINISTRADOR` | Configuración, usuarios, permisos, auditoría y operación total |
| `MÉDICO` | Atención, evaluaciones, fichas, recetas y documentos autorizados |
| `RECURSOS_HUMANOS` | Operación administrativa y consultas permitidas por la matriz |

Cada usuario tiene un rol y empresas autorizadas. Un médico además registra código profesional y especialidad. La matriz visible está en `src/modulos/roles/constantes/matriz-config.ts`, pero el servidor es la fuente efectiva de autorización.

La autenticación utiliza scrypt con sal aleatoria, sesión JWT limitada y bloqueo temporal tras cinco fallos por correo e IP dentro de quince minutos.

## Flujos clínicos

### Trabajador y vínculo

```text
Crear trabajador → empresa/departamento → vínculo laboral
→ perfil → atenciones y documentos
```

Un cambio laboral crea contexto nuevo; no modifica documentos históricos.

### Registro diario

```text
Trabajador → fecha y morbilidad → entrega opcional
→ guardar → movimiento de inventario
```

La salida de inventario es atómica e impide stock negativo.

### Evaluación médica

```text
Registro diario o trabajador → borrador
→ signos, examen, diagnóstico y medicamentos indicados
→ finalizar → PDF
```

Los medicamentos indicados aquí no descuentan inventario. La finalización reclama el estado antes de modificar contenido para evitar carreras.

### Ficha y certificado

```text
Trabajador → ficha en borrador → secciones ocupacionales
→ aptitud y firma → finalizar → PDF / certificado / Excel
```

La ficha finalizada conserva el contexto histórico y queda de solo lectura.

### Receta

```text
Trabajador o evaluación → receta → medicamentos e indicaciones
→ emitir → PDF
```

La receta es una prescripción libre y no consume inventario. El médico responsable se determina y persiste en servidor.

## Documentos e inventario

Los PDF se abren como vista previa con `Content-Disposition: inline`. La respuesta central:

- verifica la firma `%PDF`;
- sanea el nombre del archivo;
- añade persona, tipo y fecha cuando corresponde;
- envía `private, no-store`, `no-cache` y `nosniff`;
- revalida permiso y empresa antes de consultar el ID.

El inventario registra medicamento, unidad, stock, fecha de caducidad y estado. Cada movimiento conserva cantidad anterior/posterior, motivo, referencia y usuario. Anular un registro diario puede generar una devolución trazable.

## Estructura

```text
src/
├── app/                    # Rutas, layouts y APIs
├── componentes/            # Componentes compartidos
├── configuracion/          # Navegación y configuración
├── modulos/                # Dominios funcionales
├── servicios/              # Base de datos, auth, auditoría y documentos
└── utilidades/             # Funciones compartidas
prisma/
├── schema.prisma           # Modelo de datos
├── migrations/             # Historial SQL
└── seed.ts                 # Catálogos y administrador local
scripts/                    # Importaciones y datasets controlados
tests/
├── unitarias/              # Vitest
└── e2e/                    # Playwright
docs/                       # Arquitectura, estado, auditoría y mapas
```

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Ejecutar la compilación |
| `npm run typecheck` | Validar TypeScript |
| `npm run lint` | Ejecutar ESLint |
| `npm test` | Ejecutar Vitest |
| `npm run test:e2e` | Ejecutar Playwright |
| `npm run importar:cie10` | Importar CIE-10 |
| `npm run importar:sinonimos-cie10` | Importar sinónimos CIE-10 |
| `npm run datos:reportes -- --dry-run` | Simular datos de reportes |
| `npm run datos:reportes -- --apply` | Cargar dataset local |
| `npm run datos:reportes -- --cleanup` | Retirar dataset local |
| `npm run datos:qa:cargar` | Cargar usuarios, empresas y recursos QA locales |
| `npm run datos:qa:limpiar` | Retirar únicamente el dataset QA controlado |

Los scripts que escriben o eliminan datos verifican el entorno. Revisa el modo y la URL antes de ejecutarlos.

## Pruebas

Compuerta mínima:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx prisma validate
npx prisma migrate status
```

Variables para Playwright autenticado:

```dotenv
PLAYWRIGHT_BASE_URL="http://127.0.0.1:3100"
PLAYWRIGHT_EMAIL="cuenta.qa@ejemplo.local"
PLAYWRIGHT_PASSWORD="CLAVE_QA"
PLAYWRIGHT_PERMITIR_ESCRITURAS="NO"
```

La suite levanta el servidor E2E en el puerto 3100 por defecto. Cambia la autorización a `SI` exclusivamente contra una base QA controlada, nunca producción.

Última evidencia local, 2026-09-01:

- Vitest: 95/95 pruebas aprobadas en 25 archivos.
- Playwright seguro: 5 aprobadas y 2 omitidas por requerir escritura clínica explícita.
- TypeScript y ESLint: aprobados.

El estado canónico y los pendientes se mantienen en [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md).

## Seguridad

- Los datos clínicos no deben aparecer en logs, commits o capturas públicas.
- Empresa, permiso, ID y estado se validan en servidor.
- Las respuestas privadas y documentos no se almacenan en caché.
- El seed y los datasets están bloqueados en producción.
- Secretos y credenciales viven exclusivamente en variables de entorno.
- No se agregan usuarios ficticios ni resultados simulados a producción.
- La auditoría registra operaciones relevantes; las decisiones legales pendientes están en [docs/AUDITORIA.md](docs/AUDITORIA.md).
- `npm audit fix` sin `--force` corrigió la alerta compatible de Browserslist; permanecen seis avisos transitivos cuya corrección automática propone regresiones mayores de Prisma o ExcelJS.

## Despliegue

1. Configura secretos mediante la plataforma de despliegue.
2. Verifica una copia de seguridad de PostgreSQL.
3. Ejecuta `npm ci`.
4. Ejecuta `npx prisma migrate deploy` una vez por versión.
5. Ejecuta `npm run build`.
6. Inicia con `npm start` detrás de HTTPS y un proxy confiable.
7. Verifica login, empresas autorizadas, flujos clínicos y documentos.
8. Ejecuta las reconciliaciones descritas en la auditoría.

No ejecutes el seed en producción.

## Solución de problemas

### `DATABASE_URL no está definida`

Comprueba `.env` y el formato de PostgreSQL. No publiques la URL completa.

### Prisma no encuentra el cliente

```bash
npx prisma generate
```

### Hay migraciones pendientes

```bash
npx prisma migrate status
npx prisma migrate deploy
```

No uses `migrate reset` para resolverlo.

### El build coincide con `next dev`

Detén de forma controlada el servidor del mismo checkout o compila en otro checkout. No cierres procesos Node desconocidos a la fuerza.

### Playwright omite pruebas autenticadas

Define las credenciales QA. Para pruebas mutantes añade la autorización explícita únicamente en QA.

### Un PDF responde 500

Revisa el generador, el permiso, la empresa autorizada y los snapshots históricos. La respuesta nunca debe devolver HTML como si fuera PDF.

## Documentación

| Documento | Propósito |
|---|---|
| [docs/00-INICIO.md](docs/00-INICIO.md) | Índice documental |
| [docs/SISTEMA.md](docs/SISTEMA.md) | Arquitectura y mapa funcional |
| [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) | Estado y validaciones recientes |
| [docs/AUDITORIA.md](docs/AUDITORIA.md) | Seguridad, integridad y deuda técnica |
| [docs/cerebro/](docs/cerebro/) | Mapas conceptuales por dominio |
| [AGENTS.md](AGENTS.md) | Reglas de trabajo del repositorio |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Flujo de contribución y compuertas |
| [SECURITY.md](SECURITY.md) | Divulgación responsable y secretos |

`AGENTS.md` es la constitución, `docs/SISTEMA.md` el mapa, `docs/ESTADO_ACTUAL.md` el estado y `docs/AUDITORIA.md` el registro de riesgos y decisiones.

## Licencia

No existe una licencia pública declarada. El código y la documentación son privados salvo autorización expresa del propietario.
