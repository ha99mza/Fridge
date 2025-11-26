import { useMemo, useState } from "react"

type ConnectionType = "wifi" | "4g"

const AVAILABLE_NETWORKS = [
  { ssid: "Fridge_Lab", strength: "★★★★★" },
  { ssid: "Maison", strength: "★★★★☆" },
  { ssid: "Invites", strength: "★★★☆☆" },
]

const DEFROST_OPTIONS = ["1h", "2h", "4h", "6h"]

export default function Settings() {
  const [activeSection, setActiveSection] = useState<
    "temperature" | "defrost" | "connection"
  >("temperature")
  const [minTemp, setMinTemp] = useState(2)
  const [targetTemp, setTargetTemp] = useState(4)
  const [maxTemp, setMaxTemp] = useState(8)

  const [defrostPeriod, setDefrostPeriod] = useState("2h")

  const [connectionType, setConnectionType] = useState<ConnectionType>("wifi")
  const [selectedSsid, setSelectedSsid] = useState(AVAILABLE_NETWORKS[0].ssid)
  const [wifiPassword, setWifiPassword] = useState("")
  const [apn, setApn] = useState("internet")

  const [message, setMessage] = useState("")

  const tempIsValid = useMemo(
    () => minTemp <= targetTemp && targetTemp <= maxTemp,
    [minTemp, targetTemp, maxTemp]
  )

  const handleSave = () => {
    if (!tempIsValid) {
      setMessage("Vérifie que min ≤ nominale ≤ max.")
      return
    }

    const connectionSummary =
      connectionType === "wifi"
        ? `Wi-Fi ${selectedSsid}`
        : `4G (APN: ${apn || "non défini"})`

    setMessage(
      `Réglages enregistrés : ${minTemp}° / ${targetTemp}° / ${maxTemp}°, dégivrage ${defrostPeriod}, connexion ${connectionSummary}`
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold text-white">Réglages</h2>
      <p className="text-sm text-slate-400">
        Ajuste les consignes du réfrigérateur et la connexion réseau.
      </p>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-900/70 border border-slate-800 p-2">
        <button
          type="button"
          onClick={() => setActiveSection("temperature")}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === "temperature"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          Réglages de température
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("defrost")}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === "defrost"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          Période de dégivrage
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("connection")}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            activeSection === "connection"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-slate-300 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          Connexion Internet
        </button>
      </div>

      <div className="bg-fridgeCard/80 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
        {activeSection === "temperature" && (
          <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">
              Réglages de température
            </h3>
            {!tempIsValid && (
              <span className="text-xs text-rose-400">
                Min ≤ Nominale ≤ Max requis
              </span>
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
        )}

        {activeSection === "defrost" && (
          <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">
            Période de dégivrage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEFROST_OPTIONS.map((opt) => (
              <button
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
        )}

        {activeSection === "connection" && (
          <section className="space-y-3">
          <h3 className="text-lg font-semibold text-white">
            Connexion Internet
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setConnectionType("wifi")}
              className={`rounded-full px-3 py-2 text-sm border transition-colors ${
                connectionType === "wifi"
                  ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
              }`}
            >
              Wi-Fi
            </button>
            <button
              type="button"
              onClick={() => setConnectionType("4g")}
              className={`rounded-full px-3 py-2 text-sm border transition-colors ${
                connectionType === "4g"
                  ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
              }`}
            >
              4G
            </button>
          </div>

          {connectionType === "wifi" ? (
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                Réseau Wi-Fi
                <select
                  value={selectedSsid}
                  onChange={(e) => setSelectedSsid(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                >
                  {AVAILABLE_NETWORKS.map((net) => (
                    <option key={net.ssid} value={net.ssid}>
                      {net.ssid} ({net.strength})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                Mot de passe
                <input
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm text-slate-300">
                APN 4G
                <input
                  type="text"
                  value={apn}
                  onChange={(e) => setApn(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </label>
              <p className="text-xs text-slate-400 flex items-center">
                Renseigne l’APN fourni par ton opérateur (ex: internet, mms…).
              </p>
            </div>
          )}
          </section>
        )}

        <div className="flex items-center justify-between gap-3">
          
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
          >
            Enregistrer
          </button>
        </div>

        {message && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
