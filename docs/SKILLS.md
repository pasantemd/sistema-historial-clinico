# Inventario y Clasificación de Skills Locales

Documento de referencia para las skills instaladas y disponibles en el entorno de desarrollo y en el proyecto **Sistema de Historial Clínico Ocupacional**.

---

## 1. Resumen de Ubicaciones Inspeccionadas

| Carpeta / Ubicación | Estado | Descripción |
|---|---|---|
| `.agent/` | No existe | No encontrada en el proyecto ni en el perfil de usuario. |
| `.agents/` (Proyecto) | Filtrado y Activo | `c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills` (23 skills relevantes conservadas para el stack Next.js/PostgreSQL). |
| `.agents/` (Global) | Existe | `C:\Users\pasantemd\.agents\skills` (Skills de usuario: Impeccable, Bug Hunter, UI/UX Pro Max, WebApp Testing, Animaciones). |
| `.opencode/` | No existe | No encontrada en el entorno. |
| `.codex/` | Existe en usuario | `C:\Users\pasantemd\.codex\.tmp\` (Caché de plugins/marketplaces de Codex). |
| `.impeccable/` | Existe | Contiene `design.json` de configuración de diseño (sin archivos `SKILL.md`). |
| Plugins | Existe | `C:\Users\pasantemd\.gemini\config\plugins\chrome-devtools-plugin\skills\` (5 skills para Chrome DevTools, accesibilidad y rendimiento). |
| Built-in Antigravity | Existe | `C:\Users\pasantemd\.gemini\antigravity-ide\builtin\skills\` (3 skills integradas del entorno). |

---

## 2. Skills Activas Conservadas en el Proyecto

A continuación se listan las 23 skills activas mantenidas en `.agents/skills/` del proyecto:

1. **`nextjs-app-router-patterns`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\nextjs-app-router-patterns\SKILL.md`): Patrones de Next.js 16 App Router (Server Components, Server Actions, streaming, carga de datos).
2. **`prisma-client-api`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\prisma-client-api\SKILL.md`): Consultas tipadas, filtros y transacciones atómicas `$transaction` en Prisma Client.
3. **`prisma-postgres`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\prisma-postgres\SKILL.md`): Configuración, índices, esquemas y migraciones para PostgreSQL con Prisma.
4. **`knip-dead-code`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\knip-dead-code\SKILL.md`): Detección y limpieza estática de código muerto, exportaciones huérfanas y dependencias sin uso.
5. **`security-audit`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\security-audit\SKILL.md`): Auditoría de seguridad enfocada en autorización en servidor, aislamiento por empresa y vulnerabilidades reales.
6. **`browser-qa`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\browser-qa\SKILL.md`): Pruebas visuales automatizadas y verificación de interacción en navegadores reales.
7. **`e2e-testing`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\e2e-testing\SKILL.md`): Pruebas End-to-End con Playwright (Page Object Model, CI, fixtures).
8. **`tdd-workflow`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\tdd-workflow\SKILL.md`): Desarrollo guiado por pruebas para unitarias, integración y regresión clínica.
9. **`verification-loop`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\verification-loop\SKILL.md`): Ciclo de verificación exhaustivo (tipos TypeScript, linting, tests) previo a completar tareas.
10. **`error-handling`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\error-handling\SKILL.md`): Manejo estructurado y tipado de errores, boundaries y retroalimentación al usuario.
11. **`ai-regression-testing`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\ai-regression-testing\SKILL.md`): Estrategias de testing para prevenir regresiones en lógica crítica de negocio.
12. **`click-path-audit`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\click-path-audit\SKILL.md`): Trazabilidad de flujos y estados UI para evitar botones rotos o estados inconsistentes.
13. **`plankton-code-quality`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\plankton-code-quality\SKILL.md`): Cumplimiento de calidad de código, formato y estándares de escritura.
14. **`web-performance-audit`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\web-performance-audit\SKILL.md`): Auditoría de tiempos de carga, Core Web Vitals y optimización web.
15. **`living-docs-governance`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\living-docs-governance\SKILL.md`): Gobernanza y sincronización de documentación viva (`docs/ESTADO_ACTUAL.md`, `docs/SISTEMA.md`).
16. **`git-workflow`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\git-workflow\SKILL.md`): Estándares de commits atómicos y flujo de ramas.
17. **`delivery-gate`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\delivery-gate\SKILL.md`): Verificación mecánica de criterios de calidad antes de entrega.
18. **`architecture-decision-records`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\architecture-decision-records\SKILL.md`): Registro estructurado de decisiones arquitectónicas (ADRs).
19. **`codehealth-mcp`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\codehealth-mcp\SKILL.md`): Monitoreo de salud estructural de código y prevención de deuda técnica.
20. **`plan-canvas`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\plan-canvas\SKILL.md`): Visualización y revisión anotada de planes en navegador.
21. **`continuous-learning-v2`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\continuous-learning-v2\SKILL.md`): Aprendizaje de patrones e instintos específicos del proyecto.
22. **`agent-introspection-debugging`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\agent-introspection-debugging\SKILL.md`): Diagnóstico y autorecuperación estructurada ante fallos.
23. **`agent-self-evaluation`** (`c:\Users\pasantemd\Desktop\sistema-historial-clinico\.agents\skills\agent-self-evaluation\SKILL.md`): Autoevaluación rigurosa de entregas según 5 ejes de calidad.

---

## 3. Skills Complementarias del Entorno Global y Plugins

- **UI / UX & Diseño**: `impeccable`, `ui-ux-pro-max`, `apple-design`, `emil-design-eng`, `animate`, `ask-sonner`.
- **Browser & Chrome DevTools**: `chrome-devtools`, `a11y-debugging`, `debug-optimize-lcp`, `memory-leak-debugging`, `troubleshooting`, `webapp-testing`.
- **Bug Hunting & Seguridad Avanzada**: `bug-hunter`, `recon`, `hunter`, `skeptic`, `referee`, `fixer`, `security-review`, `commit-security-scan`.

---

## 4. Skills Eliminadas del Proyecto (Incompatibles o No Utilizadas)

Las siguientes 30 carpetas de skills fueron eliminadas de `.agents/skills/` por no pertenecer al stack de este proyecto web (Next.js / PostgreSQL) o por estar deprecadas:

`windows-desktop-e2e`, `continuous-learning` (v1 deprecada), `config-gc`, `configure-ecc`, `context-budget`, `council`, `council-multi-model`, `dev-team`, `ecc-guide`, `ecc-recipes`, `eval-harness`, `growth-log`, `hookify-rules`, `inherit-legacy-style`, `intent-driven-development`, `iterative-retrieval`, `loop-design-check`, `product-lens`, `production-audit`, `repo-scan`, `rules-distill`, `santa-method`, `skill-scout`, `skill-stocktake`, `strategic-compact`, `unified-memory`, `ck`, `code-tour`, `codebase-onboarding`, `agent-sort`.
