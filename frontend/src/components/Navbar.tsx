import { NavLink } from "react-router-dom"

export default function Navbar() {
  const baseClasses =
    "px-4 py-2 rounded-full text-sm font-medium transition-colors"
  const activeClasses = "bg-sky-500 text-white shadow-lg"
  const inactiveClasses =
    "text-slate-300 hover:text-white hover:bg-slate-800/60"

  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
            R
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">
              Réfrigérateur
            </h1>
            
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/current"
            className={({ isActive }) =>
              `${baseClasses}  ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            Température actuelle
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `${baseClasses}  ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            Historique
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
