import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Brain,
  Car,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Clock,
  Construction,
  Cpu,
  DollarSign,
  Download,
  Droplets,
  Eye,
  Filter,
  HardHat,
  Lightbulb,
  MapPin,
  Navigation,
  Pause,
  Play,
  Radio,
  Route,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency } from '@/lib/utils'

type IncidentType = 'buraco' | 'energia' | 'enchente' | 'transito' | 'obra' | 'limpeza'
type IncidentStatus = 'novo' | 'analisando' | 'em_atendimento' | 'resolvido'
type Priority = 'critica' | 'alta' | 'media' | 'baixa'

interface Incident {
  id: string
  type: IncidentType
  title: string
  description: string
  location: {
    address: string
    neighborhood: string
    lat: number
    lng: number
  }
  status: IncidentStatus
  priority: Priority
  aiScore: number
  createdAt: string
  estimatedCost: number
  estimatedTime: number
  affectedPeople: number
  riskLevel: number
  assignedTeam?: string
  recommendations: string[]
}

interface Team {
  id: string
  name: string
  type: 'obras' | 'eletrica' | 'limpeza' | 'transito' | 'emergencia'
  status: 'disponivel' | 'em_campo' | 'retornando'
  members: number
  currentLocation: string
  vehicleType: string
  activeIncidents: number
}

interface AIRecommendation {
  id: string
  incidentId: string
  type: 'prioridade' | 'rota' | 'custo' | 'recurso' | 'previsao'
  title: string
  description: string
  impact: 'alto' | 'medio' | 'baixo'
  confidence: number
  savings?: number
  timeReduction?: number
}

