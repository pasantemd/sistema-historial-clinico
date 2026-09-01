# Sistema Clínico Ocupacional

Aplicación interna para gestionar trabajadores, contexto laboral, atención médica ocupacional, documentos clínicos, inventario y trazabilidad. Usa Next.js App Router, Auth.js, Prisma y PostgreSQL en un monolito modular.

## Arquitectura resumida

```text
Navegador → Next.js → autenticación/permisos → validación → servicios
→ repositorios/consultas → Prisma → PostgreSQL
```

Las rutas en `src/app` son adaptadores mínimos. Las lecturas ocurren en servidor; las escrituras siguen Server Action → Zod → servicio → repositorio/transacción → auditoría. Los Client Components se usan solo para interacción.

## Reglas esenciales

- Permisos, estado y coherencia de recursos se validan en servidor.
- La UI no concede permisos; los documentos finalizados o emitidos son de solo lectura.
- Un documento conserva el trabajador, el contexto laboral y el médico responsable reales de ese momento.
- Receta no mueve inventario; Registro diario puede descontar stock al registrarse.
- CIE-10 usa catálogo oficial y sinónimos solo para búsqueda.
- Graphify representa dependencias técnicas del código; Obsidian representa este mapa conceptual.

## Cerebro conceptual

- [[cerebro/FLUJO_GENERAL]]
- [[cerebro/ARQUITECTURA]]
- [[cerebro/USUARIOS_ROLES_PERMISOS]]
- [[cerebro/TRABAJADORES_Y_VINCULOS]]
- [[cerebro/CITAS_Y_ATENCION]]
- [[cerebro/FLUJO_CLINICO]]
- [[cerebro/INVENTARIO]]
- [[cerebro/DOCUMENTOS_PDF]]
- [[cerebro/BASE_DE_DATOS]]
- [[cerebro/INTEGRACIONES]]

## Módulos principales

| Área | Responsabilidad |
|---|---|
| Organización | empresas, departamentos, trabajadores y vínculos laborales |
| Atención | citas, registro diario, evaluaciones, alergias y CIE-10 |
| Documentos | fichas, certificados, recetas, documentos clínicos y reportes |
| Soporte | inventario, usuarios, roles, configuración y auditoría |

Para situación reciente, consulta [[ESTADO_ACTUAL]]. Para riesgos activos, consulta [[AUDITORIA]].
