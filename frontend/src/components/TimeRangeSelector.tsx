type RangeId = "1h" | "1d" | "1w"

interface TimeRangeSelectorProps {
  value: RangeId
  onChange: (value: RangeId) => void
}

const OPTIONS: { id: RangeId; label: string }[] = [
  { id: "1h", label: "Dernière heure" },
  { id: "1d", label: "Dernier jour" },
  { id: "1w", label: "Dernière semaine" },
]

export default function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-full bg-slate-900/80 border border-slate-700 p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1 text-xs md:text-sm rounded-full transition-colors ${
              active
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800/70"
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
