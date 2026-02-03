
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const keyBuffer = useRef<string[]>([])
  const bufferTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: Shortcut[] = [
    { key: 'g d', action: () => navigate('/'), description: 'Ir para Dashboard' },
    { key: 'g e', action: () => navigate('/demandas'), description: 'Ir para Demandas' },
    { key: 'g m', action: () => navigate('/mapa'), description: 'Ir para Mapa' },
    { key: 'g s', action: () => navigate('/secretarias'), description: 'Ir para Secretarias' },
    { key: 'g w', action: () => navigate('/whatsapp'), description: 'Ir para WhatsApp' },
    { key: 'g u', action: () => navigate('/usuarios'), description: 'Ir para Usuários' },
    { key: 'g c', action: () => navigate('/configuracoes'), description: 'Ir para Configurações' },
    { key: 'g r', action: () => navigate('/relatorios'), description: 'Ir para Relatórios' },

    { key: 'n d', action: () => navigate('/demandas/nova'), description: 'Nova Demanda' },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search]')
        searchInput?.focus()
      },
      description: 'Focar busca',
    },
    { key: '?', shift: true, action: () => setShowHelp((prev) => !prev), description: 'Mostrar atalhos' },
  ]

  const resetBuffer = useCallback(() => {
    keyBuffer.current = []
    if (bufferTimer.current) {
      clearTimeout(bufferTimer.current)
      bufferTimer.current = null
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const ignoredTags = ['INPUT', 'TEXTAREA', 'SELECT']
      if (ignoredTags.includes(target.tagName) || target.isContentEditable) {
        return
      }

      const key = event.key.toLowerCase()

      if (bufferTimer.current) {
        clearTimeout(bufferTimer.current)
      }

      keyBuffer.current.push(key)
      const sequence = keyBuffer.current.join(' ')

      const matched = shortcuts.find((shortcut) => {
        const requiresCtrl = shortcut.ctrl ?? false
        const requiresShift = shortcut.shift ?? false
        const requiresAlt = shortcut.alt ?? false

        if (requiresCtrl !== event.ctrlKey) return false
        if (requiresShift !== event.shiftKey) return false
        if (requiresAlt !== event.altKey) return false

        return shortcut.key === sequence
      })

      if (matched) {
        event.preventDefault()
        matched.action()
        resetBuffer()
        return
      }

      const partialMatch = shortcuts.some((shortcut) => shortcut.key.startsWith(sequence + ' '))
      if (partialMatch) {
        bufferTimer.current = setTimeout(resetBuffer, 1000)
      } else {
        resetBuffer()
      }
    },
    [resetBuffer, shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      resetBuffer()
    }
  }, [handleKeyDown, resetBuffer])

  return { shortcuts, showHelp, setShowHelp }
}
