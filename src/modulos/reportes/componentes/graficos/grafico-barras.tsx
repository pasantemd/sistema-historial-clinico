"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import type { DatosGraficoBarras } from "../../tipos";

interface Props {
  data: DatosGraficoBarras[];
  titulo?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  mostrarLeyenda?: boolean;
  nombreSerie?: string;
  anchoEjeY?: number;
  mostrarValores?: boolean;
}

function truncarTexto(texto: string, maxLongitud = 24): string {
  if (texto.length <= maxLongitud) return texto;
  return `${texto.slice(0, maxLongitud - 1)}…`;
}

export function GraficoBarras({
  data,
  titulo,
  color = "var(--primary)",
  height = 250,
  horizontal,
  mostrarLeyenda = false,
  nombreSerie = "Cantidad",
  anchoEjeY = 140,
  mostrarValores = true,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="space-y-2">
        {titulo && <p className="text-sm font-medium text-foreground">{titulo}</p>}
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para graficar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {titulo && <p className="text-sm font-medium text-foreground">{titulo}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={
            horizontal
              ? { top: 5, right: mostrarValores ? 40 : 15, left: 10, bottom: 5 }
              : { top: 10, right: 10, left: 0, bottom: 25 }
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                dataKey="label"
                type="category"
                width={anchoEjeY}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(valor) => truncarTexto(String(valor), Math.floor(anchoEjeY / 7))}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                angle={-45}
                textAnchor="end"
                height={60}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
            </>
          )}
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--foreground)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
            formatter={(value: unknown, _name: unknown, item: { payload?: { unidad?: string } }) => {
              const unidad = item?.payload?.unidad;
              const formattedVal = typeof value === "number" ? value.toLocaleString("es-EC") : String(value ?? 0);
              const textoValor = unidad ? `${formattedVal} ${unidad}` : formattedVal;
              return [textoValor, nombreSerie];
            }}
            labelFormatter={(label) => label}
          />
          {mostrarLeyenda && <Legend />}
          <Bar
            dataKey="valor"
            fill={color}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            name={nombreSerie}
          >
            {horizontal && mostrarValores && (
              <LabelList
                dataKey="valor"
                position="right"
                style={{ fontSize: "12px", fill: "var(--foreground)", fontWeight: 600 }}
                formatter={(val: unknown) => (typeof val === "number" ? val.toLocaleString("es-EC") : String(val ?? ""))}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
