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
    <div className="bg-fridgeCard/80 rounded-4xl shadow-2xl p-12 border border-slate-600 min-h-80">
      <div className="flex items-center justify-between gap-12 h-full">
        {/* Bloc température */}
        <div>
          <p className="text-lg lg:text-xl uppercase tracking-[0.3em] text-slate-300 mb-6">
            Température actuelle
          </p>
          <div className="flex items-end gap-5">
            <span className="text-8xl lg:text-9xl font-semibold text-sky-400 leading-none">
              {temperature !== null ? temperature.toFixed(1) : "--"}
            </span>
            <span className="text-5xl lg:text-6xl text-slate-100 mb-2 leading-none">
              °C
            </span>
          </div>
        </div>

        {/* Bloc statut + dernière mise à jour */}
        <div className="flex flex-col items-end gap-6">
          <span
            className={`px-8 py-4 rounded-full text-xl font-bold border tracking-wider ${
              status === "Normal"
                ? "bg-emerald-500/30 text-emerald-50 border-emerald-300"
                : status === "Trop froid"
                ? "bg-sky-500/30 text-sky-50 border-sky-300"
                : status === "Trop chaud"
                ? "bg-rose-500/30 text-rose-50 border-rose-300"
                : "bg-slate-800 text-slate-50 border-slate-500"
            }`}
          >
            {status || "—"}
          </span>

          <p className="text-base lg:text-lg text-slate-300 text-right leading-snug">
            Dernière mise à jour :
            <br/>
            <span className="text-lg lg:text-xl text-slate-50 font-medium">
              {lastUpdate ? lastUpdate : "En attente…"}
            </span>
          </p>
        </div>
      </div>
      <input type="text" className="text-white bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-full mt-4"/>
    </div>
  )
}
