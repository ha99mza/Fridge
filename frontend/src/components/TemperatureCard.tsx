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
    <div className="bg-fridgeCard/80 rounded-3xl shadow-2xl p-10 border border-slate-700 min-h-[260px]">
      <div className="flex items-center justify-between gap-10 h-full">
        {/* Bloc température */}
        <div>
          <p className="text-base lg:text-lg uppercase tracking-[0.25em] text-slate-400 mb-4">
            Température actuelle
          </p>
          <div className="flex items-end gap-4">
            <span className="text-7xl lg:text-8xl font-semibold text-sky-400 leading-none">
              {temperature !== null ? temperature.toFixed(1) : "--"}
            </span>
            <span className="text-7xl lg:text-7xl text-slate-200 mb-1 leading-none">
              °C
            </span>
          </div>
        </div>

        {/* Bloc statut + dernière mise à jour */}
        <div className="flex flex-col items-end gap-4">
          <span
            className={`px-6 py-3 rounded-full text-lg font-semibold border tracking-wide ${
              status === "Normal"
                ? "bg-emerald-500/25 text-emerald-100 border-emerald-400"
                : status === "Trop froid"
                ? "bg-sky-500/25 text-sky-100 border-sky-400"
                : status === "Trop chaud"
                ? "bg-rose-500/25 text-rose-100 border-rose-400"
                : "bg-slate-700 text-slate-100 border-slate-500"
            }`}
          >
            {status || "—"}
          </span>

          <p className="text-sm lg:text-base text-slate-400 text-right leading-snug">
            Dernière mise à jour :
            <br />
            <span className="text-base lg:text-lg text-slate-100">
              {lastUpdate ? lastUpdate : "En attente…"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
