# Análisis de oportunidades de caché

Fecha del análisis: 26 de agosto de 2026.

Este documento es una auditoría de solo lectura. No implementa caché, no cambia consultas, no modifica Prisma y no habilita opciones de Next.js. Las recomendaciones se basan en el código actual, la base de datos local disponible y mediciones puntuales; no son un sustituto de métricas de producción.

## 1. Resumen ejecutivo

| Área | Recomendación | Tipo de caché | Prioridad |
| ---- | ------------- | ------------- | --------- |
| CIE-10 | Sí, después de alinear/validar el plan SQL | Next.js `use cache` + `Map` local acotado | Alta |
| Sesión e identidad | Sí, solo durante la solicitud | `React.cache()` | Alta |
| Permisos | Sí, solo durante la solicitud y compartiendo la misma lectura de identidad | `React.cache()` | Alta |
| Morbilidades | Mantener la caché local existente; servidor opcional tras optimizar búsqueda | `Map` local; `use cache` opcional | Media |
| Reportes | No todavía; eliminar el fan-out y medir de nuevo | Sin caché inicialmente; `use cache` opcional después | Alta para optimización |
| Dashboard | Bloqueado: corregir alcance multiempresa antes de cachear | Sin caché | Crítica |
| Empresas autorizadas | No recomendado por ahora: consulta barata, pocos consumidores y revocación sensible | Memoización por solicitud solo si aparece duplicación real | Baja |
| Departamentos | Innecesario en la función directa actualmente sin consumidores; opcional por empresa si se adopta | `use cache` opcional con key por empresa | Baja |
| Autocomplete de trabajadores | Caché local temporal y acotada, opcional | `Map` en memoria del componente | Media |
| Inventario y stock | No | — | Bloqueado |
| Borradores clínicos | No | — | Bloqueado |
| Auditoría | No; optimizar filtros e índices primero | — | Bloqueado |
| PDF/XLSX finalizados | Evaluación futura, no prioridad sin medición del generador | Artefacto privado e inmutable, no caché global de respuesta | Baja |

Conclusiones principales:

1. La oportunidad más clara de caché persistente es CIE-10: hay 14.199 enfermedades, la búsqueda se reutiliza entre usuarios y las muestras locales tardaron aproximadamente 181–222 ms después del primer acceso.
2. La ganancia más segura es memoizar identidad/autorización dentro de cada render del servidor. En la página de Reportes la cadena actual puede producir siete lecturas de identidad/autorización antes de las consultas del reporte.
3. Reportes no debe cachearse aún: una ejecución sin empresa seleccionada dispara 22 ramas principales y luego cuatro conteos por cada empresa autorizada. Con siete empresas son al menos 50 consultas, o 51 cuando existen diagnósticos que resolver.
4. Dashboard tiene un problema previo de seguridad: consulta métricas y registros globales sin filtrar por el usuario ni por sus empresas autorizadas. Cachearlo consolidaría y podría ampliar esa exposición.
5. Stock, permisos entre solicitudes, borradores, datos clínicos editables y auditoría deben conservar frescura inmediata.

## 2. Alcance, método y evidencia

### Código y documentación revisados

- `AGENTS.md`.
- `docs/ESTADO_ACTUAL.md`, `docs/SISTEMA.md` y `docs/AUDITORIA.md`.
- Mapas aplicables de `docs/cerebro/`.
- `next.config.ts`, `package.json`, `prisma/schema.prisma` y migraciones relacionadas.
- Consultas, repositorios, servicios, Server Actions, Route Handlers y componentes de búsqueda bajo `src/`.
- `graphify-out/graph.json` para contrastar imports y consumidores.

La búsqueda estática encontró 235 apariciones de operaciones de lectura (`findMany`, `findUnique`, `findFirst`, `count`, `groupBy`, `aggregate` o `$queryRaw`) distribuidas en 41 archivos de producción. Los archivos con mayor concentración fueron:

| Archivo | Apariciones encontradas |
| ------- | -----------------------: |
| `src/modulos/reportes/consultas/reportes.consulta.ts` | 26 |
| `src/modulos/recetas/repositorios/recetas.repositorio.ts` | 24 |
| `src/modulos/inventario/repositorios/inventario.repositorio.ts` | 17 |
| `src/modulos/fichas-ocupacionales/consultas/fichas.consulta.ts` | 14 |
| `src/modulos/citas/repositorios/citas.repositorio.ts` | 13 |
| `src/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta.ts` | 10 |
| `src/modulos/inicio/consultas/inicio.consulta.ts` | 9 |

Esto es un conteo de referencias en código, no un número de consultas por petición.

### Datos locales y mediciones

La base local contenía, al momento de medir:

| Entidad | Cantidad |
| ------- | -------: |
| Enfermedades CIE-10 | 14.199 |
| Sinónimos CIE-10 | 48 |
| Morbilidades | 14 |
| Empresas | 7 |
| Departamentos | 48 |
| Autorizaciones usuario-empresa | 14 |

Muestras ejecutadas desde el mismo equipo y base local:

