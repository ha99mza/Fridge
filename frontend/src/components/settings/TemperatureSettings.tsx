type TempField = "minTemp" | "targetTemp" | "maxTemp"

interface TemperatureSettingsProps {
  minTemp: string
  targetTemp: string
  maxTemp: string
  tempIsValid: boolean
  onTempChange: (field: TempField, value: string) => void
  onKeyboardOpen: (field: TempField, value: string) => void
}

export function TemperatureSettings({
  minTemp,
  targetTemp,
  maxTemp,
  tempIsValid,
  onTempChange,
  onKeyboardOpen,
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
            type="text"
            inputMode="decimal"
            value={minTemp}
            onChange={(e) => onTempChange("minTemp", e.target.value)}
            onFocus={() => onKeyboardOpen("minTemp", minTemp)}
            placeholder="-10"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur nominale (°C)
          <input
            type="text"
            inputMode="decimal"
            value={targetTemp}
            onChange={(e) => onTempChange("targetTemp", e.target.value)}
            onFocus={() => onKeyboardOpen("targetTemp", targetTemp)}
            placeholder="4"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur maximale (°C)
          <input
            type="text"
            inputMode="decimal"
            value={maxTemp}
            onChange={(e) => onTempChange("maxTemp", e.target.value)}
            onFocus={() => onKeyboardOpen("maxTemp", maxTemp)}
            placeholder="20"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
    </section>
  )
}
