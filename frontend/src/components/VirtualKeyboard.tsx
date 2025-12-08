import { useEffect, useMemo, useRef, useState } from "react"
import Keyboard from "react-simple-keyboard"
import type { KeyboardReactInterface } from "react-simple-keyboard"

type KeyboardMode = "text" | "numeric"

interface VirtualKeyboardProps {
  visible: boolean
  value: string
  mode?: KeyboardMode
  onChange: (nextValue: string) => void
  onClose: () => void
}

const TEXT_LAYOUT = {
  default: [
    "1 2 3 4 5 6 7 8 9 0",
    "a z e r t y u i o p",
    "q s d f g h j k l m",
    "{shift} w x c v b n {bksp}",
    "{space} {close}",
  ],
  shift: [
    "/ - _ @ # : , . $ &",
    "A Z E R T Y U I O P",
    "Q S D F G H J K L M",
    "{shift} W X C V B N {bksp}",
    "{space} {close}",
  ],
}

const NUMERIC_LAYOUT = {
  default: ["1 2 3", "4 5 6", "7 8 9", "- 0 .", "{bksp} {close}"],
}

export function VirtualKeyboard({
  visible,
  value,
  mode = "text",
  onChange,
  onClose,
}: VirtualKeyboardProps) {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const [layoutName, setLayoutName] = useState<"default" | "shift">("default")

  useEffect(() => {
    setLayoutName("default")
  }, [mode])

  useEffect(() => {
    keyboardRef.current?.setInput(value ?? "")
  }, [value])

  const layout = useMemo(() => (mode === "numeric" ? NUMERIC_LAYOUT : TEXT_LAYOUT), [mode])

  const handleKeyPress = (button: string) => {
    if (button === "{shift}") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"))
    }
    if (button === "{close}") {
      onClose()
    }
  }

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 z-20 transition-all duration-200 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto max-w-4xl rounded-t-2xl bg-slate-900/90 backdrop-blur border border-slate-800/80 shadow-2xl p-3">
       {/*  <div className="flex items-center justify-between text-sm text-slate-200 mb-2 px-1">
          <span>Clavier virtuel</span>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
            onClick={onClose}
          >
            Fermer
          </button>
        </div> */}
        <Keyboard
          keyboardRef={(r: KeyboardReactInterface) => (keyboardRef.current = r)}
          layout={layout}
          layoutName={layoutName}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default hg-layout-default keyboard-dark"
          display={{
            "{bksp}": "Retour",
            "{space}": "Espace",
            "{shift}": "Shift",
            "{close}": "Fermer",
          }}
        />
      </div>
    </div>
  )
}
