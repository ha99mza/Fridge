import { useEffect, useMemo, useState } from "react"
import { Portal } from "./Portal"

type KeyboardMode = "text" | "numeric"

interface VirtualKeyboardProps {
  visible: boolean
  value: string
  mode?: KeyboardMode
  onChange: (nextValue: string) => void
  onClose: () => void
}

type LayoutName = "default" | "shift"

const TEXT_LAYOUT: Record<LayoutName, string[][]> = {
  default: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
    ["shift", "w", "x", "c", "v", "b", "n", "bksp"],
    ["space", "close"],
  ],
  shift: [
    ["/", "-", "_", "@", "#", ":", ",", ".", "$", "&"],
    ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
    ["shift", "W", "X", "C", "V", "B", "N", "bksp"],
    ["space", "close"],
  ],
}

const NUMERIC_LAYOUT: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["-", "0", "."],
  ["bksp", "close"],
]

const LABELS: Record<string, string> = {
  shift: "Shift",
  bksp: "Retour",
  space: "Espace",
  close: "Fermer",
}

const SPECIAL_KEYS = new Set(["shift", "bksp", "space", "close"])

export function VirtualKeyboard({
  visible,
  value,
  mode = "text",
  onChange,
  onClose,
}: VirtualKeyboardProps) {
  const [layoutName, setLayoutName] = useState<LayoutName>("default")

  useEffect(() => {
    if (!visible) return
    setLayoutName("default")
    
    // Prevent scrolling when keyboard is visible
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [visible])

  const rows = useMemo(() => {
    if (mode === "numeric") return NUMERIC_LAYOUT
    return TEXT_LAYOUT[layoutName]
  }, [mode, layoutName])

  const handlePress = (key: string) => {
    const current = value ?? ""

    if (key === "shift") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"))
      return
    }
    if (key === "close") {
      onClose()
      return
    }
    if (key === "bksp") {
      onChange(current.slice(0, -1))
      return
    }
    if (key === "space") {
      onChange(`${current} `)
      return
    }

    onChange(`${current}${key}`)
  }

  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    const isSpecial = SPECIAL_KEYS.has(key)
    const isWide = key === "space"
    const isAction = key === "close"
    const isBackspace = key === "bksp"

    return (
      <button
        key={`${rowIndex}-${keyIndex}-${key}`}
        type="button"
        onClick={() => handlePress(key)}
        className={[
          "select-none rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
          "bg-slate-900/70 border-slate-700 text-white hover:bg-slate-800 active:bg-sky-500 active:text-slate-950",
          isSpecial ? "bg-slate-950/70 text-slate-200" : "",
          isWide ? "flex-2" : "flex-1",
          isBackspace ? "flex-[1.2]" : "",
          isAction ? "bg-sky-500/20 border-sky-500/40 text-sky-100 hover:bg-sky-500/30" : "",
        ].join(" ")}
      >
        {LABELS[key] ?? key}
      </button>
    )
  }

  return (
    <>
      {visible && (
        <Portal>
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          
          {/* Keyboard container */}
          <div className="fixed left-0 right-0 bottom-0 z-50 w-full pointer-events-auto">
            <div className="mx-auto max-w-4xl rounded-t-2xl bg-slate-900/95 backdrop-blur border border-t border-slate-800/80 shadow-2xl p-3">
              <div className="flex items-center justify-between text-sm text-slate-200 mb-2 px-1">
                <span>Clavier virtuel</span>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  onClick={onClose}
                >
                  Fermer
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {rows.map((row, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="flex gap-2 justify-center">
                    {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
