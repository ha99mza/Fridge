import { useEffect, useMemo, useState } from "react"
import {
  ConnectToWifi,
  GetDeviceNetworkInfo,
  ListWifiSSIDs,
} from "../../wailsjs/go/backend/App"
import { VirtualKeyboard } from "../components/VirtualKeyboard"

type Section =
  | "temperature"
  | "defrost"
  | "alarms"
  | "compressorDoor"
  | "network"
  | "info"

type PresetLevel = "low" | "mid" | "high"
type DefrostInterval = "1h" | "2h" | "3h" | "4h" | "6h" | "8h"
type BuzzerMode = "continuous" | "beep"
type FanDoorMode = "on" | "off" | "auto"
type NetworkTab = "wifi" | "4g"

interface SettingsValues {
  presetActive: PresetLevel
  tempLow: string
  tempMid: string
  tempHigh: string
  hystDiff: string

  periodicDefrostEnabled: boolean
  defrostInterval: DefrostInterval
  defrostDuration: string
  tevapDefrostEnabled: boolean
  tevapThreshold: string

  tempMaxAlarm: string
  tempMinAlarm: string
  buzzerEnabled: boolean
  buzzerMode: BuzzerMode

  antiShortCycleDelay: string
  compressorInhibitedDoorOpen: boolean
  evapFanDoorOpen: FanDoorMode
  doorOpenAlarmDelay: string

  networkTab: NetworkTab
  wifiSsid: string
  wifiPassword: string
  apn4g: string
  prefer4gWhenWifiFails: boolean
}

const DEFAULT_VALUES: SettingsValues = {
  presetActive: "mid",
  tempLow: "2.0",
  tempMid: "4.0",
  tempHigh: "8.0",
  hystDiff: "1.0",

  periodicDefrostEnabled: true,
  defrostInterval: "3h",
  defrostDuration: "5",
  tevapDefrostEnabled: false,
  tevapThreshold: "0",

  tempMaxAlarm: "7.0",
  tempMinAlarm: "2.0",
  buzzerEnabled: true,
  buzzerMode: "beep",

  antiShortCycleDelay: "180",
  compressorInhibitedDoorOpen: true,
  evapFanDoorOpen: "auto",
  doorOpenAlarmDelay: "5",

  networkTab: "wifi",
  wifiSsid: "",
  wifiPassword: "",
  apn4g: "",
  prefer4gWhenWifiFails: false,
}

type KeyboardField = keyof Pick<
  SettingsValues,
  | "tempLow"
  | "tempMid"
  | "tempHigh"
  | "hystDiff"
  | "defrostDuration"
  | "tevapThreshold"
  | "tempMaxAlarm"
  | "tempMinAlarm"
  | "antiShortCycleDelay"
  | "doorOpenAlarmDelay"
  | "wifiSsid"
  | "wifiPassword"
  | "apn4g"
