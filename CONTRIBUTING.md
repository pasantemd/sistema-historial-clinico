# Contribuir al Sistema Médico Ocupacional

Este repositorio contiene un sistema clínico privado. Toda contribución debe preservar la confidencialidad, la trazabilidad y el contexto histórico de los documentos.

## Antes de comenzar

1. Lee [AGENTS.md](AGENTS.md), [docs/ESTADO_ACTUAL.md](docs/ESTADO_ACTUAL.md) y el mapa aplicable de [docs/cerebro/](docs/cerebro/).
2. Crea tu entorno desde [.env.example](.env.example); nunca publiques `.env`, credenciales ni datos clínicos.
3. Instala las dependencias con `npm ci`.
4. Aplica únicamente migraciones versionadas con `npx prisma migrate deploy`.

## Desarrollo

- Usa español para dominio, interfaz, rutas de negocio, pruebas y documentación.
- Mantén `src/app` como adaptador y la lógica dentro del módulo funcional correspondiente.
- Formularios: React Hook Form y Zod.
- Escrituras: Server Action → servicio → repositorio o transacción.
- Permisos, empresa, recurso y estado se revalidan en servidor.
- No modifiques documentos finalizados ni reconstruyas snapshots históricos.
- La receta no descuenta inventario; Registro diario sí puede hacerlo.

Para cambios de base de datos:

```bash
npx prisma migrate dev --name descripcion_del_cambio --create-only
npx prisma validate
```

Revisa el SQL antes de aplicarlo. No uses `prisma db push` ni `prisma migrate reset`.

## Validación

Antes de solicitar revisión:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx prisma validate
npx prisma migrate status
```

Ejecuta `npm run test:e2e` con una cuenta QA. Habilita `PLAYWRIGHT_PERMITIR_ESCRITURAS=SI` solamente sobre una base aislada y descartable.

## Pull requests

- Explica el problema y el comportamiento esperado.
- Enumera los archivos y módulos afectados.
- Incluye evidencia de las validaciones ejecutadas.
- Señala migraciones, cambios de permisos o efectos sobre documentos clínicos.
- No incluyas capturas con información personal, tokens, URLs privadas ni cadenas de conexión.

Los riesgos vigentes y criterios de liberación están en [docs/AUDITORIA.md](docs/AUDITORIA.md).
