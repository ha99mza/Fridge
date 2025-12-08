import { NavLink } from "react-router-dom"
import { Cloud, Wifi} from "lucide-react"

export default function Navbar() {
  const baseClasses =
    "px-6 py-3 rounded-full text-base lg:text-lg font-semibold transition-colors"
  const activeClasses = "bg-sky-500 text-white shadow-lg"
  const inactiveClasses =
    "text-slate-200 hover:text-white hover:bg-slate-800/80"

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + titre */}
        <div className="flex items-center gap-3">
         {/*  <div className="h-12 w-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-extrabold text-xl">
            R
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-semibold text-white leading-tight">
              Réfrigérateur
            </h1>
          
             <p className="text-xs text-slate-400">Surveillance en temps réel</p> 
          </div> */}
        </div>

        {/* Liens de navigation */}
        <nav className="flex items-center gap-3">
          <NavLink
            to="/current"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            Température actuelle
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            Historique
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
          >
            Réglages
          </NavLink> 
          <span className="h-8 w-1 bg-slate-700 mx-1" />
          <span >
                <Cloud className="h-7 w-7 stroke-amber-50 " />
          </span>
          <span >
                <Wifi className="h-7 w-7 stroke-amber-50" />
          </span>
        </nav>
      </div>
    </header>
  )
}
