# Auditoría técnica integral del sistema

Fecha de corte: 2026-08-31  
Alcance: PostgreSQL real local, Prisma, autenticación, permisos, aislamiento multiempresa, flujos clínicos, inventario, reportes, documentos, UI, HTTP, dependencias, pruebas y código muerto. Esta revisión incluyó correcciones autorizadas.

## 1. Resultado ejecutivo

Se cerraron los riesgos confirmados de mayor impacto: accesos cruzados entre empresas en citas, trabajadores, dashboard, configuración y atención; suplantación del médico en recetas; ausencia de creación administrativa de usuarios; múltiples roles por usuario; permiso ambiguo de auditoría; carrera al finalizar evaluaciones y fichas; falta de límite de intentos de login; scripts de datos inseguros; acciones visibles sin permiso; recargas completas e índices faltantes.

La base real no presentó registros huérfanos, cruces de empresa, stock negativo ni snapshots clínicos incompletos en las reconciliaciones. Las 32 migraciones están aplicadas y el esquema coincide con PostgreSQL.

No se declara una certificación absoluta de producción. Permanecen decisiones explícitas en la sección 8: auditoría legal atómica, dependencias transitivas y E2E autenticado con una cuenta QA dedicada.

## 2. Hallazgos corregidos

| ID | Riesgo | Hallazgo y corrección | Evidencia |
|---|---|---|---|
| C-01 | Crítico | Citas globales: todas las lecturas, selectores y mutaciones ahora combinan usuario autorizado y filtros visuales. | `citas.repositorio.ts`; `citas-aislamiento-empresa.test.ts` |
| C-02 | Crítico | Vínculos cruzados: origen y empresa destino se validan dentro de la transacción contra `UsuarioEmpresa`. | `trabajadores.repositorio.ts`; `trabajadores-aislamiento-empresa.test.ts` |
| C-03 | Alto | Dashboard, atención y Configuración globales: consultas y tarjetas quedaron limitadas por empresa y permiso. | `inicio.consulta.ts`; `atenciones.consulta.ts`; `lecturas-aislamiento-empresa.test.ts` |
| C-04 | Alto | Suplantación en recetas: el servidor decide el responsable; las enlazadas y editadas conservan al médico persistido. | `recetas.repositorio.ts`; `receta-responsable-seguro.test.ts` |
| C-05 | Alto | Carrera de finalización: se reclama atómicamente `BORRADOR → FINALIZADA` antes de modificar contenido. Un error revierte toda la transacción. | repositorios de evaluaciones y fichas |
| C-06 | Alto | Login sin límite: ventana PostgreSQL de 5 fallos por correo+IP en 15 minutos; clave SHA-256 y limpieza tras éxito. | modelo `IntentoInicioSesion`; `limite-intentos-login.test.ts` |
| C-07 | Alto | Sin alta de usuarios: flujo RHF/Zod → Action → servicio → repositorio, scrypt, un rol, empresas autorizadas y campos médicos. | módulo `usuarios`; `crear-usuario.test.ts` |
| C-08 | Alto | Más de un rol por usuario: restricción única sobre `UsuarioRol(usuarioId)`, comprobada antes de migrar. | migración `20260831101000_usuario_un_rol` |
| C-09 | Medio | `historial.ver` autorizaba auditoría: se separó como `auditoria.ver` en UI, seed y base. | migración `20260831103000_permiso_auditoria_explicito` |
| C-10 | Alto | Seeds/scripts peligrosos: bloqueo en producción y bloqueo de base remota para datos integrales. | `validar-entorno-datos.ts`; `scripts-datos-seguros.test.ts` |
| C-11 | Medio | Concurrencia de inventario: decremento condicionado por stock; la segunda salida falla sin movimiento. | `inventario-concurrencia.test.ts` |
| C-12 | Medio | Auditoría sin índices: se agregaron fecha, módulo+fecha y usuario+fecha. | migración `20260831110000_indices_auditoria` |
| C-13 | Medio | Acciones sin permiso y recargas: botones condicionados y navegación con App Router/`router.refresh`. | páginas y formularios afectados |
| C-14 | Medio | Contraste oscuro insuficiente: foregrounds accesibles para primario, error, éxito, advertencia, información y sidebar. | `src/app/globals.css` |
| C-15 | Bajo | Auditoría truncaba el último día y aceptaba paginación extrema: fin de día inclusivo y tamaño 1–100. | `obtener-registros.ts` |
| C-16 | Alto | Dependencias directas vulnerables: Next.js, Auth.js y Prisma actualizados sin forzar regresiones mayores. | `package.json`, `package-lock.json` |

## 3. Matriz de aislamiento y permisos

| Área | Lectura/escritura autorizada | Estado |
|---|---|---|
| Trabajadores y vínculos | Empresa autorizada; origen y destino revalidados en transacción | Corregido |
| Citas | Crear, editar, confirmar, atender, cancelar y consultar dentro del alcance | Corregido |
| Dashboard y atención | Conteos, listas y detalle por ID limitados por empresa | Corregido |
| Configuración | Permiso administrativo más empresas autorizadas | Corregido |
| Usuarios | Empresas compartidas; `usuario.administrar`; rol/empresas revalidados | Corregido |
| Recetas | Responsable decidido por servidor, nunca por el cliente | Corregido |
| Auditoría | Permiso explícito `auditoria.ver` | Corregido |

