"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { DatosGraficoDonut } from "../../tipos";

interface Props {
  data: DatosGraficoDonut[];
  titulo: string;
  height?: number;
}

export function GraficoDonut({ data, titulo, height = 250 }: Props) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para graficar</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="valor"
            nameKey="nombre"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "var(--foreground)",
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: "var(--foreground)", fontSize: "14px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
