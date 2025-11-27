interface TemperatureSettingsProps {
  minTemp: number
  targetTemp: number
  maxTemp: number
  tempIsValid: boolean
  setMinTemp: (v: number) => void
  setTargetTemp: (v: number) => void
  setMaxTemp: (v: number) => void
}

export function TemperatureSettings({
  minTemp,
  targetTemp,
  maxTemp,
  tempIsValid,
  setMinTemp,
  setTargetTemp,
  setMaxTemp,
}: TemperatureSettingsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Reglages de temperature</h3>
        {!tempIsValid && (
          <span className="text-xs text-rose-400">Min {"<="} Nominale {"<="} Max requis</span>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur minimale (°C)
          <input
            type="number"
            value={minTemp}
            step={0.5}
            min={-10}
            max={maxTemp}
            onChange={(e) => setMinTemp(Number(e.target.value))}
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur nominale (°C)
          <input
            type="number"
            value={targetTemp}
            step={0.5}
            min={minTemp}
            max={maxTemp}
            onChange={(e) => setTargetTemp(Number(e.target.value))}
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur maximale (°C)
          <input
            type="number"
            value={maxTemp}
            step={0.5}
            min={targetTemp}
            max={20}
            onChange={(e) => setMaxTemp(Number(e.target.value))}
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
    </section>
  )
}