>

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>("temperature")
  const [values, setValues] = useState<SettingsValues>(DEFAULT_VALUES)
  const [savedValues, setSavedValues] = useState<SettingsValues>(DEFAULT_VALUES)
  const [activeField, setActiveField] = useState("");


  const [toast, setToast] = useState<{
    message: string
    kind?: "success" | "error"
  } | null>(null)

  const showToast = (message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const setField = <K extends keyof SettingsValues>(key: K, v: SettingsValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardField | null>(null)
  const [keyboardMode, setKeyboardMode] = useState<"text" | "numeric">("text")

  const keyboardValue = useMemo(() => {
    if (!keyboardTarget) return ""
    return values[keyboardTarget] ?? ""
  }, [keyboardTarget, values])

  const openKeyboard = (field: KeyboardField, mode: "text" | "numeric") => {
    setKeyboardTarget(field)
    setKeyboardMode(mode)
  }

  const closeKeyboard = () => {
    setKeyboardTarget(null)
  }

  const handleKeyboardChange = (nextValue: string) => {
    if (!keyboardTarget) return
    setField(keyboardTarget, nextValue as never)
  }

  // WiFi backend connectivity (allowed)
  const [wifiNetworks, setWifiNetworks] = useState<string[]>([])
  const [wifiLoading, setWifiLoading] = useState(false)
  const [wifiError, setWifiError] = useState("")
  const [wifiMessage, setWifiMessage] = useState("")

  const fetchWifiNetworks = async () => {
    setWifiLoading(true)
    setWifiError("")
    try {
      const list = await ListWifiSSIDs()
      const unique = Array.from(
        new Set((list || []).filter((s: unknown): s is string => typeof s === "string"))
      )
      setWifiNetworks(unique)
    } catch (err) {
      console.error("Liste Wi-Fi impossible", err)
      setWifiError("Impossible de recuperer les reseaux Wi-Fi.")
    } finally {
      setWifiLoading(false)
    }
  }

  const handleConnectWifi = async () => {
    setWifiError("")
    setWifiMessage("")
    if (!values.wifiSsid) {
      setWifiError("SSID requis.")
      return
    }
    try {
      setWifiMessage(`Connexion a ${values.wifiSsid}...`)
      await ConnectToWifi(values.wifiSsid, values.wifiPassword)
      setWifiMessage(`Connexion a ${values.wifiSsid} reussie.`)
      showToast("WiFi connecte", "success")
    } catch (err) {
      console.error("Connexion Wi-Fi echouee", err)
      setWifiMessage("Echec de la connexion Wi-Fi.")
      showToast("Echec WiFi", "error")
    }
  }

  useEffect(() => {
    fetchWifiNetworks()
  }, [])

  // Device info backend (allowed)
  const [deviceIp, setDeviceIp] = useState("")
  const [deviceMac, setDeviceMac] = useState("")
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [deviceError, setDeviceError] = useState("")

  const refreshDeviceInfo = async () => {
    setDeviceLoading(true)
    setDeviceError("")
    try {
      /* const info = await GetDeviceNetworkInfo() */
      const info = { ip: "", mac: "00:11:22:33:44:55" } // Mocked for now
      setDeviceIp(info?.ip || "")
      setDeviceMac(info?.mac || "")
    } catch (err) {
      console.error("Recuperation info reseau impossible", err)
      setDeviceError("Impossible de recuperer les infos reseau.")
    } finally {
      setDeviceLoading(false)
    }
  }

  useEffect(() => {
    refreshDeviceInfo()
  }, [])

  const goSection = (next: Section) => {
    closeKeyboard()
    setActiveSection(next)
  }

  const handleSave = () => {
    closeKeyboard()
    setSavedValues(values)
    showToast("Saved successfully", "success")
  }

  const handleCancel = () => {
    closeKeyboard()
    setValues(savedValues)
  }

  const handleRestoreDefaults = () => {
    closeKeyboard()
    setValues(DEFAULT_VALUES)
  }

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div
          className={`fixed top-22 right-4 z-30 rounded-xl px-4 py-2 text-sm shadow-lg border ${
            toast.kind === "error"
              ? "bg-rose-500/20 border-rose-500/50 text-rose-100"
              : "bg-emerald-500/20 border-emerald-500/50 text-emerald-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid md:grid-cols-[280px_minmax(0,1fr)] items-start gap-6">
        <aside className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 space-y-2 h-fit">
          <button
            type="button"
            onClick={() => goSection("temperature")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "temperature"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Reglages Temperature
          </button>
          <button
            type="button"
            onClick={() => goSection("defrost")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "defrost"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Degivrage
          </button>
          <button
            type="button"
            onClick={() => goSection("alarms")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "alarms"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Reglages Alarmes
          </button>
          <button
            type="button"
            onClick={() => goSection("compressorDoor")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "compressorDoor"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Compresseur & Porte
          </button>
          <button
            type="button"
            onClick={() => goSection("network")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "network"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Reseau (WiFi / 4G)
          </button>
          <button
            type="button"
            onClick={() => goSection("info")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "info"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Informations appareil
          </button>
        </aside>

        <div className="space-y-4">
          <div className="bg-fridgeCard/80 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
            {activeSection === "temperature" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Reglages Temperature</h3>

                <label className="flex flex-col gap-1 text-sm text-slate-300 max-w-xs">
                  Preset actif
                  <select
                    value={values.presetActive}
                    onChange={(e) => setField("presetActive", e.target.value as PresetLevel)}
                    className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="mid">Mid</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-2">
                    Valeurs presets (2.0 → 8.0 °C)
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-300">
                      Temp Low
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values.tempLow}
                        onChange={(e) => setField("tempLow", e.target.value)}
                        onFocus={() => openKeyboard("tempLow", "numeric")}
                        readOnly
                        className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-300">
                      Temp Mid
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values.tempMid}
                        onChange={(e) => setField("tempMid", e.target.value)}
                        onFocus={() => openKeyboard("tempMid", "numeric")}
                        readOnly
                        className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-300">
                      Temp High
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values.tempHigh}
                        onChange={(e) => setField("tempHigh", e.target.value)}
                        onFocus={() => openKeyboard("tempHigh", "numeric")}
                        readOnly
                        className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-2">
                    Hysteresis (0.5 → 2.0 °C)
                  </p>
                  <label className="flex flex-col gap-1 text-sm text-slate-300 max-w-xs">
                    Hyst_diff
                    <input
                      type="text"
                      inputMode="decimal"
                      value={values.hystDiff}
                      onChange={(e) => setField("hystDiff", e.target.value)}
                      onFocus={() => openKeyboard("hystDiff", "numeric")}
                      readOnly
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                    />
                  </label>
                </div>
              </section>
            )}

            {activeSection === "defrost" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Degivrage (Defrost)</h3>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm text-slate-200">Enable periodic defrost</p>
                  <input
                    type="checkbox"
                    checked={values.periodicDefrostEnabled}
                    onChange={(e) => setField("periodicDefrostEnabled", e.target.checked)}
                    className="h-5 w-5 accent-sky-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Defrost_interval (heures)
                    <select
                      value={values.defrostInterval}
                      disabled={!values.periodicDefrostEnabled}
                      onChange={(e) =>
                        setField("defrostInterval", e.target.value as DefrostInterval)
                      }
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    >
                      {(["1h", "2h", "3h", "4h", "6h", "8h"] as DefrostInterval[]).map(
                        (opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Defrost_duration (minutes)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.defrostDuration}
                      disabled={!values.periodicDefrostEnabled}
                      onChange={(e) => setField("defrostDuration", e.target.value)}
                      onFocus={() => openKeyboard("defrostDuration", "numeric")}
                      readOnly
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm text-slate-200">Enable defrost by Tevap threshold</p>
                  <input
                    type="checkbox"
                    checked={values.tevapDefrostEnabled}
                    onChange={(e) => setField("tevapDefrostEnabled", e.target.checked)}
                    className="h-5 w-5 accent-sky-500"
                  />
                </div>

                <label className="flex flex-col gap-1 text-sm text-slate-300 max-w-xs">
                  Tevap threshold (°C)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={values.tevapThreshold}
                    disabled={!values.tevapDefrostEnabled}
                    onChange={(e) => setField("tevapThreshold", e.target.value)}
                    onFocus={() => openKeyboard("tevapThreshold", "numeric")}
                    readOnly
                    className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                  />
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => showToast("Force Defrost", "success")}
                    className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                  >
                    Force Defrost
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("Stop Defrost", "success")}
                    className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                  >
                    Stop Defrost
                  </button>
                </div>
              </section>
            )}

            {activeSection === "alarms" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Reglages Alarmes</h3>

                <div>
                  <p className="text-sm font-semibold text-slate-200 mb-2">
                    Seuils alarmes temperature
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-300">
                      Temp_max_alarm (2.0 → 7.0 °C)
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values.tempMaxAlarm}
                        onChange={(e) => setField("tempMaxAlarm", e.target.value)}
                        onFocus={() => openKeyboard("tempMaxAlarm", "numeric")}
                        readOnly
                        className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-300">
                      Temp_min_alarm (1.5 → 6.0 °C)
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values.tempMinAlarm}
                        onChange={(e) => setField("tempMinAlarm", e.target.value)}
                        onFocus={() => openKeyboard("tempMinAlarm", "numeric")}
                        readOnly
                        className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <p className="text-sm font-semibold text-slate-200">Buzzer</p>
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <p className="text-sm text-slate-200">Buzzer enable</p>
                    <input
                      type="checkbox"
                      checked={values.buzzerEnabled}
                      onChange={(e) => setField("buzzerEnabled", e.target.checked)}
                      className="h-5 w-5 accent-sky-500"
                    />
                  </div>

                  <label className="flex flex-col gap-1 text-sm text-slate-300 max-w-xs">
                    Mode
                    <select
                      value={values.buzzerMode}
                      disabled={!values.buzzerEnabled}
                      onChange={(e) => setField("buzzerMode", e.target.value as BuzzerMode)}
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
                    >
                      <option value="continuous">Continuous</option>
                      <option value="beep">Beep</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            {activeSection === "compressorDoor" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Compresseur & Porte</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Anti_short_cycle_delay (secondes)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.antiShortCycleDelay}
                      onChange={(e) => setField("antiShortCycleDelay", e.target.value)}
                      onFocus={() => openKeyboard("antiShortCycleDelay", "numeric")}
                      readOnly
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm text-slate-300">
                    Door open alarm delay (minutes)
                    <input
                      type="text"
                      inputMode="numeric"
                      value={values.doorOpenAlarmDelay}
                      onChange={(e) => setField("doorOpenAlarmDelay", e.target.value)}
                      onFocus={() => openKeyboard("doorOpenAlarmDelay", "numeric")}
                      readOnly
                      className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                  <p className="text-sm text-slate-200">
                    Compressor inhibited when door open
                  </p>
                  <input
                    type="checkbox"
                    checked={values.compressorInhibitedDoorOpen}
                    onChange={(e) =>
                      setField("compressorInhibitedDoorOpen", e.target.checked)
                    }
                    className="h-5 w-5 accent-sky-500"
                  />
                </div>

                <label className="flex flex-col gap-1 text-sm text-slate-300 max-w-xs">
                  Evap fan when door open
                  <select
                    value={values.evapFanDoorOpen}
                    onChange={(e) =>
                      setField("evapFanDoorOpen", e.target.value as FanDoorMode)
                    }
                    className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                  >
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                    <option value="auto">AUTO</option>
                  </select>
                </label>
              </section>
            )}
            {activeSection === "network" && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Reseau (WiFi / 4G)</h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setField("networkTab", "wifi")}
                    className={`rounded-full px-3 py-2 text-sm border transition-colors ${
                      values.networkTab === "wifi"
                        ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                        : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    WiFi
                  </button>
                  <button
                    type="button"
                    onClick={() => setField("networkTab", "4g")}
                    className={`rounded-full px-3 py-2 text-sm border transition-colors ${
                      values.networkTab === "4g"
                        ? "border-sky-500/60 bg-sky-500/20 text-sky-100"
                        : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    4G
                  </button>
                </div>

                {values.networkTab === "wifi" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-200">WiFi</p>
                      <button
                        type="button"
                        onClick={fetchWifiNetworks}
                        className="text-xs px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-slate-500 bg-slate-900/70"
                      >
                        Rescanner
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1 text-sm text-slate-300">
                        SSID
                        <input
                          list="wifi-ssids"
                          type="text"
                          value={values.wifiSsid}
                          onChange={(e) => setField("wifiSsid", e.target.value)}
                          onFocus={() => openKeyboard("wifiSsid", "text")}
                          readOnly
                          className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                        />
                        <datalist id="wifi-ssids">
                          {wifiNetworks.map((ssid) => (
                            <option key={ssid} value={ssid} />
                          ))}
                        </datalist>
                      </label>

                      <label className="flex flex-col gap-1 text-sm text-slate-300">
                        Password
                        <input
                          type="password"
                          value={values.wifiPassword}
                          onChange={(e) => setField("wifiPassword", e.target.value)}
                          onFocus={() => openKeyboard("wifiPassword", "text")}
                          readOnly
                          className="w-full rounded-xl bg-slate-900/70 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConnectWifi}
                        className="px-4 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
                      >
                        Connect WiFi
                      </button>
                      {wifiLoading && <p className="text-xs text-slate-400">Scan WiFi...</p>}
                      {wifiError && <p className="text-xs text-rose-400">{wifiError}</p>}
                      {wifiMessage && (
                        <p className="text-xs text-emerald-300">{wifiMessage}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-200">4G</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1 text-sm text-slate-300">
                        APN
                        <input
                            type="text"
                            value={values.apn4g}
                            onChange={(e) => setField("apn4g", e.target.value)}
                            onClick={() =>{ /* openKeyboard("apn4g", "text"); */
                                    setActiveField("true");
                            }}
                            onFocus={() => setActiveField("true")}
                            onBlur={() => setActiveField("null")}
                            className={`
                              w-full rounded-xl border px-3 py-2 text-white cursor-pointer
                              ${activeField === "true"
                                ? "bg-red-600 border-red-500"
                                : "bg-slate-900/70 border-slate-700"}
                              focus:outline-none
                            `}
                          />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => showToast("Connect 4G (manuel)", "success")}
                          className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
                        >
                          Connect 4G
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 max-w-md">
                      <p className="text-sm text-slate-200">
                        Prefer 4G when WiFi fails
                      </p>
                      <input
                        type="checkbox"
                        checked={values.prefer4gWhenWifiFails}
                        onChange={(e) =>
                          setField("prefer4gWhenWifiFails", e.target.checked)
                        }
                        className="h-5 w-5 accent-sky-500"
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === "info" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">Device Info</h3>
                  <button
                    type="button"
                    onClick={refreshDeviceInfo}
                    disabled={deviceLoading}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      deviceLoading
                        ? "border-slate-700 text-slate-400 cursor-not-allowed"
                        : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {deviceLoading ? "Actualisation..." : "Actualiser"}
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">IP Address</p>
                    <p className="text-lg text-white font-semibold mt-1">
                      {deviceIp || "Non disponible"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">MAC Address</p>
                    <p className="text-lg text-white font-semibold mt-1">
                      {deviceMac || "Non disponible"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400">Firmware version</p>
                    <p className="text-lg text-white font-semibold mt-1">v1.0.0</p>
                  </div>
                </div>

                {deviceError && <p className="text-xs text-rose-400">{deviceError}</p>}
              </section>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Restore defaults
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-sky-500 text-white font-semibold shadow-lg hover:bg-sky-400 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <VirtualKeyboard
        visible={Boolean(keyboardTarget)}
        value={keyboardValue}
        mode={keyboardMode}
        onChange={handleKeyboardChange}
        onClose={closeKeyboard}
      />
    </div>
  )
}