const mockIncidents: Incident[] = [
  {
    id: 'inc-001',
    type: 'buraco',
    title: 'Buraco crítico na Av. Principal',
    description: 'Cratera com 3m de diâmetro, risco para tráfego de ônibus e ambulâncias.',
    location: {
      address: 'Av. Abel Cabral, 1234',
      neighborhood: 'Nova Parnamirim',
      lat: -5.9123,
      lng: -35.2721,
    },
    status: 'analisando',
    priority: 'critica',
    aiScore: 92,
    createdAt: 'Há 12 min',
    estimatedCost: 35000,
    estimatedTime: 180,
    affectedPeople: 1200,
    riskLevel: 8,
    assignedTeam: 'Equipe Obras 02',
    recommendations: [
      'Isolar trecho com cavaletes e sinalização luminosa',
      'Redirecionar trânsito pesado para Av. Ayrton Senna',
      'Equipe de solo e asfalto em rota (15min)',
    ],
  },
  {
    id: 'inc-002',
    type: 'energia',
    title: 'Queda de energia no Centro',
    description: 'Bloco comercial sem energia, risco de pane em semáforos próximos.',
    location: {
      address: 'Rua Ten. Pedro, 450',
      neighborhood: 'Centro',
      lat: -5.9156,
      lng: -35.2742,
    },
    status: 'em_atendimento',
    priority: 'alta',
    aiScore: 87,
    createdAt: 'Há 25 min',
    estimatedCost: 18000,
    estimatedTime: 90,
    affectedPeople: 850,
    riskLevel: 7,
    assignedTeam: 'Equipe Elétrica 01',
    recommendations: [
      'Priorizar religamento de semáforos',
      'Disparar alerta de economia de energia para região',
      'Sincronizar com concessionária para status em tempo real',
    ],
  },
  {
    id: 'inc-003',
    type: 'enchente',
    title: 'Ponto de alagamento na BR-101',
    description: 'Acúmulo de água bloqueando faixa da direita, risco de aquaplanagem.',
    location: {
      address: 'BR-101, km 154',
      neighborhood: 'Emaús',
      lat: -5.9201,
      lng: -35.2789,
    },
    status: 'novo',
    priority: 'alta',
    aiScore: 78,
    createdAt: 'Há 5 min',
    estimatedCost: 22000,
    estimatedTime: 60,
    affectedPeople: 2300,
    riskLevel: 6,
    recommendations: [
      'Enviar equipe de drenagem e sucção',
      'Acionar DER para apoio e cones',
      'Rota alternativa: Marginal leste por 40 min',
    ],
  },
  {
    id: 'inc-004',
    type: 'transito',
    title: 'Semáforo intermitente na Av. Maria Lacerda',
    description: 'Semáforo piscando amarelo, risco de colisões em horário de pico.',
    location: {
      address: 'Av. Maria Lacerda, 890',
      neighborhood: 'Nova Parnamirim',
      lat: -5.9183,
      lng: -35.2705,
    },
    status: 'em_atendimento',
    priority: 'media',
    aiScore: 72,
    createdAt: 'Há 40 min',
    estimatedCost: 8000,
    estimatedTime: 45,
    affectedPeople: 1400,
    riskLevel: 5,
    assignedTeam: 'Trânsito 01',
    recommendations: [
      'Agentes no local para fluidez temporária',
      'Revisão elétrica e troca de relé',
      'Comunicar Waze/Google Maps sobre atenção redobrada',
    ],
  },
  {
    id: 'inc-005',
    type: 'obra',
    title: 'Obra emergencial de contenção',
    description: 'Talude instável após chuva forte, risco de deslizamento.',
    location: {
      address: 'Rua das Flores, 210',
      neighborhood: 'Parque de Exposições',
      lat: -5.9244,
      lng: -35.2802,
    },
    status: 'analisando',
    priority: 'alta',
    aiScore: 75,
    createdAt: 'Há 18 min',
    estimatedCost: 48000,
    estimatedTime: 240,
    affectedPeople: 320,
    riskLevel: 7,
    recommendations: [
      'Isolar encosta em 30m',
      'Topografia rápida para avaliar volume',
      'Redirecionar pedestres para via paralela',
    ],
  },
  {
    id: 'inc-006',
    type: 'limpeza',
    title: 'Acúmulo de lixo em via coletora',
    description: 'Risco de entupimento de bueiros e vetores em área escolar.',
    location: {
      address: 'Av. Bom Pastor, 560',
      neighborhood: 'Rosa dos Ventos',
      lat: -5.9271,
      lng: -35.2768,
    },
    status: 'novo',
    priority: 'media',
    aiScore: 64,
    createdAt: 'Há 55 min',
    estimatedCost: 6000,
    estimatedTime: 35,
    affectedPeople: 420,
    riskLevel: 4,
    recommendations: [
      'Despachar varrição e recolhimento imediato',
      'Lavagem leve após recolhimento',
      'Alertar população sobre descarte irregular',
    ],
  },
]

const mockTeams: Team[] = [
  { id: 'team-01', name: 'Equipe Obras 01', type: 'obras', status: 'disponivel', members: 5, currentLocation: 'Emaús', vehicleType: 'Caminhão + Bobcat', activeIncidents: 1 },
  { id: 'team-02', name: 'Equipe Obras 02', type: 'obras', status: 'em_campo', members: 6, currentLocation: 'Nova Parnamirim', vehicleType: 'Caminhão pipa', activeIncidents: 2 },
  { id: 'team-03', name: 'Equipe Elétrica 01', type: 'eletrica', status: 'em_campo', members: 4, currentLocation: 'Centro', vehicleType: 'Van + cesta aérea', activeIncidents: 1 },
  { id: 'team-04', name: 'Equipe Limpeza 01', type: 'limpeza', status: 'disponivel', members: 3, currentLocation: 'Rosa dos Ventos', vehicleType: 'Caminhão compactador', activeIncidents: 0 },
  { id: 'team-05', name: 'Trânsito 01', type: 'transito', status: 'retornando', members: 4, currentLocation: 'Maria Lacerda', vehicleType: 'Motos + pick-up', activeIncidents: 1 },
  { id: 'team-06', name: 'Defesa Civil', type: 'emergencia', status: 'disponivel', members: 8, currentLocation: 'Centro Administrativo', vehicleType: 'Pick-up 4x4', activeIncidents: 0 },
]

