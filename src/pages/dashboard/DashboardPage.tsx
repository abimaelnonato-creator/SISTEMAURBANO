import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useDemandsSocket, type DemandData } from '@/hooks/useDemandsSocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  Map,
  Signal,
  Target,
  BarChart3,
  ListOrdered,
  Monitor,
  Shield,
  Sparkles,
  MapPin,
  Zap,
  Network,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import type { Demand as StoreDemand } from '@/types'

type Summary = {
  totalDemands?: number
  openDemands?: number
  inProgressDemands?: number
  resolvedDemands?: number
  closedDemands?: number
  todayDemands?: number
  weekDemands?: number
  resolutionRate?: number
  avgResolutionTime?: number
  criticalDemands?: number
}

type Charts = {
  byDay?: { date: string; open?: number; resolved?: number; created?: number }[]
  byCategory?: { category: string; count: number }[]
  byStatus?: { status: string; count: number }[]
}

type Demand = {
  id?: string
  protocol?: string
  title: string
  category?: { name: string } | string
  status?: string
  priority?: string
  createdAt?: string
}

const CHART_COLORS = {
  primary: '#0D4A8D',
  secondary: '#FFD100',
  green: '#00A651',
  cyan: '#00AEEF',
  red: '#DC3545',
  purple: '#8B5CF6',
}

const statusLabels: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const statusClasses = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'OPEN':
      return 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200'
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
    case 'RESOLVED':
      return 'bg-green-50 text-green-900 ring-1 ring-green-200'
    case 'CLOSED':
      return 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'
    default:
      return 'bg-primary-50 text-primary-900 ring-1 ring-primary-100'
  }
}

const priorityClasses = (priority?: string) => {
  switch ((priority || '').toUpperCase()) {
    case 'LOW':
      return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200'
    case 'MEDIUM':
      return 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200'
    case 'HIGH':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
    case 'CRITICAL':
      return 'bg-red-50 text-red-900 ring-1 ring-red-200'
    default:
      return 'bg-primary-50 text-primary-900 ring-1 ring-primary-100'
  }
}

