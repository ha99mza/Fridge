import { GetDefrostSettings } from "../../../wailsjs/go/backend/App"
import { useEffect, useState } from "react"


const DEFROST_OPTIONS = ["1h", "2h", "4h", "6h"]

interface DefrostSettingsProps {
  defrostPeriod: string
  setDefrostPeriod: (v: string) => void
}


export function DefrostSettings({ defrostPeriod, setDefrostPeriod }: DefrostSettingsProps) {
  const [periodDefrost, setPeriodDefrost] = useState("")
  const GetDefrostperiod = async () => {
    try {
      const defrost = await GetDefrostSettings()
      console.log("Periode de degivrage trouvee :", defrost)

      setPeriodDefrost(defrost)
    } catch (err) {
      console.error("Impossible de recuperer la periode de degivrage", err)
    }
  }

  useEffect(() => {
    GetDefrostperiod()
  }, [])


  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Periode de degivrage</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DEFROST_OPTIONS.map((opt) => (
          <button
            defaultChecked={periodDefrost === opt}
            key={opt}
            type="button"
            onClick={() => setDefrostPeriod(opt)}
            className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
              defrostPeriod === opt
                ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
            }`}
          >
            Toutes les {opt}
          </button>
        ))}
      </div>
    </section>
  )
}