| Operación | Muestras |
| --------- | -------- |
| CIE-10 `R51` | 599,1 ms; 208,4 ms; 188,3 ms |
| CIE-10 `dolor cabeza` | 218,3 ms; 217,4 ms; 222,0 ms |
| CIE-10 `mareo` | 189,6 ms; 181,7 ms; 220,8 ms |
| Morbilidad `dolor` | 102,3 ms; 2,1 ms; 1,7 ms |
| Morbilidad `cabeza` | 2,4 ms; 5,0 ms; 2,0 ms |
| Reporte semanal, 7 empresas | 652,8 ms; 69,9 ms |
| Dashboard | 1.256,3 ms; 23,7 ms |

La diferencia entre primera y segunda ejecución refleja, entre otros factores, calentamiento del proceso, conexión y buffers de PostgreSQL; no existe una caché de aplicación que explique esas mejoras. No se deben extrapolar estos tiempos a producción.

Un `EXPLAIN (ANALYZE, BUFFERS)` simplificado para `lower(unaccent(descripcion)) LIKE '%dolor%'` mostró `Seq Scan`. El plan simplificado tardó 17,729 ms, pero la consulta real de CIE-10 incorpora múltiples `OR`, subconsultas, similitud, orden de prioridad y límite; sus muestras fueron mayores.

### Limitaciones de las herramientas

- Graphify fue útil para contrastar consumidores, pero el archivo fue generado en el commit `f19e7bc4...` y el código actual está en `eef7a41c...`. Por ello, las conclusiones finales se verificaron con `rg` y lectura del código actual.
- La skill CodeHealth está instalada, pero su servidor MCP no estuvo conectado durante la auditoría. No se inventaron puntuaciones ni métricas CodeHealth.
- No se contaba con telemetría, trazas APM ni carga de producción. Los TTL son recomendaciones a validar mediante métricas reales.

## 3. Estado actual de caché en Next.js 16

| Elemento | Estado encontrado | Evidencia |
| -------- | ----------------- | --------- |
| `cacheComponents` | No configurado | `next.config.ts` solo declara `serverExternalPackages` |
| Directiva `use cache` | No existe | Búsqueda global sin coincidencias |
| `unstable_cache` | No existe | Búsqueda global sin coincidencias |
| `React.cache` | No existe | Búsqueda global sin coincidencias |
| `cacheTag` / `cacheLife` | No existen | Búsqueda global sin coincidencias |
| `revalidateTag` / `updateTag` | No existen | Búsqueda global sin coincidencias |
| Caché local de autocomplete | Sí, solo morbilidades | `CampoMorbilidad` usa `useRef<Map<string, string[]>>` |
| Render dinámico protegido | Sí | `src/app/(dashboard)/layout.tsx`: `dynamic = "force-dynamic"`, `revalidate = 0` |
| Respuestas clínicas `no-store` | Sí en las respuestas exitosas revisadas | `src/proxy.ts`, `respuesta-pdf.ts` y rutas XLSX |

En Next.js 16, `use cache` depende de habilitar `cacheComponents`. Esa habilitación sería un cambio de configuración separado y debe evaluarse como una decisión de arquitectura, no introducirse incidentalmente junto con el primer candidato.

Referencias oficiales consultadas:

