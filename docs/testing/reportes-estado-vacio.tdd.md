# Evidencia TDD: estado vacío de medicamentos en Reportes

Fecha: 2026-09-01.

## Alcance

La prueba E2E de Reportes debe aceptar los dos resultados válidos del período seleccionado:

- una tabla con medicamentos cuando existen entregas;
- el estado vacío informativo cuando no existen entregas.

No se utilizó un plan externo. La garantía se derivó del fallo reproducido y del comportamiento visible de `PaginaReportes`.

## Evidencia RED/GREEN

| Etapa | Comando | Resultado |
|---|---|---|
| RED | `npx playwright test tests/e2e/reportes-filtros.spec.ts` | Falló al exigir el encabezado `Medicamento` en un período sin entregas. |
| GREEN | `npx playwright test tests/e2e/reportes-filtros.spec.ts --workers=1` | 1/1 prueba aprobada. |
| Regresión E2E | `npx playwright test --workers=1` | 5 aprobadas y 2 omitidas por requerir autorización explícita de escrituras clínicas. |
| Regresión unitaria | `npm test` | 91/91 pruebas aprobadas. |
| Tipos | `npm run typecheck` | Aprobado. |
| Lint | `npm run lint` | Aprobado. |

## Garantías

| # | Garantía | Prueba | Tipo |
|---|---|---|---|
| 1 | Reportes muestra el título de medicamentos entregados. | `tests/e2e/reportes-filtros.spec.ts` | E2E |
| 2 | Si existen entregas, se muestran los cuatro encabezados de la tabla. | `tests/e2e/reportes-filtros.spec.ts` | E2E |
| 3 | Si no existen entregas, se muestran el título y la explicación del estado vacío. | `tests/e2e/reportes-filtros.spec.ts` | E2E |
| 4 | La página conserva sus verificaciones visuales en escritorio, tableta y móvil. | `tests/e2e/reportes-filtros.spec.ts` | E2E |

## Brechas conocidas

- No existe un comando de cobertura configurado para medir el umbral global del 80 %.
- Los recorridos Registro diario → Evaluación y Registro diario → Receta permanecen omitidos mientras `PLAYWRIGHT_PERMITIR_ESCRITURAS` no sea `SI`.
- No se crearon checkpoints Git para conservar el requisito vigente de mantener un solo commit en el historial.
