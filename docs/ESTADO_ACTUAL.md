# Estado actual

Actualizado: 2026-09-01.

## Estado general

El sistema usa Next.js App Router, Prisma y PostgreSQL como monolito modular. Los flujos principales de trabajadores, citas, registro diario, evaluaciones, fichas, recetas, inventario y documentos clínicos están implementados.

Las correcciones de auditoría de agosto consolidaron permisos, aislamiento por empresa, guards de concurrencia, exportaciones documentales y validaciones. Este documento no sustituye las pruebas: antes de un cambio, reproduce el flujo y revisa `AUDITORIA.md`.

Para arquitectura, datos y flujos, consulta [[SISTEMA]]. Para riesgos o deuda técnica vigente, consulta [[AUDITORIA]].

## Módulos activos

- Inicio y autenticación.
- Empresas, departamentos, trabajadores y vínculos laborales.
- Citas y registro diario.
- Evaluaciones médicas, alergias, morbilidades y CIE-10.
- Fichas ocupacionales, certificados, recetas y documentos clínicos.
- Inventario, reportes, usuarios, roles, configuración profesional y auditoría.

## Cambios recientes

- Aislamiento multiempresa reforzado en citas, vínculos laborales, dashboard, atención, configuración y usuarios; los filtros visuales ya no pueden reemplazar el alcance autorizado.
- Alta administrativa de usuarios con React Hook Form/Zod, contraseña scrypt, rol único, empresas autorizadas y datos profesionales obligatorios para médicos.
- Autenticación protegida con un límite persistente de cinco intentos fallidos por correo/IP durante quince minutos.
- Finalización concurrente de evaluaciones y fichas protegida mediante reclamo atómico del estado antes de modificar el contenido clínico.
- Permiso general de auditoría separado como `auditoria.ver` e índices PostgreSQL agregados para fecha, módulo y usuario.
- Seeds y scripts integrales bloqueados en producción; los scripts de datos integrales también rechazan bases remotas.
- Unificación de Morbilidad: catálogo único en PostgreSQL (`Morbilidad`) compartido entre Registro diario y Evaluaciones médicas con normalización (case-insensitive, accent-insensitive, búsqueda parcial por tokens y ordenamiento por relevancia), inserción segura anti-duplicados y componente compartido `<CampoMorbilidad />`.
- Restricción de cantidades solo enteras (`int`) en Registro diario, Inventario y Evaluaciones médicas.
- Auditoría técnica FASES 1–12: permisos dedicados, filtros por empresa, operaciones atómicas y transacciones clínicas reforzadas.
- Solape de citas cubierto con constraint de PostgreSQL y traducción de conflictos.
- Matriz de permisos sincronizada con los códigos usados por el servidor; `usuario.administrar` queda reservado para `ADMINISTRADOR`.
- Certificado ocupacional y PDF de ficha usan nombres y metadatos coherentes; se retiró un DTO de impresión sin consumidores.
- Receta: medicamentos organizados en tabla de Nombre, Dosis y Vía, con un único recuadro opcional de Indicaciones en la vista y el PDF.
- Trabajadores: un formulario para crear/editar; empresa y departamento son obligatorios; no se muestran ni inventan fechas laborales, centro, cargo, área, tipo de contrato o jornada. Véase [[cerebro/TRABAJADORES_Y_VINCULOS]].
- Inventario simplificado a añadir, eliminar y editar; registra fecha de caducidad y muestra alertas por rango de meses. Las recetas no afectan stock y el registro diario sí puede hacerlo al registrarse. Véase [[cerebro/INVENTARIO]].
- Reportes permite consultar datos reales por semana, por mes o mediante un rango personalizado inclusivo de fechas Desde/Hasta.
- La exportación de Reportes se consolidó en un documento Word (`.docx`): el usuario elige qué gráficos incluir, el navegador captura su apariencia visible y el servidor revalida autorización y filtros antes de generar y auditar la descarga. Se retiraron la vista previa PDF y la exportación XLSX exclusivas de este módulo.
- Reportes incluye medicamentos entregados físicamente desde Registro diario: agrega en PostgreSQL por medicamento y unidad, excluye atenciones anuladas y reutiliza el mismo DTO autorizado en pantalla y en la exportación gráfica Word.
- Mejoras de presentación visual en Reportes: gráfico horizontal para *Tipos de morbilidades* con nombres completamente legibles sin rotación y altura dinámica; eliminación del subtítulo redundante *Top 10* y de la leyenda de serie única en *Medicamentos entregados*, con tooltips enriquecidos con unidades reales y valores visibles al extremo de cada barra.
- Dataset de prueba para el módulo de Reportes (`scripts/cargar-datos-reportes.ts` y comando `npm run datos:reportes -- --dry-run | --apply | --cleanup`) con prefijo seguro `TEST-REPORTES-`, multiempresa (Tradetek y Apracom), multimédico (Dra. Ana López y Dr. Juan Pérez), historial laboral de cambio de departamento y suite de validación automatizada (`tests/unitarias/reportes-dataset-validacion.test.ts`).
- Traspaso clínico Registro diario → Evaluación médica: el campo `procedimiento` del Registro diario se precarga automáticamente como `dosis` en los medicamentos preexistentes de la Evaluación médica generada desde dicho registro, manteniendo intactos los campos `vía` e `indicaciones` (vacíos), respetando las ediciones posteriores del médico y conservando las evaluaciones independientes.
- Traspaso clínico Registro diario/Evaluación → Receta: precarga estructurada de medicamentos con nombres limpios, cantidad, unidad/presentación y dosis, pero mantiene vacías las indicaciones; la vista y el PDF muestran exclusivamente las indicaciones escritas expresamente por el médico en cada medicamento, sin copiar morbilidad, diagnóstico, recomendaciones u observaciones del documento de origen.
- Matriz de roles y permisos sincronizada con el servidor. Véase [[cerebro/USUARIOS_ROLES_PERMISOS]].

