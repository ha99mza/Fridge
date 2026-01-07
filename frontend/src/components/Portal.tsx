import { ReactNode, useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface PortalProps {
  children: ReactNode
}

export function Portal({ children }: PortalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let root = document.getElementById("portal-root")
    
    if (!root) {
      root = document.createElement("div")
      root.id = "portal-root"
      document.body.appendChild(root)
    }
    
    setPortalRoot(root)
    
    return () => {
      // Don't remove the portal root on unmount, keep it for reuse
    }
  }, [])

  if (!portalRoot) {
    return null
  }

  return createPortal(children, portalRoot)
}