const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-01',
    incidentId: 'inc-001',
    type: 'rota',
    title: 'Rota otimizada para obras',
    description: 'Use Av. Ayrton Senna para evitar cruzamento crítico na Maria Lacerda.',
    impact: 'alto',
    confidence: 92,
    timeReduction: 18,
  },
  {
    id: 'rec-02',
    incidentId: 'inc-002',
    type: 'custo',
    title: 'Reduzir custos de restabelecimento',
    description: 'Acione grupo gerador do município para comércios essenciais.',
    impact: 'medio',
    confidence: 81,
    savings: 12500,
  },
  {
    id: 'rec-03',
    incidentId: 'inc-003',
    type: 'prioridade',
    title: 'Escalonar drenagem',
    description: 'Risco de agravamento em 40min se chuva persistir.',
    impact: 'alto',
    confidence: 88,
    timeReduction: 12,
  },
  {
    id: 'rec-04',
    incidentId: 'inc-005',
    type: 'recurso',
    title: 'Refôrço de contenção',
    description: 'Disponibilizar contenção provisória e lona reforçada.',
    impact: 'medio',
    confidence: 75,
    savings: 7200,
  },
  {
    id: 'rec-05',
    incidentId: 'inc-004',
    type: 'previsao',
    title: 'Janela de pico em 18min',
    description: 'Fluxo aumenta 22% às 18h10, priorizar correção antes disso.',
    impact: 'alto',
    confidence: 83,
    timeReduction: 8,
  },
]

const typeConfig: Record<IncidentType, { label: string; icon: React.ComponentType<any>; color: string; accent: string }> = {
  buraco: { label: 'Buracos', icon: Wrench, color: 'text-amber-200', accent: 'from-amber-500/20 via-amber-400/10 to-transparent' },
  energia: { label: 'Energia', icon: Zap, color: 'text-yellow-200', accent: 'from-yellow-500/25 via-yellow-400/10 to-transparent' },
  enchente: { label: 'Enchente', icon: Droplets, color: 'text-cyan-200', accent: 'from-cyan-500/25 via-cyan-400/10 to-transparent' },
  transito: { label: 'Trânsito', icon: Car, color: 'text-orange-200', accent: 'from-orange-500/25 via-orange-400/10 to-transparent' },
  obra: { label: 'Obras', icon: Construction, color: 'text-emerald-200', accent: 'from-emerald-500/20 via-emerald-400/10 to-transparent' },
  limpeza: { label: 'Limpeza', icon: Trash2, color: 'text-slate-200', accent: 'from-slate-400/20 via-slate-300/10 to-transparent' },
}

const statusStyles: Record<IncidentStatus, { label: string; className: string }> = {
  novo: { label: 'Novo', className: 'bg-slate-800 text-slate-100 border-slate-600' },
  analisando: { label: 'Analisando', className: 'bg-indigo-900/60 text-indigo-100 border-indigo-500/40' },
  em_atendimento: { label: 'Em atendimento', className: 'bg-amber-900/60 text-amber-100 border-amber-500/40' },
  resolvido: { label: 'Resolvido', className: 'bg-emerald-900/60 text-emerald-100 border-emerald-500/40' },
}

const priorityStyles: Record<Priority, { label: string; ring: string; text: string }> = {
  critica: { label: 'Crítica', ring: 'ring-2 ring-offset-0 ring-red-500/70', text: 'text-red-100' },
  alta: { label: 'Alta', ring: 'ring-2 ring-offset-0 ring-amber-400/70', text: 'text-amber-50' },
  media: { label: 'Média', ring: 'ring-1 ring-offset-0 ring-sky-300/60', text: 'text-sky-50' },
  baixa: { label: 'Baixa', ring: 'ring-1 ring-offset-0 ring-emerald-300/50', text: 'text-emerald-50' },
}

const gradients = {
  canvas: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
  panel: 'bg-slate-900/70 border border-white/5 shadow-[0_10px_60px_-25px_rgba(0,0,0,0.6)]',
  glass: 'bg-white/[0.02] border border-white/5 backdrop-blur',
}

const formatTime = (minutes: number) => `${minutes} min`