## Pendientes importantes

- Comparar manualmente PDF/Excel de ficha ocupacional contra la plantilla oficial antes de un cambio de formato. Véase [[cerebro/DOCUMENTOS_PDF]].
- Mantener y ampliar pruebas de concurrencia, permisos por empresa, inventario y documentos clínicos.
- Ejecutar Playwright con credenciales y datos de prueba configurados antes de declarar una entrega e2e validada.
- Definir qué eventos de auditoría con valor legal deben escribirse dentro de la misma transacción y abortar la operación si el log falla.
- Resolver los seis avisos transitivos de `npm audit` mediante una actualización mayor planificada, sin usar `--force` ni regresar versiones a ciegas.
- Resolver las decisiones de privacidad y anulación listadas en `AUDITORIA.md` antes de ampliar accesos clínicos.

## Decisiones pendientes

- Alcance del aislamiento por empresa y acceso clínico transversal.
- Acceso de Recursos Humanos a información clínica y exportaciones.
- Política de anulación cuando hay documentos clínicos dependientes.

## Validaciones con última evidencia registrada

| Validación | Estado |
|---|---|
| TypeScript (`npx tsc --noEmit`) | ✅ sin errores, 2026-09-01 |
| Tests (`npm test`) | ✅ 95/95 pruebas en 25 archivos, 2026-09-01 |
| Lint (`npm run lint`) | ✅ sin errores ni warnings, 2026-09-01 |
| Build (`npm run build`) | ✅ Next.js 16.3.3 compiló correctamente, 2026-09-01 |
| Playwright | ✅ 5 pruebas seguras aprobadas; 2 mutantes omitidas sin autorización de escritura, 2026-09-01 |
| Prisma (`validate`, `generate`, `migrate status`) | ✅ esquema válido y 32 migraciones aplicadas, 2026-09-01 |
| Carga de datos de reporte (`npm run datos:reportes -- --apply`) | ✅ 100% idempotente y seguro en desarrollo/test, 2026-08-25 |
| Limpieza de datos de reporte (`npm run datos:reportes -- --cleanup`) | ✅ eliminación limpia con integridad referencial, 2026-08-25 |
