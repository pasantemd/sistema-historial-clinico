# Proyecto

Sistema de Historial Clínico Ocupacional: aplicación interna para administrar trabajadores, contexto laboral, atenciones y documentos clínicos con trazabilidad.

## Stack

- Next.js 16 (App Router), React y TypeScript.
- Prisma ORM y PostgreSQL.
- Auth.js, Tailwind CSS y shadcn/ui.
- React Hook Form, Zod, Vitest y Playwright.

## Cómo trabajar

Antes de modificar código:

1. Lee [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md).
2. Identifica el módulo y la ruta afectados.
3. Consulta [docs/SISTEMA.md](docs/SISTEMA.md) solo si necesitas arquitectura, datos, permisos o flujos.
4. Lee el mapa aplicable de `docs/cerebro/` antes de cambiar un dominio, flujo, permiso, documento o integración.
5. Consulta `graphify-out/graph.json` para imports, consumidores, impacto o ciclos cuando el cambio sea estructural.
6. Abre solo archivos relacionados; amplía la búsqueda únicamente si existe evidencia de otra dependencia.
7. No recorras todo `src/` por defecto.
8. Actualiza la documentación central únicamente cuando el cambio lo amerite.

## Reglas críticas

- Dominio, UI, rutas de negocio, pruebas y documentación en español.
- Arquitectura: monolito modular por funcionalidad; rutas `src/app` como adaptadores mínimos.
- No usar RTK ni crear módulos, permisos, rutas, modelos o datos ficticios.
- No hacer `git push`.
- No usar `prisma db push` ni `prisma migrate reset`.
- Crear migraciones con `--create-only`, revisar el SQL y no borrar datos históricos.
- Permisos y estado sensible se validan y reconsultan en servidor; el frontend no es una frontera de seguridad.
- Formularios: React Hook Form + Zod; escrituras: Server Actions → servicio → repositorio/Prisma.
- Consultas y escrituras no mezclan lógica de negocio con componentes UI.
- Documentos finalizados o emitidos son de solo lectura y conservan su contexto laboral histórico.
- Cada PDF clínico usa el médico responsable persistido en ese documento, nunca un médico global ni el usuario actual por defecto.
- La receta es una prescripción libre y no consume inventario; el Registro diario sí puede descontar inventario al registrarse.
- Reportes y auditoría muestran datos reales autorizados; nunca mocks como resultado de producción.
- No tocar `src/generated`, PDFs oficiales ni plantillas documentales sin autorización expresa.

## Documentación

- Estado reciente, validaciones y pendientes: [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md).
- Arquitectura, módulos, datos, rutas y flujos: [docs/SISTEMA.md](docs/SISTEMA.md).
- Bugs, riesgos y deuda técnica: [docs/AUDITORIA.md](docs/AUDITORIA.md).
- Mapa conceptual visual por dominios: `docs/cerebro/`; no sustituye código, Prisma ni Graphify.

Graphify sirve para dependencias, consumidores, impacto, ciclos y código huérfano. No regenerarlo por cambios Markdown o CSS locales; regenerarlo después de cambios estructurales relevantes de imports, exports, módulos o rutas internas.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
