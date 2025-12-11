type TempField = "minTemp" | "targetTemp" | "maxTemp" | "deltaT"

interface TemperatureSettingsProps {
  minTemp: string
  targetTemp: string
  maxTemp: string
  deltaT: string
  tempIsValid: boolean
  onTempChange: (field: TempField, value: string) => void
  onKeyboardOpen: (field: TempField, value: string) => void
  onSave: () => void
  saveMessage?: string
}

export function TemperatureSettings({
  minTemp,
  targetTemp,
  maxTemp,
  deltaT,
  tempIsValid,
  onTempChange,
  onKeyboardOpen,
  onSave,
  saveMessage,
}: TemperatureSettingsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Reglages de temperature</h3>
        {!tempIsValid && (
          <span className="text-xs text-rose-400">Min {"<="} Nominale {"<="} Max requis</span>
        )}
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Valeur minimale 
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
          Valeur nominale 
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
          Valeur maximale 
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
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Delta T 
          <input
            type="text"
            inputMode="decimal"
            value={deltaT}
            onChange={(e) => onTempChange("deltaT", e.target.value)}
            onFocus={() => onKeyboardOpen("deltaT", deltaT)}
            placeholder="1"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!tempIsValid}
          className={`px-4 py-2 rounded-xl font-semibold shadow-lg transition-colors ${
            tempIsValid
              ? "bg-sky-500 text-white hover:bg-sky-400"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Enregistrer
        </button>
        {saveMessage && <p className="text-xs text-emerald-300">{saveMessage}</p>}
      </div>
    </section>
  )
}
