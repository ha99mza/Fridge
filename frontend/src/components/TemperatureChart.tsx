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
    <div className="h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimeLabel}
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
            domain={["auto", "auto"]}
            unit="°C"
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
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
