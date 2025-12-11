interface DeviceInfoProps {
  ip: string
  mac: string
  loading?: boolean
  error?: string
  infoMessage?: string
  onRefresh: () => void
}

export function DeviceInfo({
  ip,
  mac,
  loading,
  error,
  infoMessage,
  onRefresh,
}: DeviceInfoProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Infos de l appareil</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
            loading
              ? "border-slate-700 text-slate-400 cursor-not-allowed"
              : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
          }`}
        >
          {loading ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Adresse IP locale</p>
          <p className="text-lg text-white font-semibold mt-1">{ip || "Non disponible"}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs text-slate-400">Adresse MAC</p>
          <p className="text-lg text-white font-semibold mt-1">{mac || "Non disponible"}</p>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {infoMessage && !error && <p className="text-xs text-emerald-300">{infoMessage}</p>}
    </section>
  )
}
