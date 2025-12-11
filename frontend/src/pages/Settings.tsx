import { useEffect, useMemo, useState } from "react"
import { TemperatureSettings } from "../components/settings/TemperatureSettings"
import { DefrostSettings } from "../components/settings/DefrostSettings"
import { ConnectionSettings } from "../components/settings/ConnectionSettings"
import { DoorAlertSettings } from "../components/settings/DoorAlertSettings"
import { DeviceInfo } from "../components/settings/DeviceInfo"
import { VirtualKeyboard } from "../components/VirtualKeyboard"
import { GetDeviceNetworkInfo } from "../../wailsjs/go/backend/App"

type ConnectionType = "wifi" | "4g"
type KeyboardField =
  | "minTemp"
  | "targetTemp"
  | "maxTemp"
  | "deltaT"
  | "wifiPassword"
  | "apn"
  | "alertMin"
  | "alertMax"

export default function Settings() {
  const [activeSection, setActiveSection] = useState<
    "temperature" | "defrost" | "connection" | "alert" | "info"
  >("temperature")

  const [minTemp, setMinTemp] = useState("2")
  const [targetTemp, setTargetTemp] = useState("4")
  const [maxTemp, setMaxTemp] = useState("8")
  const [deltaT, setDeltaT] = useState("1")
  const [defrostPeriod, setDefrostPeriod] = useState("4h")

  const [alertMinTemp, setAlertMinTemp] = useState("0")
  const [alertMaxTemp, setAlertMaxTemp] = useState("10")

  const [connectionType, setConnectionType] = useState<ConnectionType>("wifi")
  const [apn, setApn] = useState("internet")
  const [wifiPassword, setWifiPassword] = useState("")
  const [connectionSummary, setConnectionSummary] = useState("Wi-Fi non selectionne")

  const [tempMessage, setTempMessage] = useState("")
  const [defrostMessage, setDefrostMessage] = useState("")
  const [connectionMessage, setConnectionMessage] = useState("")
  const [alertMessage, setAlertMessage] = useState("")

  const [deviceIp, setDeviceIp] = useState("")
  const [deviceMac, setDeviceMac] = useState("")
  const [deviceInfoMessage, setDeviceInfoMessage] = useState("")
  const [deviceInfoError, setDeviceInfoError] = useState("")
  const [deviceInfoLoading, setDeviceInfoLoading] = useState(false)

  const [keyboardTarget, setKeyboardTarget] = useState<KeyboardField | null>(null)
  const [keyboardValue, setKeyboardValue] = useState("")
  const [keyboardMode, setKeyboardMode] = useState<"text" | "numeric">("text")

  const minTempNumber = useMemo(() => Number.parseFloat(minTemp), [minTemp])
  const targetTempNumber = useMemo(() => Number.parseFloat(targetTemp), [targetTemp])
  const maxTempNumber = useMemo(() => Number.parseFloat(maxTemp), [maxTemp])

  const alertMinNumber = useMemo(() => Number.parseFloat(alertMinTemp), [alertMinTemp])
  const alertMaxNumber = useMemo(() => Number.parseFloat(alertMaxTemp), [alertMaxTemp])

  const tempIsValid = useMemo(() => {
    if (
      Number.isNaN(minTempNumber) ||
      Number.isNaN(targetTempNumber) ||
      Number.isNaN(maxTempNumber)
    ) {
      return false
    }
    return minTempNumber <= targetTempNumber && targetTempNumber <= maxTempNumber
  }, [maxTempNumber, minTempNumber, targetTempNumber])

  const alertRangeIsValid = useMemo(() => {
    if (Number.isNaN(alertMinNumber) || Number.isNaN(alertMaxNumber)) {
      return false
    }
    return alertMinNumber < alertMaxNumber
  }, [alertMaxNumber, alertMinNumber])

  useEffect(() => {
    refreshDeviceInfo()
  }, [])

  const refreshDeviceInfo = async () => {
    setDeviceInfoLoading(true)
    setDeviceInfoError("")
    setDeviceInfoMessage("")
    try {
      const info = await GetDeviceNetworkInfo()
      setDeviceIp(info?.ip || "")
      setDeviceMac(info?.mac || "")
      setDeviceInfoMessage("Infos reseau mises a jour.")
    } catch (err) {
      console.error("Recuperation info reseau impossible", err)
      setDeviceInfoError("Impossible de recuperer l adresse IP/MAC.")
    } finally {
      setDeviceInfoLoading(false)
    }
  }

  const handleTemperatureSave = () => {
    if (!tempIsValid) {
      setTempMessage("Verifie que min <= nominale <= max.")
      return
    }
    setTempMessage(
      `Consignes enregistrees : min ${minTemp}\u00b0C, nominale ${targetTemp}\u00b0C, max ${maxTemp}\u00b0C, Delta T ${deltaT}\u00b0C.`
    )
  }

  const handleDefrostSave = () => {
    setDefrostMessage(`Periode enregistree : toutes les ${defrostPeriod}.`)
  }

  const handleConnectionSave = () => {
    setConnectionMessage(`Configuration enregistree : ${connectionSummary}.`)
  }

  const handleAlertSave = () => {
    if (!alertRangeIsValid) {
      setAlertMessage("Saisis deux valeurs numeriques avec min < max.")
      return
    }
    setAlertMessage(`Alarme porte enregistree : de ${alertMinTemp}\u00b0C a ${alertMaxTemp}\u00b0C.`)
  }

  const openKeyboard = (field: KeyboardField, value: string, mode: "text" | "numeric") => {
    setKeyboardTarget(field)
    setKeyboardValue(value ?? "")
    setKeyboardMode(mode)
  }

  const closeKeyboard = () => {
    setKeyboardTarget(null)
    setKeyboardValue("")
  }

  const syncKeyboardValue = (field: KeyboardField, value: string) => {
    if (keyboardTarget === field) {
      setKeyboardValue(value)
    }
  }

  const handleKeyboardChange = (value: string) => {
    if (!keyboardTarget) return
    setKeyboardValue(value)
    switch (keyboardTarget) {
      case "minTemp":
        setMinTemp(value)
        setTempMessage("")
        break
      case "targetTemp":
        setTargetTemp(value)
        setTempMessage("")
        break
      case "maxTemp":
        setMaxTemp(value)
        setTempMessage("")
        break
      case "deltaT":
        setDeltaT(value)
        setTempMessage("")
        break
      case "wifiPassword":
        setWifiPassword(value)
        setConnectionMessage("")
        break
      case "apn":
        setApn(value)
        setConnectionMessage("")
        break
      case "alertMin":
        setAlertMinTemp(value)
        setAlertMessage("")
        break
      case "alertMax":
        setAlertMaxTemp(value)
        setAlertMessage("")
        break
    }
  }

  return (
    <div className="space-y-4">
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
          <button
            type="button"
            onClick={() => setActiveSection("alert")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "alert"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Alerte porte
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("info")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === "info"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            Infos appareil
          </button>
        </aside>

        <div className="bg-fridgeCard/80 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-6">
          {activeSection === "temperature" && (
            <TemperatureSettings
              minTemp={minTemp}
              targetTemp={targetTemp}
              maxTemp={maxTemp}
              deltaT={deltaT}
              tempIsValid={tempIsValid}
              onTempChange={(field, value) => {
                setTempMessage("")
                if (field === "minTemp") setMinTemp(value)
                if (field === "targetTemp") setTargetTemp(value)
                if (field === "maxTemp") setMaxTemp(value)
                if (field === "deltaT") setDeltaT(value)
                syncKeyboardValue(field, value)
              }}
              onKeyboardOpen={(field, value) => openKeyboard(field, value, "numeric")}
              onSave={handleTemperatureSave}
              saveMessage={tempMessage}
            />
          )}

          {activeSection === "defrost" && (
            <DefrostSettings
              defrostPeriod={defrostPeriod}
              setDefrostPeriod={(value) => {
                setDefrostPeriod(value)
                setDefrostMessage("")
              }}
              onSave={handleDefrostSave}
              saveMessage={defrostMessage}
            />
          )}

          {activeSection === "connection" && (
            <ConnectionSettings
              connectionType={connectionType}
              setConnectionType={(value) => {
                setConnectionType(value)
                setConnectionMessage("")
              }}
              apn={apn}
              setApn={(value) => {
                setApn(value)
                setConnectionMessage("")
                syncKeyboardValue("apn", value)
              }}
              wifiPassword={wifiPassword}
              setWifiPassword={(value) => {
                setWifiPassword(value)
                setConnectionMessage("")
                syncKeyboardValue("wifiPassword", value)
              }}
              onSummaryChange={(summary) => {
                setConnectionSummary(summary)
                setConnectionMessage("")
              }}
              onKeyboardOpen={(field, value) => openKeyboard(field, value, "text")}
              onSave={handleConnectionSave}
              saveMessage={connectionMessage}
            />
          )}

          {activeSection === "alert" && (
            <DoorAlertSettings
              alertMin={alertMinTemp}
              alertMax={alertMaxTemp}
              isValid={alertRangeIsValid}
              onChange={(field, value) => {
                setAlertMessage("")
                if (field === "alertMin") setAlertMinTemp(value)
                if (field === "alertMax") setAlertMaxTemp(value)
                syncKeyboardValue(field, value)
              }}
              onKeyboardOpen={(field, value) => openKeyboard(field, value, "numeric")}
              onSave={handleAlertSave}
              saveMessage={alertMessage}
            />
          )}

          {activeSection === "info" && (
            <DeviceInfo
              ip={deviceIp}
              mac={deviceMac}
              loading={deviceInfoLoading}
              error={deviceInfoError}
              infoMessage={deviceInfoMessage}
              onRefresh={refreshDeviceInfo}
            />
          )}
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