Ocultar botones es solo UX: las decisiones sensibles se vuelven a validar en servidor.

## 4. Reconciliación de PostgreSQL

Se ejecutaron 19 comprobaciones. Todas devolvieron cero inconsistencias:

| Invariante | Resultado |
|---|---:|
| Usuarios con múltiples roles; relaciones usuario–rol/empresa huérfanas | 0 |
| Trabajadores o vínculos huérfanos, duplicados o con empresa/departamento cruzado | 0 |
| Más de una asignación laboral actual por trabajador | 0 |
| Citas, evaluaciones, fichas, recetas o registros cruzados entre empresas | 0 |
| Documentos finalizados sin snapshots históricos requeridos | 0 |
| Stock negativo o movimientos con saldo posterior inconsistente | 0 |
| Entregas clínicas sin movimiento y referencias clínicas huérfanas | 0 |

No se borró ni reconstruyó historia. Se aplicó SQL revisable con `prisma migrate deploy`; nunca `db push` ni `migrate reset`.

## 5. Documentos y rutas

| Documento | Permiso/aislamiento | Caché | Entrega |
|---|---|---|---|
| Ficha y certificado ocupacional PDF | Sí | `private, no-store` | Vista previa `inline` |
| Evaluación, receta y documento clínico PDF | Sí | `private, no-store` | Vista previa `inline` |
| Registro diario individual/día PDF | Sí | `private, no-store` | Vista previa `inline` |
| Movimientos de inventario PDF | Sí | `private, no-store` | Vista previa `inline` |
| Ficha/registro Excel | Sí | `private, no-store` | Descarga |
| Reporte Word selectivo | Empresa y rango revalidados | `private, no-store` | Descarga |

Los PDF pasan por `respuesta-pdf.ts`: valida `%PDF`, sanea el nombre y agrega `Pragma: no-cache`, expiración y `nosniff`. Cada PDF clínico toma al médico persistido en el documento.

No se usa `unstable_cache` ni una capa de Data Cache para CIE-10, morbilidades o datos clínicos; las consultas leen PostgreSQL directamente conforme al requisito de no caché.

## 6. Compuertas ejecutadas

| Compuerta | Resultado |
|---|---|
| Prisma validate/generate | Aprobado |
| Prisma migrate status | 32 migraciones; base actualizada |
| TypeScript | Aprobado |
| ESLint | Aprobado |
| Vitest | 24 archivos, 91 pruebas aprobadas |
| Playwright anónimo/autorización | 2 aprobadas, 0 fallidas |
| Playwright autenticado/mutaciones | 5 omitidas explícitamente: faltan credenciales QA y `PLAYWRIGHT_PERMITIR_ESCRITURAS=SI` |
| Build Next.js 16.3.3 | Aprobado en un directorio temporal aislado para no interrumpir el servidor dev activo |

El navegador integrado no pudo escribir sus recursos locales (`failed to write kernel assets: path not found`). La validación disponible se hizo con Playwright contra `127.0.0.1:3000`; no se presenta esa limitación como una aprobación.

## 7. Código muerto y dependencias

Knip completó. Dos scripts reportados son entradas CLI legítimas; seis `index.ts` son barriles públicos que requieren confirmar consumidores externos; `@prisma/client` y `pg` son runtime/generación. No se eliminó automáticamente nada dudoso.

Limpieza histórica conservada: encabezado/logout legacy, búsqueda de encabezado, filtro duplicado, `scroll-area` sin uso, formulario antiguo de movimientos, gráfico retirado, plantilla experimental y validador de cédula huérfano. Las pruebas dejaron de estar excluidas por `.gitignore`.

`npm audit` bajó de 19 a 5 avisos:

- 3 altos en `deepmerge-ts`, transitivo de la CLI/configuración de Prisma; npm solo propone regresar forzosamente a Prisma 6.
- 2 moderados en `uuid`, transitivo de ExcelJS; npm solo propone bajar a ExcelJS 3.4.

No se ejecutó `npm audit fix --force` porque propone cambios mayores/regresiones.

Actualización 2026-09-01: `npm audit fix` sin `--force` corrigió la alerta compatible de Browserslist. Permanecen seis avisos transitivos (cuatro altos y dos moderados) en `deepmerge-ts`, `mysql2` y `uuid`; las soluciones automáticas restantes proponen retroceder versiones mayores de Prisma o ExcelJS.

## 8. Pendientes explícitos

| Prioridad | Pendiente | Decisión requerida |
|---|---|---|
| Alta | `registrarAuditoriaSegura` es best-effort en 49 consumidores. | Definir qué eventos legales deben abortar la operación si falla el log y migrarlos a la misma transacción. |
| Media | E2E autenticado completo. | Proveer una cuenta QA aislada y autorizar escrituras de Playwright. |
| Media | Seis avisos npm transitivos. | Actualización mayor planificada cuando exista una ruta compatible. |
| Baja | Barriles sin consumidores visibles. | Confirmar que no hay integraciones externas antes de eliminarlos. |
| Baja | Algunas páginas de configuración consultan Prisma directamente. | Refactor estructural separado a servicio/repositorio. |

## 9. Criterio de liberación

En un checkout limpio y sin servidor dev concurrente:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npx prisma migrate status`
6. Playwright autenticado con cuenta QA
7. Reconciliación sobre copia protegida de producción

La liberación final debe esperar la evidencia E2E autenticada y la decisión sobre auditoría transaccional para eventos con valor legal.
