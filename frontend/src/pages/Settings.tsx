import { useMemo, useState } from "react"
import { TemperatureSettings } from "../components/settings/TemperatureSettings"
import { DefrostSettings } from "../components/settings/DefrostSettings"
import { ConnectionSettings } from "../components/settings/ConnectionSettings"

type ConnectionType = "wifi" | "4g"

export default function Settings() {
  const [activeSection, setActiveSection] = useState<
    "temperature" | "defrost" | "connection"
  >("temperature")

  const [minTemp, setMinTemp] = useState(2)
  const [targetTemp, setTargetTemp] = useState(4)
  const [maxTemp, setMaxTemp] = useState(8)
  const [defrostPeriod, setDefrostPeriod] = useState("2h")

  const [connectionType, setConnectionType] = useState<ConnectionType>("wifi")
  const [apn, setApn] = useState("internet")
  const [connectionSummary, setConnectionSummary] = useState("Wi-Fi non selectionne")

  const [message, setMessage] = useState("")

  const tempIsValid = useMemo(
    () => minTemp <= targetTemp && targetTemp <= maxTemp,
    [minTemp, targetTemp, maxTemp]
  )

  const handleSave = () => {
    if (!tempIsValid) {
      setMessage("Verifie que min <= nominale <= max.")
      return
    }
    setMessage(
      `Reglages enregistres : ${minTemp}°C / ${targetTemp}°C / ${maxTemp}°C, degivrage ${defrostPeriod}, connexion ${connectionSummary}`
    )
  }

  return (
    <div className="space-y-4">
      {/* <h2 className="text-xl md:text-2xl font-semibold text-white">Reglages</h2> */}

      <div className="grid md:grid-cols-[280px_minmax(0,1fr)] items-start gap-6">
        <aside className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 space-y-2 h-fit">
          <button
            type="button"
            onClick={() => setActiveSection("temperature")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "temperature"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Reglages de temperature
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("defrost")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "defrost"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Periode de degivrage
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("connection")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "connection"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Connexion Internet
          </button>
        </aside>

        <div className="bg-fridgeCard/80 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          {activeSection === "temperature" && (
            <TemperatureSettings
              minTemp={minTemp}
              targetTemp={targetTemp}
              maxTemp={maxTemp}
              tempIsValid={tempIsValid}
              setMinTemp={setMinTemp}
              setTargetTemp={setTargetTemp}
              setMaxTemp={setMaxTemp}
            />
          )}

          {activeSection === "defrost" && (
            <DefrostSettings defrostPeriod={defrostPeriod} setDefrostPeriod={setDefrostPeriod} />
          )}

          {activeSection === "connection" && (
            <ConnectionSettings
              connectionType={connectionType}
              setConnectionType={setConnectionType}
              apn={apn}
              setApn={setApn}
              onSummaryChange={setConnectionSummary}
            />
          )}

          {/* <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
            >
              Enregistrer
            </button>
          </div> */}

          {message && (
            <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
