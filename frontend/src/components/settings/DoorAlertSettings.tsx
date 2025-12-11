type AlertField = "alertMin" | "alertMax"

interface DoorAlertSettingsProps {
  alertMin: string
  alertMax: string
  isValid: boolean
  onChange: (field: AlertField, value: string) => void
  onKeyboardOpen: (field: AlertField, value: string) => void
  onSave: () => void
  saveMessage?: string
}

export function DoorAlertSettings({
  alertMin,
  alertMax,
  isValid,
  onChange,
  onKeyboardOpen,
  onSave,
  saveMessage,
}: DoorAlertSettingsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Alerte porte</h3>
        {!isValid && (
          <span className="text-xs text-rose-400">
            Renseigne des valeurs numeriques (min {"<"} max)
          </span>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Temperature min alarme (AøC)
          <input
            type="text"
            inputMode="decimal"
            value={alertMin}
            onChange={(e) => onChange("alertMin", e.target.value)}
            onFocus={() => onKeyboardOpen("alertMin", alertMin)}
            placeholder="0"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Temperature max alarme (AøC)
          <input
            type="text"
            inputMode="decimal"
            value={alertMax}
            onChange={(e) => onChange("alertMax", e.target.value)}
            onFocus={() => onKeyboardOpen("alertMax", alertMax)}
            placeholder="10"
            className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">
        L alarme est declenchee si la temperature mesurée sort de cette plage alors que la porte est
        identifiee comme ouverte.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!isValid}
          className={`px-4 py-2 rounded-xl font-semibold shadow-lg transition-colors ${
            isValid
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
