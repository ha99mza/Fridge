import { Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import CurrentTemperature from "./pages/CurrentTemperature"
import History from "./pages/History"

function App() {

  return (
    /* <div className="min-h-screen flex flex-col  from-slate-900 to-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-3xl">
          <Routes>
            <Route path="/" element={<Navigate to="/current" replace />} />
            <Route path="/current" element={<CurrentTemperature />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </main>
    </div> */
    
    <div
      className="w-[1024px] h-[600px] bg-blue-500 flex items-center justify-center"
    >
      <div className="w-2/3 h-1/3 bg-sky-50 flex items-center justify-center">
        <h1 style={{ color: "black", textAlign: "center" }}>Frdige Desktop App</h1>
      </div>
      
    </div>
    
  )
}

export default App;