- [Directiva `use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache).
- [Configuración `cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents).
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife).
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag).
- [`cache` de React](https://react.dev/reference/react/cache).

## 4. CIE-10

- **Archivos:** `src/modulos/catalogo-cie10/consultas/catalogo-cie10.consulta.ts`, `src/modulos/catalogo-cie10/servicios/buscar-cie10.servicio.ts`, `src/modulos/catalogo-cie10/componentes/buscador-cie10.tsx`, migraciones `20260720133408_crear_catalogo_enfermedades_cie10` y `20260720141014_agregar_sinonimos_cie10`.
- **Funciones:** `consultarCie10`, `buscarCie10`, `enriquecerConSinonimosControlados` y `buscarCie10Accion`.
- **Consumidores:** formularios de evaluaciones médicas, fichas ocupacionales y documentos clínicos. El componente compartido `BuscadorCie10` tiene tres consumidores de interfaz reales.
- **Query actual:** `$queryRaw` parametrizado; normaliza texto, busca por código, prefijo, descripción sin acentos, tokens, similitud trigram y sinónimos; ordena por una prioridad calculada y limita a 20. Cuando hay sinónimos controlados puede ejecutar un segundo `findMany` por códigos faltantes.
- **Frecuencia estimada:** alta durante la digitación clínica. El componente exige dos caracteres, aplica debounce de 300 ms y cada término diferente vuelve a consultar el servidor.
- **Evidencia de costo:** 14.199 filas; las nueve muestras de búsqueda reales se mantuvieron aproximadamente entre 181 y 222 ms después del primer acceso. El componente no tiene caché local.
- **Índices:** existen `pg_trgm`, `unaccent`, GIN sobre `LOWER(descripcion)` y GIN sobre `LOWER(termino)` de sinónimos. La consulta usa `lower(unaccent(descripcion))`, expresión distinta del índice GIN existente; el plan simplificado confirmó un escaneo secuencial. Debe revisarse el plan completo antes de atribuir todo el costo a falta de caché.
- **Riesgo:** bajo en confidencialidad porque es un catálogo común, pero una invalidación ausente dejaría resultados obsoletos después de importar enfermedades o sinónimos.
- **Tipo de caché recomendado:** `use cache` a nivel de función, después de habilitar conscientemente `cacheComponents`; además, `Map` local acotado por montaje para evitar repetir términos durante la misma edición.
- **Key conceptual:** `cie10:{terminoNormalizado}:{limite}`. No incluir objetos no serializables.
- **Tag:** `cie10`.
- **TTL recomendado:** entre 1 y 24 horas. El extremo alto es razonable solo porque los cambios ocurren mediante scripts de importación, no durante el flujo clínico normal.
- **Invalidación:** invalidar `cie10` al completar correctamente `scripts/importar-cie10.ts` o `scripts/importar-sinonimos-cie10.ts`. Para lectura inmediata después de una importación administrativa, preferir invalidación explícita; no depender solo del TTL.
- **Beneficio esperado:** evitar búsquedas SQL complejas repetidas por términos comunes y reducir latencia del autocomplete. El beneficio debe medirse con tasa de aciertos, p50/p95 y carga real.
- **Prioridad:** alta, con el prerrequisito de analizar/alinear la expresión indexada y el plan real.

## 5. Morbilidades

- **Archivos:** `src/modulos/morbilidades/consultas/morbilidades.consulta.ts`, `src/modulos/morbilidades/repositorios/morbilidades.repositorio.ts`, `src/modulos/morbilidades/componentes/campo-morbilidad.tsx`, migración `20260825141351_catalogo_morbilidades`.
- **Funciones:** `buscarMorbilidadesEnCatalogo`, `asegurarMorbilidadEnCatalogo` y `buscarMorbilidadesAccion`.
- **Consumidores:** formularios de evaluación médica y registro diario.
- **Query actual:** normaliza y tokeniza; genera un `contains` por token, toma como mínimo 50 candidatos, ordena relevancia en JavaScript y devuelve hasta 20.
- **Frecuencia estimada:** alta durante digitación, con debounce de 300 ms.
- **Evidencia de costo:** el catálogo local tiene solo 14 filas; después de la primera llamada las muestras estuvieron entre 1,7 y 5 ms.
- **Caché existente:** `CampoMorbilidad` ya guarda resultados en un `Map` por montaje usando el término en minúsculas. No usa `localStorage`.
- **Índices:** `nombreNormalizado` es único. Los filtros `contains` producen búsqueda con comodín inicial y no tienen un índice trigram específico; antes de añadir caché de servidor debe medirse al crecer el catálogo y, si procede, optimizar la consulta/índice.
- **Creación e invalidación:** una morbilidad puede crearse o reactivarse durante la escritura clínica mediante `asegurarMorbilidadEnCatalogo`, incluso dentro de una transacción.
- **Riesgo:** resultados stale que omitan una morbilidad recién escrita; invalidar dentro de una transacción exige separar cuidadosamente el límite de persistencia del de invalidación.
- **Tipo de caché recomendado:** mantener el `Map` local actual. `use cache` de servidor es opcional, no justificado todavía por el tamaño/costo local.
- **Key conceptual si crece:** `morbilidades:{terminoNormalizado}:{limite}`.
- **Tag conceptual:** `morbilidades`.
- **TTL recomendado si crece:** 5–15 minutos, porque el catálogo sí cambia desde el flujo clínico.
- **Invalidación:** después del commit exitoso de una creación o reactivación; nunca antes de confirmar la transacción.
- **Beneficio esperado:** hoy es principalmente UX local; el beneficio de servidor sería limitado con 14 registros.
- **Prioridad:** media para vigilar crecimiento e índice; baja para caché persistente inmediata.

## 6. Sesión, identidad y permisos

- **Archivos:** `src/servicios/autenticacion/obtener-sesion.ts`, `src/servicios/autenticacion/requerir-usuario.ts`, `src/servicios/autenticacion/requerir-permiso.ts`, `src/modulos/autenticacion/repositorios/repositorio-autenticacion.ts`, `src/app/(dashboard)/layout.tsx`.
- **Funciones:** `obtenerUsuarioActual`, `requerirUsuario`, `buscarIdentidadUsuarioPorId`, `consultarAutorizacionUsuario` y `requerirPermiso`.
- **Consumidores:** 129 llamadas estáticas a `requerirPermiso` y 14 a `requerirUsuario` en `src/app`, `src/modulos` y `src/servicios`; el layout también obtiene el usuario para sidebar/navegación.
- **Query actual:** `obtenerUsuarioActual` consulta identidad, `requerirUsuario` vuelve a consultar la misma identidad y `requerirPermiso` hace una tercera consulta de autorización. Roles y permisos se cargan en más de una de esas lecturas.
- **Duplicación observada:** el layout protegido puede hacer dos lecturas de identidad. Una página que llama a `requerirPermiso` agrega tres. La página de Reportes llama además a `requerirUsuario`, alcanzando siete lecturas de identidad/autorización en el render. La ruta de exportación hace cinco antes de generar el documento.
- **Sidebar:** no consulta la base por sí misma; recibe el usuario del layout. El problema es la cadena de helpers, no el componente visual.
- **Riesgo:** crítico si se persiste entre solicitudes; una revocación de rol, permiso, usuario o empresa debe verse inmediatamente.
- **Tipo de caché recomendado:** `React.cache()` compartido por los helpers usados desde Server Components para memoizar la identidad/autorización durante un único render del servidor.
- **Key:** `usuarioId` para identidad/autorización dentro de la solicitud. La sesión actual debe resolverse fuera de cualquier caché persistente.
- **Tag:** no aplica.
- **TTL:** no aplica; React invalida esta memoización entre solicitudes.
- **Invalidación:** automática al terminar la solicitud.
- **Beneficio esperado:** reducir lecturas duplicadas sin retrasar revocaciones ni compartir datos entre usuarios.
- **Prioridad:** alta.

La refactorización futura debe evitar crear varias funciones `cache(...)` independientes para la misma consulta: todos los Server Components deben importar la misma función memoizada. React documenta que esta caché se invalida entre solicitudes y que solo está disponible dentro del contexto de Server Components. Route Handlers y Server Actions no deben asumir esa memoización: allí corresponde evitar llamadas duplicadas pasando una identidad/autorización ya resuelta dentro de la misma ejecución. También deben conservarse las verificaciones sensibles en servidor.

## 7. Reportes

- **Archivos:** `src/modulos/reportes/consultas/reportes.consulta.ts`, `src/modulos/reportes/consultas/medicamentos-entregados.consulta.ts`, `src/app/(dashboard)/reportes/page.tsx`, `src/app/api/reportes/exportar/route.ts`, generadores PDF/XLSX.
- **Funciones:** `consultarReportes`, `construirDonde`, `consultarMedicamentosEntregadosReporte`, `generarReportePdf` y `generarReporteXlsx`.
- **Consumidores:** pantalla de Reportes y Route Handler compartido por PDF/XLSX. Comparten implementación de consulta, pero son solicitudes distintas y recalculan todo.
- **Query actual:** 22 ramas iniciales en `Promise.all`: cuatro conteos, cinco listados, una lista de empresas, múltiples `groupBy`, resolución CIE-10 y SQL de medicamentos entregados.
- **N+1/fan-out:** después del bloque principal se ejecutan cuatro `count` por cada empresa autorizada mediante `Promise.all(emp.map(...))`. Con siete empresas son 28 consultas adicionales. El total mínimo es 50 y puede llegar a 51 cuando la agrupación de diagnósticos requiere el `findMany` de enfermedades.
- **Autorización:** la mayoría de filtros incorpora `empresa.usuariosAutorizados.some({ usuarioId })`; el SQL de medicamentos también valida `UsuarioEmpresa`. Si se selecciona una empresa, se llama además a `requerirAccesoEmpresa`.
- **Frecuencia estimada:** cada cambio automático de filtro vuelve a renderizar la página; PDF y XLSX vuelven a ejecutar la consulta en su propia petición.
- **Medición local:** 652,8 ms en la primera muestra y 69,9 ms en una segunda muestra caliente, con siete empresas. No existe caché de aplicación.
- **Riesgo:** muy alto si la key omite usuario o alcance autorizado; pantalla/PDF/XLSX podrían divergir si usan keys o invalidaciones diferentes.
- **Recomendación inmediata:** no cachear. Primero reemplazar el fan-out por agregaciones agrupadas, revisar selects y medir consultas/planes con volumen representativo.
- **Tipo de caché futuro:** `use cache` solo si, después de optimizar, la misma combinación de filtros sigue siendo costosa y se repite con una tasa de aciertos útil.
- **Key conceptual completa:** `reportes:{alcanceAutorizadoEstable}:{periodo}:{fechaDesde}:{fechaHasta}:{empresaId}:{departamentoId}:{trabajadorId}:{profesionalId}:{estado}`. `usuarioId` puede formar parte del alcance, pero no basta si las autorizaciones cambian sin invalidación.
- **Tags conceptuales:** `reportes:{empresaId}` para una empresa concreta y tags adicionales por entidades mutables solo si se diseña una matriz completa de invalidación. Para “todas las empresas” se necesita una representación estable del alcance autorizado; nunca una key global.
- **TTL recomendado futuro:** 30–60 segundos, únicamente si se acepta esa ventana de stale y existe invalidación por escrituras clínicas. Es una recomendación inicial, no un requisito del framework.
- **Invalidación futura:** altas, finalizaciones, anulaciones o cambios que afecten registros diarios, evaluaciones, fichas, recetas, citas, diagnósticos, morbilidades y movimientos entregados; además, cambios de autorización usuario-empresa.
- **Beneficio esperado:** potencialmente alto, pero solo después de reducir el número de consultas. Antes de eso, la caché ocultaría un problema estructural y tendría una superficie de invalidación muy amplia.
- **Prioridad:** alta para optimización SQL; media y condicionada para caché.

## 8. Dashboard

- **Archivos:** `src/modulos/inicio/consultas/inicio.consulta.ts` y `src/modulos/inicio/componentes/pagina-inicio.tsx`.
- **Funciones:** `consultarResumenInicio`.
- **Consumidores:** página principal; exige únicamente `trabajador.ver`.
- **Query actual:** siete `count` y dos `findMany` paralelos: trabajadores activos, registros del día, evaluaciones, citas, recetas, borradores y listados recientes.
- **Medición local:** 1.256,3 ms en la primera muestra y 23,7 ms en la segunda muestra caliente.
- **Hallazgo de seguridad:** ninguna de las nueve consultas filtra por `usuarioId`, `UsuarioEmpresa`, rol ni empresa autorizada. Los conteos y registros recientes son globales.
- **Riesgo:** cachear el resultado actual perpetuaría un resultado multiempresa global y podría ampliar la exposición entre usuarios.
- **Recomendación:** corregir alcance/autorización, definir qué métricas corresponden a cada rol y consolidar/optimizar consultas antes de cachear.
- **Tipo de caché futuro:** solo tras corregir lo anterior; como máximo una caché privada y corta por alcance autorizado estable.
- **Key conceptual futura:** `inicio:{alcanceAutorizadoEstable}:{rolOConjuntoPermisos}:{fechaUtc}`.
- **TTL recomendado futuro:** 15–30 segundos si negocio acepta esa demora; borradores y citas de hoy podrían requerir frescura mayor.
- **Invalidación futura:** escrituras de cada entidad mostrada y cambios de autorización.
- **Beneficio esperado:** indeterminado hasta corregir seguridad y medir la consulta optimizada.
- **Prioridad:** crítica para seguridad; caché bloqueada.

## 9. Empresas y catálogo organizacional

- **Archivos:** `src/modulos/empresas/consultas/empresas.consulta.ts` y `src/modulos/trabajadores/consultas/trabajadores.consulta.ts`.
- **Funciones:** `consultarEmpresasAutorizadas` y `consultarCatalogoOrganizacional`.
- **Consumidores reales:** `consultarEmpresasAutorizadas` se usa en páginas de empresas y departamentos (lista, alta y edición). `consultarCatalogoOrganizacional` se usa en lista/alta/edición de trabajadores, nuevo vínculo laboral y Reportes: cinco consumidores visibles.
- **Query actual:** siempre restringe a empresas activas autorizadas por `usuarioId`. La variante de administración incluye tres `_count`; el catálogo organizacional ejecuta empresas y departamentos en paralelo.
- **Evidencia de tamaño:** siete empresas y 14 relaciones usuario-empresa en la base local.
- **Frecuencia de cambio:** baja para datos de empresa, pero las autorizaciones pueden cambiar y son sensibles.
- **Riesgo:** mezclar empresas entre usuarios o mantener acceso tras una revocación.
- **Tipo de caché recomendado:** ninguno entre solicitudes por ahora. Si se observa duplicación dentro del mismo render, memoización por solicitud; no hay evidencia actual suficiente para pagar la complejidad de tags persistentes.
- **Key conceptual si el volumen crece:** `empresas-autorizadas:{usuarioId}:{busquedaNormalizada}`; requiere invalidación ante cambios de Empresa y UsuarioEmpresa.
- **Tag conceptual:** `empresas` más uno específico por usuario/alcance; una única tag global causaría invalidaciones amplias.
- **TTL recomendado si se adopta:** 30–60 segundos como máximo, y solo con invalidación de autorizaciones. La revocación no debe depender del TTL para seguridad.
- **Beneficio esperado:** bajo con el tamaño y costo actuales.
- **Prioridad:** baja; clasificación actual: innecesario.

## 10. Departamentos

- **Archivos:** `src/modulos/departamentos/consultas/departamentos.consulta.ts`, `src/modulos/trabajadores/consultas/trabajadores.consulta.ts` y `src/modulos/fichas-ocupacionales/consultas/fichas.consulta.ts`.
- **Funciones:** `consultarDepartamentosActivos`, `consultarCatalogoOrganizacional` y `consultarCatalogoFicha`.
- **Consumidores:** la función directa `consultarDepartamentosActivos` está exportada pero no tiene consumidor de producción encontrado. Los formularios obtienen departamentos dentro de catálogos combinados.
- **Query actual:** la función directa acepta `empresaId`, exige estado activo y autorización del usuario. El catálogo combinado trae todos los departamentos autorizados.
- **Evidencia de tamaño:** 48 departamentos locales.
- **Riesgo:** una key solo por `empresaId` es segura únicamente si la autorización se verifica fuera del límite cacheado en cada solicitud. No debe cachearse el “departamento autorizado” sin revalidar acceso.
- **Tipo de caché recomendado:** ninguno hoy. Si un selector dependiente por empresa adopta la función y genera repetición demostrable, `use cache` puede guardar solo filas no sensibles por empresa, con autorización comprobada fuera de la función cacheada.
- **Key conceptual:** `departamentos:{empresaId}`.
- **Tag:** `departamentos:{empresaId}`.
- **TTL recomendado futuro:** 5–30 minutos, porque cambian poco; invalidación explícita en crear, editar, activar/desactivar o mover de empresa.
- **Beneficio esperado:** bajo con 48 filas y sin consumidor directo actual.
- **Prioridad:** baja.

## 11. Trabajadores y autocompletes

- **Archivos:** `src/modulos/registro-diario/consultas/registro-diario.consulta.ts`, `src/componentes/formularios/selector-trabajador-clinico.tsx`, autocompletes de evaluaciones, recetas, documentos, citas, fichas y trabajadores.
- **Funciones:** `buscarTrabajadoresParaRegistro`, `buscarTrabajadoresClinicosAccion`, `buscarTrabajadoresRegistroAccion` y adaptadores equivalentes.
- **Consumidores:** cabecera y múltiples formularios/listados clínicos comparten la misma consulta de búsqueda.
- **Query actual:** busca por documento, nombres, apellidos o combinación; restringe por empresas autorizadas, incluye empresa, departamento y alergias activas; limita a 20.
- **Frontend:** varios consumidores aplican debounce, normalmente de 300 ms, pero no comparten caché local.
- **Riesgo:** contiene identificadores, contexto laboral y alergias. No debe ir a `localStorage`, IndexedDB ni caché persistente compartida.
- **Tipo de caché recomendado:** `Map` local, acotado y de vida del componente, solo si las métricas muestran términos repetidos. La key debe incluir el término normalizado y el componente debe descartar datos al desmontarse.
- **TTL:** vida del montaje; opcionalmente pocos minutos en memoria, nunca persistente.
- **Invalidación:** desmontaje, cambio de sesión/alcance o mutación relevante del trabajador.
- **Beneficio esperado:** mejora de UX al volver a términos recientes; no justifica caché de perfiles completos.
- **Prioridad:** media, después de CIE-10.

## 12. Módulos clínicos transaccionales

### 12.1 Registro diario

- **Archivos principales:** `src/modulos/registro-diario/consultas/registro-diario.consulta.ts` y `src/modulos/registro-diario/repositorios/registro-diario.repositorio.ts`.
- **Estado real:** `BORRADOR`, `REGISTRADO` o `ANULADO`; puede incluir entregas relacionadas con inventario.
- **Clasificación:** borradores y registros que participan en movimientos: sin caché persistente. Los listados usan filtros autorizados, paginación y estados que cambian.
- **Parte inmutable:** los snapshots históricos de un registro `REGISTRADO` son adecuados para reconstruir documentos, pero no hay evidencia de lecturas repetidas que justifique cachear el DTO completo. Una anulación también cambia su representación.
- **Frontend:** las búsquedas de trabajador y medicamento tienen debounce de 300 ms. Trabajador admite `Map` local efímero; medicamento de inventario no debe cachearse porque incluye disponibilidad operativa.

### 12.2 Evaluaciones médicas

- **Archivos principales:** `src/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta.ts` y `src/modulos/evaluaciones-medicas/repositorios/evaluaciones.repositorio.ts`.
- **Estado real:** `BORRADOR`, `FINALIZADA` o `ANULADA`; contiene diagnósticos, morbilidad, prescripción y snapshots históricos.
- **Clasificación:** borrador: sin caché. Finalizada: candidato opcional únicamente para lectura/documento inmutable, después de medir repetición y mantener autorización fuera de la caché. Anulación debe invalidar cualquier artefacto.
- **Inventario:** los medicamentos de la evaluación son prescripción y no consumen stock; aun así, el documento clínico puede contener datos sensibles y no debe compartirse globalmente.

### 12.3 Recetas

- **Archivos principales:** `src/modulos/recetas/repositorios/recetas.repositorio.ts` y `src/modulos/recetas/servicios/generar-receta-pdf.ts`.
- **Estado real:** `BORRADOR`, `EMITIDA` o `ANULADA`; persiste snapshots de trabajador, empresa, profesional, diagnósticos y medicamentos.
- **Clasificación:** borrador: sin caché. Emitida: candidato opcional para artefacto PDF versionado, no para una respuesta pública ni sin revalidar autorización. Anulada: invalidación inmediata.
- **Beneficio actual:** no medido. Las 24 referencias de lectura del repositorio indican complejidad, no por sí solas repetición cacheable.

### 12.4 Fichas ocupacionales

- **Archivos principales:** `src/modulos/fichas-ocupacionales/consultas/fichas.consulta.ts`, `src/modulos/fichas-ocupacionales/repositorios/fichas.repositorio.ts` y generadores de ficha/certificado.
- **Estado real:** `BORRADOR`, `FINALIZADA` o `ANULADA`; el modelo conserva contexto laboral y profesional histórico.
- **Clasificación:** borrador: sin caché. Finalizada: candidato opcional para artefactos PDF/XLSX inmutables, sujeto a versión, autorización por solicitud y medición. Anulación/corrección autorizada debe retirar el artefacto anterior.
- **Catálogos de formulario:** empresas y departamentos autorizados son pequeños en la base actual; no justifican caché persistente por sí solos.

En los cuatro módulos, los listados y detalles siguen siendo datos clínicos privados. “Finalizado” permite evaluar reutilización de un artefacto estable, pero no convierte la ruta en pública ni elimina la validación de empresa/permiso.

## 13. Documentos finalizados, PDF y XLSX

- **Archivos:** los 12 Route Handlers bajo `src/app/api`, `src/servicios/documentos/pdf/respuesta-pdf.ts` y generadores PDF/XLSX de fichas, certificados, evaluaciones, recetas, registro diario, inventario, documentos clínicos y reportes.
- **Comportamiento actual:** los documentos se consultan y generan en cada solicitud. PDFKit y ExcelJS trabajan en memoria. No se almacena un artefacto renderizado reutilizable.
- **Inmutabilidad:** fichas/evaluaciones finalizadas y recetas emitidas deben preservar snapshots históricos; borradores siguen mutables. Los movimientos de inventario y reportes por rango no son inmutables porque pueden recibir nuevos eventos o anulaciones.
- **Respuesta HTTP:** `responderPdfInline` envía `private, no-store, max-age=0`, `Pragma: no-cache` y `Expires: 0`; las rutas XLSX revisadas también usan `private, no-store`. Esta política debe mantenerse aunque internamente se reutilice un artefacto autorizado.
- **Riesgo:** un Buffer cacheado globalmente por ID sin verificar autorización fuera de la caché puede exponer contenido clínico. Cachear borradores también produciría documentos stale.
- **Tipo de caché recomendado:** ninguno ahora. Como evaluación futura, un almacén privado de artefactos inmutables, versionado por `documentoId` y versión/finalización, con autorización ejecutada en cada descarga. No usar una respuesta HTTP pública ni una key basada solo en nombre de archivo.
- **TTL recomendado futuro:** no definir hasta medir costo/tasa de descargas. Para un artefacto realmente inmutable sería preferible invalidación/versionado, no un TTL arbitrario.
- **Invalidación:** anulación, corrección legal autorizada o cambio de versión del generador. Borradores quedan excluidos.
- **Beneficio esperado:** desconocido; primero instrumentar duración de consulta, generación y tamaño por tipo.
- **Prioridad:** baja.

## 14. Route Handlers y control HTTP

Se encontraron 12 Route Handlers, incluyendo Auth.js, reportes, PDFs clínicos y exportaciones Excel.

Hallazgos:

1. Las respuestas exitosas PDF centralizadas y las XLSX revisadas usan `private, no-store`.
2. `src/proxy.ts` aplica la misma política a las rutas protegidas listadas.
3. El matcher del proxy no incluye `/vista-previa/:path*`. Esa página está dentro del layout protegido, que es dinámico y valida sesión, y sus componentes vuelven a validar acceso; aun así, conviene incluir explícitamente la ruta en la política HTTP para evitar depender solo de la jerarquía de layout.
4. Algunas respuestas JSON/texto de error no declaran explícitamente `no-store`. No incluyen el documento clínico, pero uniformar la política reduce riesgo de cambios futuros.
5. No se encontró un endpoint clínico público con caché positiva deliberada.

Recomendación: conservar `private, no-store` en toda entrega clínica. La caché interna de datos o artefactos, si se adopta, no debe cambiar el control HTTP ni sustituir la autorización por solicitud.

## 15. Datos que NO deben cachearse persistentemente

| Área | Motivo |
| ---- | ------ |
| Stock disponible de inventario | Cambia en entregas, entradas, retiros, devoluciones y reversiones; la consistencia inmediata evita sobreentrega |
| Movimientos y entregas de inventario | Son trazabilidad operativa y alimentan el stock actual y reportes |
| Permisos, roles y estado de usuario | Una revocación debe surtir efecto en la siguiente solicitud; usar solo memoización por request |
| Autorizaciones usuario-empresa | Cachearlas puede mantener acceso a otra empresa después de revocarlo |
| Borradores de fichas ocupacionales | Son editables y deben reflejar el último guardado |
| Borradores de evaluaciones médicas | Son editables y pueden cambiar diagnósticos, morbilidad y medicamentos prescritos |
| Borradores de recetas | La prescripción puede cambiar antes de emitirse |
| Registros diarios en edición | Pueden afectar entregas de inventario y datos clínicos/ocupacionales |
| Perfiles completos de trabajadores | Contienen datos personales, laborales y alergias; alto riesgo y cambios relevantes |
| Auditoría | Se espera información fresca para seguridad y trazabilidad |
| Listados clínicos filtrados | Estados, anulaciones y autorizaciones cambian; no hay evidencia de repetición que compense la invalidación |
| Citas operativas actuales | Programación, confirmación, atención y cancelación deben verse inmediatamente |

El catálogo estático `UNIDADES_INVENTARIO` no necesita caché: ya es una constante de código en `src/modulos/inventario/constantes/index.ts`.

## 16. Optimizar antes de cachear

### 16.1 Reportes: eliminar fan-out por empresa

El bloque `Promise.all(emp.map(...))` ejecuta cuatro conteos por empresa. Debe reemplazarse por agregaciones agrupadas por `empresaId` y luego combinarse en memoria. Esto reduce viajes a PostgreSQL y hace que el costo no crezca linealmente con el número de empresas.

### 16.2 Dashboard: corregir seguridad y alcance

Las nueve consultas son globales pese a que la página solo exige `trabajador.ver`. Antes de consolidar conteos o cachear, cada métrica debe definir y aplicar el alcance autorizado real.

### 16.3 CIE-10: alinear consulta e índice

El índice GIN usa `LOWER(descripcion)`, mientras la búsqueda usa `lower(unaccent(descripcion))`. Revisar el plan completo y diseñar una estrategia compatible con PostgreSQL/unaccent antes de crear otro índice. La caché evitará repeticiones, pero no corrige los misses costosos.

### 16.4 Morbilidades: búsqueda `contains`

El índice único de `nombreNormalizado` no acelera necesariamente comodines iniciales. Con 14 filas no es un problema medible; al crecer, validar `EXPLAIN ANALYZE` y considerar una búsqueda/indexación adecuada antes de una caché de servidor.

### 16.5 Autenticación: eliminar lecturas equivalentes

La memoización por request ayuda, pero también debe simplificarse la cadena para que identidad, estado, roles y permisos provengan de una lectura coherente. Cachear funciones duplicadas independientes no elimina el trabajo.

### 16.6 Inventario y auditoría: reducir consultas, no ocultarlas

- Inventario lista `count`, `findMany`, `aggregate` y dos conteos adicionales. Por consistencia no debe cachearse; conviene revisar si los indicadores pueden obtenerse en una agregación SQL coherente.
- Auditoría ejecuta lista+conteo y tres conteos de resumen. Mantener frescura y revisar índices compuestos por filtros/orden antes de considerar resúmenes históricos materializados.

### 16.7 Diferenciar técnicas

| Técnica | Problema que resuelve | No resuelve |
| ------- | --------------------- | ----------- |
| Caché | Evita repetir un resultado reutilizable | Una query estructuralmente mala o una autorización ausente |
| Índice PostgreSQL | Reduce el trabajo para localizar/ordenar filas | Viajes N+1 ni datos stale |
| Optimización de query | Reduce columnas, filas y cantidad de consultas | Repetición legítima entre solicitudes |
| Pool de conexiones | Administra/reutiliza conexiones | Costo lógico de consultas, autorización o invalidación |

## 17. Riesgos de introducir caché

1. **Datos stale:** citas, estados clínicos, borradores o catálogos recién creados pueden no aparecer.
2. **Invalidación incompleta:** Reportes depende de muchas entidades; olvidar una mutación produce resultados silenciosamente incorrectos.
3. **Mezcla multiempresa:** una key que no incluya el alcance autorizado puede entregar datos de otra empresa.
4. **Permisos revocados:** un TTL persistente puede mantener acceso después de desactivar usuario, rol, permiso o UsuarioEmpresa.
5. **Exposición clínica:** Buffers, perfiles o resultados de autocomplete guardados en una caché compartida pueden cruzar sesiones.
6. **Stock desactualizado:** una lectura stale puede permitir entregar más medicamento del disponible.
7. **Pantalla/PDF/XLSX inconsistentes:** si cada formato usa keys o tiempos distintos, el mismo reporte puede mostrar cifras diferentes.
8. **Crecimiento de memoria:** Maps sin límite por montaje prolongado o keys de reportes de alta cardinalidad pueden crecer sin control.
9. **Cache stampede:** la expiración simultánea de CIE-10/reportes puede concentrar consultas costosas.
10. **Falsa mejora:** buffers calientes de PostgreSQL ya reducen tiempos; una medición sin separar DB/app puede atribuir ganancias a la técnica incorrecta.

## 18. Priorización final

| Prioridad | Módulo | Acción |
| --------- | ------ | ------ |
| 1 | Dashboard | Corregir alcance multiempresa y autorización; no cachear mientras tanto |
| 2 | Sesión/permisos | Diseñar una lectura única memoizada por solicitud con `React.cache()` |
| 3 | Reportes | Sustituir cuatro conteos por empresa por agregaciones agrupadas y volver a medir |
| 4 | CIE-10 | Revisar plan/índice y luego aplicar `use cache` + `Map` local acotado |
| 5 | Morbilidades | Mantener `Map` actual; medir crecimiento antes de caché de servidor |
| 6 | Autocomplete de trabajadores | Añadir solo caché local efímera si métricas de UX muestran repetición |
| 7 | Empresas/departamentos | No cachear hoy; reconsiderar con volumen o duplicación demostrable |
| 8 | PDF/XLSX inmutables | Instrumentar generación y descargas antes de evaluar artefactos privados |

## 19. Decisión propuesta

La primera fase futura no debería habilitar caché de forma amplia. La secuencia recomendada es:

1. resolver el alcance del Dashboard;
2. eliminar duplicación por request de identidad/permisos;
3. optimizar el fan-out de Reportes;
4. corregir/validar el plan de CIE-10;
5. habilitar `cacheComponents` solo mediante una decisión explícita y aplicar `use cache` inicialmente a CIE-10;
6. instrumentar hit rate, p50/p95, tamaño y errores de invalidación antes de ampliar candidatos.

No se recomienda caché persistente para inventario, permisos, autorizaciones, borradores, auditoría ni perfiles clínicos completos.

## 20. Lista de verificación para una implementación futura

- [ ] Definir propietario de cada tag e invalidación.
- [ ] Mantener autorización fuera de todo resultado compartido y revalidarla por solicitud.
- [ ] Incluir parámetros completos y alcance multiempresa en cada key.
- [ ] Limitar cardinalidad y memoria de caches locales.
- [ ] Probar revocación de usuario, rol, permiso y empresa.
- [ ] Probar alta/edición/anulación y lectura inmediata en pantalla/PDF/XLSX.
- [ ] Probar concurrencia de stock sin caché persistente.
- [ ] Medir tasa de aciertos y latencia antes/después con volumen representativo.
- [ ] Mantener `Cache-Control: private, no-store` en contenido clínico descargable.
- [ ] Añadir pruebas de aislamiento entre usuarios y empresas antes de activar caché entre solicitudes.