const formatDate = (value?: string | number) => {
  if (!value) return '--'
  const date = new Date(value)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
  foot,
}: {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
  tone: 'primary' | 'warning' | 'success' | 'info'
  foot?: string
}) {
  const palette: Record<string, { bg: string; icon: string; text: string }> = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-700', text: 'text-primary-900' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-700', text: 'text-amber-900' },
    success: { bg: 'bg-green-50', icon: 'text-green-700', text: 'text-green-900' },
    info: { bg: 'bg-cyan-50', icon: 'text-cyan-700', text: 'text-cyan-900' },
  }

  return (
    <Card className="border-primary-100/70 shadow-lg shadow-primary-500/5 dark:border-slate-700">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', palette[tone].bg)}>
            <Icon className={cn('h-5 w-5', palette[tone].icon)} />
          </div>
        </div>
        {foot && <p className={cn('text-xs font-semibold', palette[tone].text)}>{foot}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  // Dados já inicializados pelo App.tsx - usar seletores individuais
  const demands = useAppStore((state) => state.demands)
  const addDemand = useAppStore((state) => state.addDemand)
  const updateDemand = useAppStore((state) => state.updateDemand)
  const isLoading = useAppStore((state) => state.isLoading)

  // 🔌 WebSocket para receber demandas em tempo real
  // Callbacks simplificados - o hook usa refs internamente para evitar reconexões
  useDemandsSocket({
    onDemandCreated: (demandData: DemandData) => {
      const newDemand: StoreDemand = {
        id: demandData.id,
        protocol: demandData.protocol,
        title: demandData.title || demandData.description || 'Demanda',
        description: demandData.description || '',
        status: demandData.status?.toLowerCase() === 'open' ? 'aberta' : 'aberta',
        priority: demandData.priority?.toLowerCase() === 'high' ? 'alta' : 'media',
        source: 'whatsapp',
        address: demandData.address || '',
        neighborhood: demandData.neighborhood || '',
        latitude: demandData.latitude || -5.9,
        longitude: demandData.longitude || -35.2,
        categoryId: demandData.categoryId || '',
        category: demandData.category ? { ...demandData.category, id: '', slug: '', secretariaId: '', slaHours: 48, isActive: true } : undefined,
        secretariaId: demandData.secretaryId || '',
        citizenName: demandData.requesterName,
        citizenPhone: demandData.requesterPhone,
        createdAt: demandData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
        attachments: [],
        history: [],
        comments: [],
      }
      addDemand(newDemand)
    },
    onDemandUpdated: (demandData: DemandData) => {
      updateDemand(demandData.id, {
        status: demandData.status?.toLowerCase() === 'resolved' ? 'resolvida' : 
                demandData.status?.toLowerCase() === 'in_progress' ? 'em_andamento' : 'aberta',
        updatedAt: new Date().toISOString(),
      })
    },
    enabled: false, // DESABILITADO PARA DEBUG
    throttleMs: 3000, // 3 segundos entre atualizações para evitar piscar a tela
  })

  // Calcula summary a partir das demandas reais
  const summary = useMemo<Summary>(() => {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    const openDemands = demands.filter(d => d.status === 'aberta').length
    const inProgressDemands = demands.filter(d => d.status === 'em_andamento').length
    const resolvedDemands = demands.filter(d => d.status === 'resolvida').length
    const todayDemands = demands.filter(d => new Date(d.createdAt || 0) >= startOfToday).length
    const weekDemands = demands.filter(d => new Date(d.createdAt || 0) >= startOfWeek).length
    const criticalDemands = demands.filter(d => d.priority === 'urgente' || d.priority === 'alta').length
    
    const resolutionRate = demands.length > 0 
      ? Math.round((resolvedDemands / demands.length) * 100) 
      : 0

    return {
      totalDemands: demands.length,
      openDemands,
      inProgressDemands,
      resolvedDemands,
      closedDemands: 0,
      todayDemands,
      weekDemands,
      resolutionRate,
      avgResolutionTime: 48,
      criticalDemands,
    }
  }, [demands])

  // Demandas recentes
  const recent = useMemo<Demand[]>(() => 
    demands
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        protocol: d.protocol,
        title: d.title,
        category: d.category,
        status: d.status?.toUpperCase() === 'ABERTA' ? 'OPEN' : 
                d.status?.toUpperCase() === 'EM_ANDAMENTO' ? 'IN_PROGRESS' : 
                d.status?.toUpperCase() === 'RESOLVIDA' ? 'RESOLVED' : 'OPEN',
        priority: d.priority?.toUpperCase() === 'URGENTE' ? 'CRITICAL' :
                  d.priority?.toUpperCase() === 'ALTA' ? 'HIGH' :
                  d.priority?.toUpperCase() === 'BAIXA' ? 'LOW' : 'MEDIUM',
        createdAt: d.createdAt,
      }))
  , [demands])

  // Gera dados de gráfico a partir das demandas
  const chartsData = useMemo<Charts>(() => {
    // Agrupa por dia (últimos 7 dias)
    const last7Days: Charts['byDay'] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayDemands = demands.filter(d => 
        d.createdAt?.startsWith(dateStr)
      )
      const resolvedDay = demands.filter(d => 
        d.status === 'resolvida' && d.updatedAt?.startsWith(dateStr)
      )
      last7Days.push({
        date: dateStr,
        open: dayDemands.filter(d => d.status === 'aberta').length,
        resolved: resolvedDay.length,
        created: dayDemands.length,
      })
    }

    // Agrupa por categoria
    const categoryMap: Record<string, number> = {}
    demands.forEach(d => {
      const catName = typeof d.category === 'string' ? d.category : (d.category?.name || 'Outros')
      categoryMap[catName] = (categoryMap[catName] || 0) + 1
    })
    const byCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Agrupa por status
    const byStatus = [
      { status: 'OPEN', count: summary.openDemands || 0 },
      { status: 'IN_PROGRESS', count: summary.inProgressDemands || 0 },
      { status: 'RESOLVED', count: summary.resolvedDemands || 0 },
    ]

    return { byDay: last7Days, byCategory, byStatus }
  }, [demands, summary])

  const timelineData = useMemo(
    () =>
      chartsData?.byDay?.map((item) => ({
        date: formatDate(item.date),
        abertas: item.open ?? item.created ?? 0,
        resolvidas: item.resolved ?? 0,
      })) || [],
    [chartsData]
  )

  const categoryData = useMemo(
    () => chartsData?.byCategory?.map((item) => ({
      name: item.category,
      value: item.count,
    })) || [],
    [chartsData]
  )

  const statusData = useMemo(
    () => chartsData?.byStatus?.map((item) => ({
      name: statusLabels[item.status] || item.status,
      value: item.count,
      status: item.status,
    })) || [],
    [chartsData]
  )

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  // Só mostra loading se está carregando E não tem dados
  if (isLoading && demands.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-primary-800">
        Carregando dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-primary-100/60 bg-white shadow-2xl">
        <div className="relative isolate overflow-hidden bg-gradient-parnamirim px-6 pb-10 pt-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">SEMSUR • Serviços Urbanos • Parnamirim/RN</p>
              <h1 className="text-3xl font-bold text-white">Painel de Demandas SEMSUR</h1>
              <p className="max-w-2xl text-white/90">
                Iluminação pública, limpeza urbana, praças, mercados e drenagem. Acompanhe demandas e performance em tempo real.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-white/90">
                <Calendar className="h-4 w-4" />
                {today}
              </div>
              <div className="flex items-center gap-3 text-lg font-semibold text-white">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                {summary?.resolutionRate ?? 0}% taxa de resolução
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" asChild>
                  <Link to="/mapa">
                    <Map className="mr-2 h-4 w-4" /> Ver mapa vivo
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/demandas/nova">Nova demanda</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 px-6 pb-8 pt-6 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total de Demandas"
            value={summary?.totalDemands ?? 0}
            description={`${summary?.todayDemands ?? 0} novas hoje`}
            icon={FileText}
            tone="primary"
            foot={`${summary?.weekDemands ?? 0} na última semana`}
          />
          <SummaryCard
            title="Em Aberto"
            value={summary?.openDemands ?? 0}
            description="Aguardando atendimento"
            icon={Clock}
            tone="info"
            foot={`${summary?.inProgressDemands ?? 0} em andamento`}
          />
          <SummaryCard
            title="Resolvidas"
            value={summary?.resolvedDemands ?? 0}
            description="Demandas concluídas"
            icon={CheckCircle}
            tone="success"
            foot={`${summary?.resolutionRate ?? 0}% taxa de resolução`}
          />
          <SummaryCard
            title="Críticas"
            value={summary?.criticalDemands ?? 0}
            description="Prioridade máxima"
            icon={AlertTriangle}
            tone="warning"
            foot="Monitoramento ativo"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Demandas nos últimos dias</CardTitle>
              <CardDescription>Volume aberto x resolvido</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-secondary-200 text-secondary-900">
              {timelineData.length} dias
            </Badge>
          </CardHeader>
          <CardContent className="h-[320px] px-0 pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ left: 20, right: 20 }}>
                <defs>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip formatter={(value) => [value, 'Demandas']} />
                <Area type="monotone" dataKey="abertas" name="Abertas" stroke={CHART_COLORS.cyan} fill="url(#colorOpen)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolvidas" name="Resolvidas" stroke={CHART_COLORS.green} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Por categoria</CardTitle>
              <CardDescription>Participação no volume total</CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
              <BarChart3 className="h-4 w-4" />
              {summary?.totalDemands ?? 0} totais
            </div>
          </CardHeader>
          <CardContent className="h-[320px] px-0 pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[
                        CHART_COLORS.primary,
                        CHART_COLORS.secondary,
                        CHART_COLORS.green,
                        CHART_COLORS.cyan,
                        CHART_COLORS.purple,
                        CHART_COLORS.red,
                      ][index % 6]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status and SLA */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Status das demandas</CardTitle>
              <CardDescription>Distribuição por etapa</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary-50 text-primary-800 ring-1 ring-primary-200">
              SLA {summary?.avgResolutionTime ?? 0}h
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusData.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados de status no momento.</p>
            )}
            {statusData.map((item) => (
              <div key={item.status} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', item.status === 'RESOLVED' ? 'bg-green-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-500' : item.status === 'OPEN' ? 'bg-cyan-500' : 'bg-slate-400')} />
                    {item.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {item.value}
                    <ArrowUpRight className="h-3 w-3 text-primary-700" />
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white dark:bg-slate-900 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary-300 to-primary"
                    style={{ width: `${Math.min(100, ((item.value || 0) / (summary?.totalDemands || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,209,0,0.18),transparent_35%)]" />
          <CardHeader className="relative text-white">
            <CardTitle className="text-base">SLA & Performance</CardTitle>
            <CardDescription className="text-white/70">Indicadores críticos</CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4 text-white">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-white/70">Tempo médio de resolução</p>
                <p className="text-2xl font-bold">{summary?.avgResolutionTime ?? 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Signal className="h-4 w-4" /> SLA cumprido
                </div>
                <p className="mt-2 text-2xl font-bold">{summary?.resolutionRate ?? 0}%</p>
                <p className="text-xs text-white/70">Taxa de cumprimento</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4" /> Demandas críticas
                </div>
                <p className="mt-2 text-2xl font-bold">{summary?.criticalDemands ?? 0}</p>
                <p className="text-xs text-white/70">Priorização imediata</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent demands */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Demandas recentes</CardTitle>
            <CardDescription>Últimas movimentações registradas</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/demandas">
              Ver todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {recent.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-muted-foreground">
              Nenhuma demanda registrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/70 dark:bg-slate-800">
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Protocolo</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Título</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Categoria</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Prioridade</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm text-slate-700 dark:text-slate-200">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((demand, index) => (
                    <tr key={demand.id || demand.protocol || index} className="border-b last:border-0 hover:bg-slate-50/70">
                      <td className="px-3 py-3 font-mono text-primary-800">
                        <Link to={`/demandas/${demand.id || demand.protocol || ''}`} className="hover:underline">
                          {demand.protocol || '—'}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{demand.title}</td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                        {typeof demand.category === 'string' ? demand.category : demand.category?.name}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusClasses(demand.status))}>
                          {statusLabels[(demand.status || '').toUpperCase()] || demand.status || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', priorityClasses(demand.priority))}>
                          {priorityLabels[(demand.priority || '').toUpperCase()] || demand.priority || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(demand.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart City Quick Access */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_40%)]" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Smart City Hub
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ferramentas avançadas de gestão urbana
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link to="/ontologia" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-cyan-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-cyan-500/30 w-fit mb-3">
                  <Network className="h-5 w-5 text-cyan-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Ontologia</h4>
                <p className="text-sm text-slate-200 mt-1">Modelo digital da cidade</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-cyan-300 group-hover:text-cyan-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link to="/priorizacao" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-purple-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-purple-500/30 w-fit mb-3">
                  <ListOrdered className="h-5 w-5 text-purple-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Priorização</h4>
                <p className="text-sm text-slate-200 mt-1">Algoritmo de score inteligente</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-purple-300 group-hover:text-purple-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link to="/monitoramento" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-emerald-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-emerald-500/30 w-fit mb-3">
                  <Monitor className="h-5 w-5 text-emerald-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Monitoramento</h4>
                <p className="text-sm text-slate-200 mt-1">Centro de Operações 24h</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-300 group-hover:text-emerald-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link to="/crise" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-red-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-red-500/30 w-fit mb-3">
                  <Shield className="h-5 w-5 text-red-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Gabinete de Crise</h4>
                <p className="text-sm text-slate-200 mt-1">Gestão de emergências</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-red-300 group-hover:text-red-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link to="/assistente" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-violet-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-violet-500/30 w-fit mb-3">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Assistente IA</h4>
                <p className="text-sm text-slate-200 mt-1">Decisões com inteligência</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-violet-300 group-hover:text-violet-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            <Link to="/integracoes" className="group">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-amber-500/50 hover:shadow-lg">
                <div className="p-2 rounded-lg bg-amber-500/30 w-fit mb-3">
                  <Zap className="h-5 w-5 text-amber-300" />
                </div>
                <h4 className="font-bold text-base text-white drop-shadow">Integrações</h4>
                <p className="text-sm text-slate-200 mt-1">Hub central de dados</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-amber-300 group-hover:text-amber-200">
                  Acessar <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </div>

          {/* Top Critical Neighborhoods */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <h4 className="font-bold text-base text-white flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-amber-300" />
                Bairros com Mais Demandas
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'Centro', count: 45, trend: '+12%' },
                  { name: 'Boa Vista', count: 38, trend: '+8%' },
                  { name: 'Nova Parnamirim', count: 32, trend: '-3%' },
                  { name: 'Parque das Nações', count: 28, trend: '+5%' },
                ].map((bairro, i) => (
                  <div key={bairro.name} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-300 w-5">{i + 1}.</span>
                      <span className="text-sm font-medium text-white">{bairro.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-white">{bairro.count}</span>
                      <span className={cn(
                        "text-sm font-medium",
                        bairro.trend.startsWith('+') ? 'text-red-300' : 'text-emerald-300'
                      )}>
                        {bairro.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-4">
              <h4 className="font-bold text-base text-white flex items-center gap-2 mb-4">
                <Signal className="h-4 w-4 text-cyan-300" />
                SLA por Secretaria
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'Infraestrutura', sla: 78, target: 85 },
                  { name: 'Iluminação', sla: 92, target: 85 },
                  { name: 'Saneamento', sla: 65, target: 85 },
                  { name: 'Trânsito', sla: 88, target: 85 },
                ].map((sec) => (
                  <div key={sec.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-slate-100 font-medium">{sec.name}</span>
                      <span className={cn(
                        "font-bold",
                        sec.sla >= sec.target ? 'text-emerald-300' : 'text-amber-300'
                      )}>
                        {sec.sla}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/20">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          sec.sla >= sec.target ? 'bg-emerald-400' : 'bg-amber-400'
                        )}
                        style={{ width: `${sec.sla}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
