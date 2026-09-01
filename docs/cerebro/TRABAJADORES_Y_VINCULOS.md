# Trabajadores y vínculos

```mermaid
flowchart TD
  T[Trabajador] --> V1[Vínculo 1: empresa y departamento anteriores]
  T --> V2[Vínculo 2: empresa y departamento vigentes]
  V1 --> F1[Ficha del episodio 1]
  V1 --> E1[Evaluación del episodio 1]
  V2 --> F2[Ficha del episodio 2]
  V2 --> E2[Evaluación del episodio 2]
```

Un trabajador puede tener varios vínculos laborales y una asignación vigente. Si en la semana 1 perteneció a Sistemas y en la semana 2 a Marketing, la ficha anterior conserva Sistemas y la nueva muestra Marketing. No se reescriben documentos históricos. Véanse [[FLUJO_CLINICO]] y [[BASE_DE_DATOS]].
