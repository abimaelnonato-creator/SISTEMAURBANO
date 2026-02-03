import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  Settings,
  Map,
  MessageSquare,
  Plus,
  Clock,
  AlertTriangle,
  Command,
  Hash,
  Sparkles,
  Network,
  Database,
  Monitor,
  Boxes,
  Shield,
  ListOrdered,
  Sun,
  Moon,
  BarChart3,
  Brain,
  Layers,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

type CommandIcon = React.ComponentType<{ className?: string }>

type CommandItem = {
  id: string
  title: string
  subtitle?: string
  icon: CommandIcon
  action: () => void
  category: string
  keywords?: string[]
  shortcut?: string
}

export function CommandPalette() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const commands = useMemo<CommandItem[]>(
    () => [
      { id: 'dashboard', title: 'Ir para Dashboard', icon: LayoutDashboard, action: () => navigate('/'), category: 'Navegação', shortcut: 'G D' },
      { id: 'demandas', title: 'Ir para Demandas', icon: FileText, action: () => navigate('/demandas'), category: 'Navegação', shortcut: 'G E' },
      { id: 'mapa', title: 'Ir para Mapa', icon: Map, action: () => navigate('/mapa'), category: 'Navegação', shortcut: 'G M' },
      { id: 'whatsapp', title: 'Ir para WhatsApp', icon: MessageSquare, action: () => navigate('/whatsapp'), category: 'Navegação', shortcut: 'G W' },
      { id: 'secretarias', title: 'Ir para Secretarias', icon: Building2, action: () => navigate('/secretarias'), category: 'Navegação', shortcut: 'G S' },
      { id: 'usuarios', title: 'Ir para Usuários', icon: Users, action: () => navigate('/usuarios'), category: 'Navegação', shortcut: 'G U' },
      { id: 'configuracoes', title: 'Ir para Configurações', icon: Settings, action: () => navigate('/configuracoes'), category: 'Navegação', shortcut: 'G C' },
      { id: 'relatorios', title: 'Ir para Relatórios', icon: FileText, action: () => navigate('/relatorios'), category: 'Navegação', shortcut: 'G R' },

      { id: 'nova-demanda', title: 'Nova Demanda', subtitle: 'Criar uma nova demanda manualmente', icon: Plus, action: () => navigate('/demandas/nova'), category: 'Ações', shortcut: 'N D' },
      { id: 'buscar-protocolo', title: 'Buscar Protocolo', subtitle: 'Buscar demanda por protocolo', icon: Hash, action: () => navigate('/demandas'), category: 'Ações', shortcut: '/ P' },
      { id: 'criar-relatorio', title: 'Gerar Relatório Executivo', subtitle: 'Exportar visão consolidada', icon: Sparkles, action: () => navigate('/relatorios'), category: 'Ações', keywords: ['pdf', 'exportar'] },

      { id: 'filtro-urgentes', title: 'Demandas Urgentes', subtitle: 'Prioridade crítica e alto impacto', icon: AlertTriangle, action: () => navigate('/demandas?priority=urgente'), category: 'Filtros', keywords: ['urgente', 'critica', 'crítico'] },
      { id: 'filtro-abertas', title: 'Demandas Abertas', subtitle: 'Status aberto', icon: Clock, action: () => navigate('/demandas?status=aberta'), category: 'Filtros' },
      { id: 'filtro-hoje', title: 'Demandas de Hoje', subtitle: 'Criadas nas últimas 24h', icon: Clock, action: () => navigate('/demandas?period=today'), category: 'Filtros' },

      { id: 'sec-infra', title: 'Infraestrutura e Obras', icon: Building2, action: () => navigate('/secretarias'), category: 'Secretarias' },
      { id: 'sec-iluminacao', title: 'Iluminação Pública', icon: Building2, action: () => navigate('/secretarias'), category: 'Secretarias' },
      { id: 'sec-ambiente', title: 'Meio Ambiente', icon: Building2, action: () => navigate('/secretarias'), category: 'Secretarias' },
      { id: 'sec-transito', title: 'Trânsito e Mobilidade', icon: Building2, action: () => navigate('/secretarias'), category: 'Secretarias' },

      // Smart City
      { id: 'digital-twin', title: 'Gêmeo Digital 3D', subtitle: 'Twin urbano de Parnamirim', icon: Layers, action: () => navigate('/digital-twin'), category: 'Smart City', keywords: ['twin', 'palantir', 'simcity', 'parnamirim', '3d', 'real'] },
      { id: 'foundry-urbano', title: 'Foundry Urbano', subtitle: 'IA para Gestão de Infraestrutura', icon: Brain, action: () => navigate('/foundry-urbano'), category: 'Smart City', keywords: ['ia', 'infraestrutura', 'buraco', 'energia', 'enchente', 'obras', 'limpeza'] },
      { id: 'cidade-digital', title: 'Cidade Digital 3D', subtitle: 'Gêmeo digital da cidade', icon: Boxes, action: () => navigate('/cidade-digital'), category: 'Smart City', keywords: ['3d', 'twin', 'digital', 'gêmeo', 'mapa'] },
      { id: 'integracoes', title: 'Hub de Integrações', subtitle: 'Central de dados unificada', icon: Database, action: () => navigate('/integracoes'), category: 'Smart City', keywords: ['hub', 'dados', 'central'] },
      { id: 'ontologia', title: 'Ontologia Urbana', subtitle: 'Modelo digital da cidade', icon: Network, action: () => navigate('/ontologia'), category: 'Smart City', keywords: ['grafo', 'modelo', 'digital'] },
      { id: 'priorizacao', title: 'Priorização', subtitle: 'Algoritmo de score', icon: ListOrdered, action: () => navigate('/priorizacao'), category: 'Smart City' },
      { id: 'monitoramento', title: 'Monitoramento', subtitle: 'Centro de Operações', icon: Monitor, action: () => navigate('/monitoramento'), category: 'Smart City' },
      { id: 'crise', title: 'Gabinete de Crise', subtitle: 'Gestão de emergências', icon: Shield, action: () => navigate('/crise'), category: 'Smart City' },
      { id: 'assistente', title: 'Assistente IA Quimera', subtitle: 'Inteligência artificial', icon: Sparkles, action: () => navigate('/assistente'), category: 'Smart City', keywords: ['ai', 'quimera', 'chat', 'gpt'] },
    ],
    [navigate]
  )

  const filteredCommands = useMemo(() => {
    const searchLower = search.toLowerCase()
    return commands.filter((cmd) =>
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.subtitle?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower)) ||
      cmd.category.toLowerCase().includes(searchLower)
    )
  }, [commands, search])

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    }, {})
  }, [filteredCommands])

  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action()
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifierPressed = event.metaKey || event.ctrlKey
      if (isModifierPressed && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }

      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      setSearch('')
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyNavigation = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = filteredCommands.length
    if (!totalItems) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % totalItems)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const cmd = filteredCommands[selectedIndex]
      if (cmd) {
        executeCommand(cmd)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/90 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyNavigation}
            placeholder="Buscar comandos, páginas e ações"
            className="h-10 w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            autoFocus
          />
          <div className="hidden items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:flex">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            Tema: {theme}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-3">
          {Object.entries(groupedCommands).map(([category, items]) => (
            <div key={category} className="mb-4 last:mb-0">
              <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {category}
              </div>
              <div className="space-y-2">
                {items.map((cmd) => {
                  const iconIndex = filteredCommands.indexOf(cmd)
                  const isSelected = iconIndex === selectedIndex
                  const Icon = cmd.icon
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary-900 dark:bg-primary/20 dark:text-primary-50'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <span className={cn(
                        'mt-1 flex h-10 w-10 items-center justify-center rounded-lg border text-slate-600 dark:text-slate-200',
                        isSelected ? 'border-primary/40 bg-primary/5 dark:border-primary/40' : 'border-slate-200 dark:border-slate-700'
                      )}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium leading-tight">{cmd.title}</span>
                          {cmd.shortcut && (
                            <span className="hidden items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline-flex">
                              {cmd.shortcut}
                            </span>
                          )}
                        </div>
                        {cmd.subtitle && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{cmd.subtitle}</p>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-2 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <Search className="h-5 w-5" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Tente outros termos ou palavras-chave</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
