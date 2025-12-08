import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export interface TemperaturePoint {
  timestamp: string
  temperature: number
}

interface TemperatureChartProps {
  data: TemperaturePoint[]
}

function formatTimeLabel(timestamp: string) {
  if (!timestamp) return ""
  const d = new Date(timestamp)
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TemperatureChart({ data }: TemperatureChartProps) {
  return (
    <div className="h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimeLabel}
            stroke="#9ca3af"
            tick={{ fontSize: 14, fontWeight: 500 }}
            tickLine={false}
          />

          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 14, fontWeight: 500 }}
            domain={["auto", "auto"]}
            unit="°C"
            tickLine={false}
          />

          <Tooltip
            labelFormatter={(value) =>
              new Date(value as string).toLocaleString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
              })
            }
            formatter={(value: number) => [
              `${value.toFixed(1)} °C`,
              "Température",
            ]}
            contentStyle={{
              backgroundColor: "#020617",
              borderColor: "#1e293b",
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
            }}
            labelStyle={{
              fontSize: 13,
              color: "#e5e7eb",
              marginBottom: 4,
            }}
            itemStyle={{
              fontSize: 14,
              color: "#e5e7eb",
            }}
          />

          {/* <Line
            type="monotone"
            dataKey="temperature"
            stroke="#38bdf8"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          /> */}
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#38bdf8"
            strokeWidth={3.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
