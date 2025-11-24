interface TemperatureCardProps {
  temperature: number | null
  status: string
  lastUpdate: string
}

export default function TemperatureCard({
  temperature,
  status,
  lastUpdate,
}: TemperatureCardProps) {
  return (
    <div className="bg-fridgeCard/80  border-amber-600 rounded-2xl shadow-xl p-6 md:p-8 border-4 ">
      <div className="flex items-center justify-between gap-4 mb-6 ">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 border-4 border-lime-300">
            Température actuelle
          </p>
          <div className="flex items-end gap-2 border-4 border-red-300">
            <span className="text-5xl md:text-6xl font-semibold text-sky-400">
              {temperature !== null ? temperature.toFixed(1) : "--"}
            </span>
            <span className="text-xl text-slate-300 mb-1">°C</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 border-4 border-pink-700">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "Normal"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : status === "Trop froid"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                : status === "Trop chaud"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "bg-slate-700 text-slate-200 border border-slate-600"
            }`}
          >
            {status || "—"}
          </span>
          <p className="text-[10px] text-slate-400">
            Dernière mise à jour :
            <br />
            <span className="text-[11px] text-slate-300">
              {lastUpdate ? lastUpdate : "En attente…"}
            </span>
          </p>
        </div>
      </div>

      
    </div>
  )
}
