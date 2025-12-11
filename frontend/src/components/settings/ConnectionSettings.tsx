import { useEffect, useState } from "react"
import { ListWifiSSIDs, ConnectToWifi } from "../../../wailsjs/go/backend/App"

type ConnectionType = "wifi" | "4g"

interface ConnectionSettingsProps {
  connectionType: ConnectionType
  setConnectionType: (v: ConnectionType) => void
  apn: string
  setApn: (v: string) => void
  wifiPassword: string
  setWifiPassword: (v: string) => void
  onKeyboardOpen: (field: "wifiPassword" | "apn", value: string) => void
  onSummaryChange?: (summary: string) => void
  onSave: () => void
  saveMessage?: string
}

export function ConnectionSettings({
  connectionType,
  setConnectionType,
  apn,
  setApn,
  wifiPassword,
  setWifiPassword,
  onKeyboardOpen,
  onSummaryChange,
  onSave,
  saveMessage,
}: ConnectionSettingsProps) {
  const [wifiNetworks, setWifiNetworks] = useState<string[]>([])
  const [selectedSsid, setSelectedSsid] = useState("")
  const [wifiLoading, setWifiLoading] = useState(false)
  const [wifiError, setWifiError] = useState("")
  const [connectMessage, setConnectMessage] = useState("")

  const fetchNetworks = async () => {
    setWifiLoading(true)
    setWifiError("")
    setConnectMessage("")
    try {
      const list = await ListWifiSSIDs()
      console.log("Reseaux Wi-Fi trouves :", list)
      const uniqueList = Array.from(
        new Set((list || []).filter((s: unknown): s is string => typeof s === "string"))
      )
      setWifiNetworks(uniqueList)
      if (uniqueList.length > 0) {
        setSelectedSsid(uniqueList[0])
      } else {
        setWifiError("Aucun reseau Wi-Fi detecte.")
      }
    } catch (err) {
      console.error("Liste Wi-Fi impossible", err)
      setWifiError("Impossible de recuperer les reseaux Wi-Fi.")
    } finally {
      setWifiLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworks()
  }, [])

  useEffect(() => {
    if (onSummaryChange) {
      const summary =
        connectionType === "wifi"
          ? `Wi-Fi ${selectedSsid || "non selectionne"}`
          : `4G (APN: ${apn || "non defini"})`
      onSummaryChange(summary)
    }
  }, [connectionType, selectedSsid, apn, onSummaryChange])

  const handleConnect = async () => {
    if (connectionType !== "wifi" || !selectedSsid) return
    try {
      setConnectMessage(`Connexion a ${selectedSsid}...`)
      await ConnectToWifi(selectedSsid, wifiPassword)
      setConnectMessage(`Connexion a ${selectedSsid} reussie.`)
    } catch (err) {
      console.error("Connexion Wi-Fi echouee", err)
      setConnectMessage("Echec de la connexion Wi-Fi.")
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Connexion Internet</h3>
        <button
          type="button"
          onClick={fetchNetworks}
          className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 bg-slate-900/70"
        >
          Rescanner le Wi-Fi
        </button>
      </div>

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
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Reseau Wi-Fi
              <select
                value={selectedSsid}
                onChange={(e) => setSelectedSsid(e.target.value)}
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              >
                {wifiNetworks.length === 0 && <option value="">Aucun reseau disponible</option>}
                {wifiNetworks.map((ssid) => (
                  <option key={ssid} value={ssid}>
                    {ssid}
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
                onFocus={() => onKeyboardOpen("wifiPassword", wifiPassword)}
                placeholder="********"
                className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConnect}
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
            >
              Se connecter
            </button>
            {wifiLoading && <p className="text-xs text-slate-400">Scan Wi-Fi...</p>}
            {wifiError && <p className="text-xs text-rose-400">{wifiError}</p>}
            {connectMessage && <p className="text-xs text-emerald-300">{connectMessage}</p>}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            APN 4G
            <input
              type="text"
              value={apn}
              onChange={(e) => setApn(e.target.value)}
              onFocus={() => onKeyboardOpen("apn", apn)}
              className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </label>
          <p className="text-xs text-slate-400 flex items-center">
            Renseigne l APN fourni par ton operateur (ex: internet, mms).
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
        >
          Enregistrer
        </button>
        {saveMessage && <p className="text-xs text-emerald-300">{saveMessage}</p>}
      </div>
    </section>
  )
}