const trendBadge = (value: number) => (
  <div
    className={cn(
      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
      value >= 0 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/10 text-red-200'
    )}
  >
    {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
    {value}%
  </div>
)

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<any>
  trend?: number
}) => (
  <Card className={cn(gradients.panel, 'rounded-2xl relative overflow-hidden')}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/0 to-white/5" />
    <CardContent className="p-4 relative space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-slate-200">{title}</p>
          <p className="text-2xl font-semibold text-slate-50">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cyan-300">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trend !== undefined && trendBadge(trend)}
        {subtitle && <span className="text-[12px] text-slate-200">{subtitle}</span>}
      </div>
    </CardContent>
  </Card>
)

const StatusBadge = ({ status }: { status: IncidentStatus }) => {
  const style = statusStyles[status]
  return <Badge className={cn('border px-2 py-0.5 text-[11px]', style.className)}>{style.label}</Badge>
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const style = priorityStyles[priority]
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-white/5', style.ring, style.text)}>
      <Sparkles className="w-3 h-3" />
      {style.label}
    </div>
  )
}

const TypePill = ({ type }: { type: IncidentType }) => {
  const config = typeConfig[type]
  const Icon = config.icon
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium border border-white/5', config.color)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  )
}

const IncidentCard = ({ incident, isSelected, onClick }: { incident: Incident; isSelected: boolean; onClick: () => void }) => {
  const config = typeConfig[incident.type]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl p-3 transition-all border group',
        gradients.glass,
        'hover:border-cyan-400/60 hover:shadow-[0_10px_50px_-35px_rgba(34,211,238,0.8)]',
        isSelected && 'border-cyan-400/60 bg-cyan-500/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-gradient-to-br', config.accent, 'border border-white/10')}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <CircleDot className="w-3 h-3 text-cyan-300 absolute -top-1 -right-1" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={incident.priority} />
            <StatusBadge status={incident.status} />
            <TypePill type={incident.type} />
          </div>
          <p className="text-sm font-semibold text-slate-50 line-clamp-1">{incident.title}</p>
          <p className="text-xs text-slate-200 line-clamp-2">{incident.description}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-200">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{incident.location.address}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-semibold text-cyan-300">{incident.aiScore}</div>
          <div className="text-[11px] text-slate-200">Score IA</div>
        </div>
      </div>
    </button>
  )
}

