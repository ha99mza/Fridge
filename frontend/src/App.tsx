import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import CurrentTemperature from "./pages/CurrentTemperature"
import History from "./pages/History"
import Settings from "./pages/Settings"

function App() {
  const location = useLocation()
  const isSettings = location.pathname.startsWith("/settings")
  const mainClass = isSettings
    ? "flex-1 flex items-start justify-start"
    : "flex-1 flex items-center justify-center"
  const containerClass = isSettings ? "w-full px-4 py-6" : "w-full max-w-3xl px-4 py-6"

  return (
    <div className="h-screen flex flex-col bg-slate-950 bg-linear-to-b from-slate-900 to-slate-950">
      <Navbar />

      <main className={mainClass}>
        <div className={containerClass}>
          <Routes>
            <Route path="/" element={<Navigate to="/current" replace />} />
            <Route path="/current" element={<CurrentTemperature />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App