const AIChat = ({ selectedIncident }: { selectedIncident: Incident | null }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Posso otimizar rotas, custos e priorização das equipes.' },
    { role: 'assistant', content: 'Selecione um incidente para recomendações direcionadas.' },
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', content: input.trim() }])
    setInput('')
  }

  return (
    <Card className={cn(gradients.panel, 'h-full rounded-2xl flex flex-col')}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/30 via-cyan-400/20 to-white/5 flex items-center justify-center border border-cyan-400/40">
            <Brain className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <CardTitle className="text-sm">Quimera IA</CardTitle>
            <CardDescription className="text-[11px]">Assistente tático em tempo real</CardDescription>
          </div>
        </div>
        <Badge variant="outline" className="border-cyan-400/50 text-cyan-200 text-[11px]">
          <Radio className="w-3 h-3 mr-1" /> AO VIVO
        </Badge>
      </CardHeader>
      <Separator className="bg-white/5" />
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-3 space-y-3">
          {selectedIncident && (
            <div className="text-[12px] text-slate-200 bg-cyan-500/10 border border-cyan-400/40 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-cyan-200 mb-1">
                <Target className="w-3 h-3" />
                Foco atual
              </div>
              {selectedIncident.title}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-xl px-3 py-2 text-sm border max-w-[90%]',
                msg.role === 'assistant'
                  ? 'bg-white/5 border-white/5 text-slate-100'
                  : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-50 ml-auto'
              )}
            >
              {msg.content}
            </div>
          ))}
        </ScrollArea>
        <div className="p-3 border-t border-white/5 space-y-2 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-200 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte sobre rotas, custos, priorização..."
                className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
              />
            </div>
            <Button size="sm" className="h-10 px-3" onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {['Priorizar críticos', 'Rotas mais rápidas', 'Custo mínimo', 'Equipes livres'].map((chip) => (
              <button
                key={chip}
                className="px-2 py-1 rounded-full border border-white/10 text-slate-200 hover:border-cyan-400/60 hover:text-cyan-100 transition"
                onClick={() => setInput(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FoundryUrbanoPage() {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(mockIncidents[0])
  const [filterType, setFilterType] = useState<IncidentType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'all'>('all')
  const [isLive, setIsLive] = useState(true)
  const [showRecommendations, setShowRecommendations] = useState(true)

  const stats = useMemo(() => {
    const total = mockIncidents.length
    const criticos = mockIncidents.filter((i) => i.priority === 'critica').length
    const emAtendimento = mockIncidents.filter((i) => i.status === 'em_atendimento').length
    const custoTotal = mockIncidents.reduce((acc, i) => acc + i.estimatedCost, 0)
    const tempoMedio = Math.round(mockIncidents.reduce((acc, i) => acc + i.estimatedTime, 0) / total)
    const afetadosTotal = mockIncidents.reduce((acc, i) => acc + i.affectedPeople, 0)
    const equipesDisponiveis = mockTeams.filter((t) => t.status === 'disponivel').length
    return { total, criticos, emAtendimento, custoTotal, tempoMedio, afetadosTotal, equipesDisponiveis }
  }, [])

  const filteredIncidents = useMemo(() => {
    return mockIncidents
      .filter((incident) => {
        if (filterType !== 'all' && incident.type !== filterType) return false
        if (filterStatus !== 'all' && incident.status !== filterStatus) return false
        return true
      })
      .sort((a, b) => b.aiScore - a.aiScore)
  }, [filterType, filterStatus])

  const potentialSavings = useMemo(() => {
    return mockAIRecommendations
      .filter((r) => r.savings)
      .reduce((acc, r) => acc + (r.savings || 0), 0)
  }, [])

  return (
    <div className={cn(gradients.canvas, 'min-h-screen text-white')}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className={cn(gradients.panel, 'rounded-3xl p-4 sm:p-5 border-white/10 flex flex-col gap-4')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/80 via-sky-400/60 to-indigo-500/50 border border-white/10 shadow-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">Foundry Urbano</h1>
                <p className="text-sm text-slate-100">IA operacional para infraestrutura urbana</p>
              </div>
              <Badge variant="outline" className="border-cyan-400/60 text-cyan-200 text-[11px] ml-2">
                <Sparkles className="w-3 h-3 mr-1" /> Quimera
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLive ? 'default' : 'outline'}
                size="sm"
                className={cn('h-9 px-3 text-xs', isLive && 'bg-emerald-600 hover:bg-emerald-700 border-none')}
                onClick={() => setIsLive((p) => !p)}
              >
                {isLive ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                {isLive ? 'Ao vivo' : 'Pausado'}
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative border border-white/5">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                  {stats.criticos}
                </span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 border border-white/5">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <MetricCard title="Ocorrências" value={stats.total} icon={AlertTriangle} subtitle="Ativas hoje" trend={4} />
            <MetricCard title="Críticas" value={stats.criticos} icon={Shield} subtitle="Prioridade máxima" trend={-2} />
            <MetricCard title="Atendimento" value={stats.emAtendimento} icon={Wrench} subtitle="Em campo" trend={6} />
            <MetricCard title="Equipes" value={`${stats.equipesDisponiveis}/${mockTeams.length}`} icon={Users} subtitle="Disponíveis" trend={3} />
            <MetricCard title="Custo Est." value={formatCurrency(stats.custoTotal)} icon={DollarSign} subtitle="Somado" trend={-5} />
            <MetricCard title="Tempo Médio" value={`${formatTime(stats.tempoMedio)}`} icon={Timer} subtitle="Por chamado" trend={-7} />
            <MetricCard title="Economia IA" value={formatCurrency(potentialSavings)} icon={TrendingDown} subtitle="Identificada" trend={12} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-4">
            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10')}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Monitoramento</CardTitle>
                  <CardDescription>Filtre e ordene os incidentes</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 border border-white/5">
                  <Filter className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    className="bg-slate-900/70 border border-white/10 rounded-xl px-3 py-2 text-sm min-w-[140px]"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as IncidentType | 'all')}
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="buraco">Buracos</option>
                    <option value="energia">Energia</option>
                    <option value="enchente">Enchentes</option>
                    <option value="transito">Trânsito</option>
                    <option value="obra">Obras</option>
                    <option value="limpeza">Limpeza</option>
                  </select>
                  <select
                    className="bg-slate-900/70 border border-white/10 rounded-xl px-3 py-2 text-sm min-w-[140px]"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | 'all')}
                  >
                    <option value="all">Todos os status</option>
                    <option value="novo">Novos</option>
                    <option value="analisando">Analisando</option>
                    <option value="em_atendimento">Em Atendimento</option>
                    <option value="resolvido">Resolvidos</option>
                  </select>
                  <Button variant="outline" size="sm" className="border-white/10 h-10 px-3">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-slate-200">
                  <Search className="w-4 h-4 text-slate-200" />
                  Sugestão: priorize incidentes com AI Score alto e risco {'>='} 7
                </div>
              </CardContent>
            </Card>

            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10 h-[520px] flex flex-col')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-300" />
                    Incidentes em tempo real
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] border-white/10">
                    {filteredIncidents.length} ativos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[460px] px-3 pb-3 space-y-2">
                  {filteredIncidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      isSelected={selectedIncident?.id === incident.id}
                      onClick={() => setSelectedIncident(incident)}
                    />
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10 min-h-[360px]')}>
              {selectedIncident ? (
                <>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={selectedIncident.priority} />
                          <StatusBadge status={selectedIncident.status} />
                          <TypePill type={selectedIncident.type} />
                        </div>
                        <CardTitle className="text-lg leading-tight">{selectedIncident.title}</CardTitle>
                        <CardDescription className="text-sm text-slate-200">{selectedIncident.description}</CardDescription>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-200">Score IA</p>
                        <p className="text-3xl font-bold text-cyan-300">{selectedIncident.aiScore}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex items-center gap-2 text-slate-200 text-sm mb-1">
                          <MapPin className="w-4 h-4" /> Localização
                        </div>
                        <p className="text-sm text-slate-100">{selectedIncident.location.address}</p>
                        <p className="text-xs text-slate-200">{selectedIncident.location.neighborhood}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5">
                        <div className="flex items-center gap-2 text-slate-200 text-sm mb-1">
                          <Clock className="w-4 h-4" /> Criado
                        </div>
                        <p className="text-sm text-slate-100">{selectedIncident.createdAt}</p>
                        <p className="text-xs text-slate-200">{formatTime(selectedIncident.estimatedTime)} estimados</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-200 text-xs">
                          <Users className="w-4 h-4" /> Afetados
                        </div>
                        <p className="text-lg font-semibold text-white">{selectedIncident.affectedPeople.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-slate-200 text-xs">
                          <AlertTriangle className="w-4 h-4" /> Risco
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedIncident.riskLevel * 10} className="h-2 flex-1" />
                          <span className="text-lg font-semibold">{selectedIncident.riskLevel}/10</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-200 text-xs">
                          <DollarSign className="w-4 h-4" /> Custo
                        </div>
                        <p className="text-lg font-semibold text-white">{formatCurrency(selectedIncident.estimatedCost)}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-200 text-xs">
                          <Timer className="w-4 h-4" /> Tempo
                        </div>
                        <p className="text-lg font-semibold text-white">{formatTime(selectedIncident.estimatedTime)}</p>
                      </div>
                    </div>

                    {selectedIncident.assignedTeam && (
                      <div className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 flex items-center gap-2 text-emerald-50">
                        <HardHat className="w-4 h-4" />
                        Equipe: {selectedIncident.assignedTeam}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-[0.08em] text-slate-200 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-cyan-300" /> Recomendações da IA
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {selectedIncident.recommendations.map((rec, i) => (
                          <div key={i} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm flex gap-2">
                            <CheckCircle className="w-4 h-4 text-cyan-300 mt-0.5" />
                            <span className="text-slate-100">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button className="w-full" size="sm">
                        <Truck className="w-4 h-4 mr-1" /> Designar equipe
                      </Button>
                      <Button variant="outline" size="sm" className="border-white/10">
                        <Route className="w-4 h-4 mr-1" /> Ver rota
                      </Button>
                      <Button variant="ghost" size="sm" className="border border-white/5">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-10 text-center text-slate-200 flex flex-col items-center gap-3">
                  <AlertTriangle className="w-10 h-10 text-slate-200" />
                  Selecione um incidente para ver detalhes
                </CardContent>
              )}
            </Card>

            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10')}>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-300" /> Insights da IA
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRecommendations((p) => !p)}>
                  {showRecommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CardHeader>
              {showRecommendations && (
                <CardContent className="space-y-2">
                  {mockAIRecommendations.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className={cn(
                        'p-3 rounded-xl border transition hover:border-cyan-400/60',
                        rec.impact === 'alto'
                          ? 'bg-cyan-500/10 border-cyan-400/40'
                          : rec.impact === 'medio'
                          ? 'bg-white/5 border-white/5'
                          : 'bg-white/2 border-white/5'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[11px] border-white/10">
                          {rec.type === 'rota' && <Route className="w-3 h-3 mr-1" />}
                          {rec.type === 'prioridade' && <Target className="w-3 h-3 mr-1" />}
                          {rec.type === 'custo' && <DollarSign className="w-3 h-3 mr-1" />}
                          {rec.type === 'recurso' && <Users className="w-3 h-3 mr-1" />}
                          {rec.type === 'previsao' && <Clock className="w-3 h-3 mr-1" />}
                          {rec.confidence}%
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{rec.title}</p>
                          <p className="text-xs text-slate-200 mt-0.5">{rec.description}</p>
                          {(rec.savings || rec.timeReduction) && (
                            <div className="flex gap-3 mt-2 text-[12px]">
                              {rec.savings && <span className="text-emerald-300">💰 {formatCurrency(rec.savings)}</span>}
                              {rec.timeReduction && <span className="text-blue-300">⏱️ -{rec.timeReduction} min</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="h-[360px]">
              <AIChat selectedIncident={selectedIncident} />
            </div>

            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10')}>
              <CardHeader className="pb-2 flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-emerald-300" /> Equipes
                </CardTitle>
                <Badge variant="outline" className="text-[11px] border-white/10">
                  {mockTeams.filter((t) => t.status === 'disponivel').length} livres
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {mockTeams.map((team) => (
                  <div
                    key={team.id}
                    className={cn(
                      'p-3 rounded-xl border text-sm flex flex-col gap-1',
                      team.status === 'disponivel'
                        ? 'bg-emerald-500/10 border-emerald-400/40'
                        : team.status === 'em_campo'
                        ? 'bg-amber-500/10 border-amber-400/40'
                        : 'bg-white/5 border-white/5'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-white">{team.name}</p>
                        <p className="text-xs text-slate-200">{team.currentLocation}</p>
                      </div>
                      <Badge variant="outline" className="text-[11px] border-white/10">
                        {team.status === 'disponivel' ? 'Livre' : team.status === 'em_campo' ? 'Em campo' : 'Retornando'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-200">
                      <Users className="w-3 h-3" /> {team.members} pessoas
                      <span className="text-slate-200">•</span>
                      <Truck className="w-3 h-3" /> {team.vehicleType}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={cn(gradients.panel, 'rounded-2xl border-white/10')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-300" /> Saúde do sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Radio className="w-4 h-4 text-emerald-300" /> Streaming de sensores
                  </div>
                  <Badge className="bg-emerald-600 text-xs">Estável</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <BarChart3 className="w-4 h-4 text-blue-300" /> Telemetria urbana
                  </div>
                  <Badge variant="outline" className="text-[11px] border-white/10">98% uptime</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Navigation className="w-4 h-4 text-amber-300" /> Rotas dinâmicas
                  </div>
                  <Badge variant="outline" className="text-[11px] border-white/10">Ativo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoundryUrbanoPage
