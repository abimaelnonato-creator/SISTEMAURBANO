import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useMonitoringStore } from '@/store/smartCityStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CityMap } from '@/components/map/CityMap'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Clock,
  Gauge,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Timer,
  Target,
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'

type TVModeView = 'map' | 'kpis' | 'alerts' | 'charts'

export function MonitoramentoPage() {
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const secretarias = useAppStore((state) => state.secretarias)
  const { 
    kpis, 
    alerts, 
    neighborhoodRisks, 
    slaMetrics,
    isTVMode, 
    setTVMode, 
    dismissAlert,
    initializeMockData 
  } = useMonitoringStore()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentView, setCurrentView] = useState<TVModeView>('map')
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    initializeMockData()
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [initializeMockData])

  // Auto-rotation for TV mode
  useEffect(() => {
    if (!isTVMode || !autoRotate) return
    
    const views: TVModeView[] = ['map', 'kpis', 'alerts', 'charts']
    const interval = setInterval(() => {
      setCurrentView(prev => {
        const currentIndex = views.indexOf(prev)
        const nextIndex = (currentIndex + 1) % views.length
        return views[nextIndex]
      })
    }, 30000) // 30 seconds per view

    return () => clearInterval(interval)
  }, [isTVMode, autoRotate])

  // Fullscreen handler
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Calculate stats
  const stats = useMemo(() => ({
    totalDemandas: demands.length,
    abertas: demands.filter(d => d.status === 'aberta').length,
    emAndamento: demands.filter(d => d.status === 'em_andamento').length,
    concluidas: demands.filter(d => d.status === 'resolvida').length,
    alertasAtivos: alerts.filter(a => !a.isAcknowledged).length,
    slaMedio: Math.round(slaMetrics.reduce((acc, s) => acc + s.slaCompliance, 0) / Math.max(slaMetrics.length, 1)),
  }), [demands, alerts, slaMetrics])

  const unresolvedAlerts = useMemo(() => alerts.filter(a => !a.isAcknowledged), [alerts])

  // SLA percentages calculated once
  const slaPercentages = useMemo(() => {
    return secretarias.slice(0, 4).map(sec => {
      const metric = slaMetrics.find(s => s.secretariaId === sec.id)
      return {
        id: sec.id,
        name: sec.name,
        percentage: metric?.slaCompliance || 85
      }
    })
  }, [secretarias, slaMetrics])

  if (isTVMode) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
        {/* TV Mode Header */}
        <div className="h-16 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Centro de Operações - Parnamirim</h1>
              <p className="text-sm text-slate-400">Sala de Monitoramento Smart City</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-white">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-slate-400">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn("text-slate-400", autoRotate && "text-emerald-400")}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                <RefreshCw className={cn("h-4 w-4", autoRotate && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-red-400"
                onClick={() => setTVMode(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* TV Mode Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Main View */}
            <div className="col-span-9 h-full">
              {currentView === 'map' && (
                <Card className="h-full bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Mapa de Ocorrências
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    <CityMap height="100%" showLegend={false} />
                  </CardContent>
                </Card>
              )}
              
              {currentView === 'kpis' && (
                <div className="grid grid-cols-3 gap-4 h-full">
                  {kpis.slice(0, 6).map(kpi => (
                    <TVModeKPICard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              )}
              
              {currentView === 'charts' && (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">Demandas por Hora</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[calc(100%-60px)]">
                      <div className="text-center text-slate-500">
                        <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Gráfico de tendências</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">Por Secretaria</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[calc(100%-60px)]">
                      <div className="text-center text-slate-500">
                        <Gauge className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Gráfico por secretaria</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {currentView === 'alerts' && (
                <Card className="h-full bg-slate-900 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Alertas Ativos ({unresolvedAlerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-200px)]">
                      <div className="space-y-3">
                        {unresolvedAlerts.map(alert => (
                          <div 
                            key={alert.id}
                            className={cn(
                              "p-4 rounded-lg border-l-4",
                              alert.severity === 'critical' && "bg-red-900/30 border-red-500",
                              alert.severity === 'warning' && "bg-amber-900/30 border-amber-500",
                              alert.severity === 'info' && "bg-blue-900/30 border-blue-500",
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-white text-lg">{alert.title}</h4>
                                <p className="text-slate-400 mt-1">{alert.message}</p>
                                {alert.location && (
                                  <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {alert.location}
                                  </p>
                                )}
                              </div>
                              <span className="text-2xl font-mono text-slate-400">
                                {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="col-span-3 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatMini label="Demandas Hoje" value={stats.totalDemandas.toString()} icon={<Activity className="h-4 w-4" />} trend="+12%" />
                <StatMini label="Em Atendimento" value={stats.emAndamento.toString()} icon={<Users className="h-4 w-4" />} trend="+5" />
                <StatMini label="Concluídas" value={stats.concluidas.toString()} icon={<CheckCircle2 className="h-4 w-4" />} trend="+23" />
                <StatMini label="Alertas" value={unresolvedAlerts.length.toString()} icon={<Bell className="h-4 w-4" />} variant="warning" />
              </div>

              {/* Top Neighborhoods */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="py-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Bairros Críticos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {neighborhoodRisks.slice(0, 5).map((n, i) => (
                      <div key={n.neighborhood} className="flex items-center gap-2">
                        <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                        <span className="text-white text-sm flex-1 truncate">{n.neighborhood}</span>
                        <Badge 
                          variant={n.riskScore > 70 ? 'destructive' : 'secondary'} 
                          className="text-xs"
                        >
                          {n.demandCount}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* SLA Status */}
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="py-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    SLA por Secretaria
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {slaPercentages.map(sec => (
                      <div key={sec.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 truncate">{sec.name}</span>
                          <span className="text-white">{sec.percentage}%</span>
                        </div>
                        <Progress value={sec.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* View Selector */}
              <div className="flex gap-2">
                {(['map', 'kpis', 'charts', 'alerts'] as const).map(view => (
                  <Button
                    key={view}
                    variant={currentView === view ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "flex-1 text-xs",
                      currentView !== view && "border-slate-700 text-slate-400"
                    )}
                    onClick={() => setCurrentView(view)}
                  >
                    {view === 'map' && 'Mapa'}
                    {view === 'kpis' && 'KPIs'}
                    {view === 'charts' && 'Gráficos'}
                    {view === 'alerts' && 'Alertas'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal Mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sala de Monitoramento</h1>
            <p className="text-sm text-muted-foreground">
              Centro de Operações • Atualizado {formatDateTime(lastUpdate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setLastUpdate(new Date())
              initializeMockData()
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            size="sm"
            onClick={() => setTVMode(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Modo TV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard 
          title="Total Hoje" 
          value={stats.totalDemandas}
          icon={<Activity className="h-5 w-5" />}
          trend={12}
          color="purple"
        />
        <KPICard 
          title="Abertas" 
          value={stats.abertas}
          icon={<Clock className="h-5 w-5" />}
          trend={-5}
          color="blue"
        />
        <KPICard 
          title="Em Andamento" 
          value={stats.emAndamento}
          icon={<Zap className="h-5 w-5" />}
          trend={8}
          color="amber"
        />
        <KPICard 
          title="Concluídas" 
          value={stats.concluidas}
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={23}
          color="emerald"
        />
        <KPICard 
          title="Alertas" 
          value={stats.alertasAtivos}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={-2}
          color="red"
        />
        <KPICard 
          title="SLA Médio" 
          value={`${stats.slaMedio}%`}
          icon={<Gauge className="h-5 w-5" />}
          trend={3}
          color="teal"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa de Ocorrências
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Tempo Real
                </Badge>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <CityMap height="100%" />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Ativos
              </CardTitle>
              <Badge variant="secondary">{unresolvedAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px]">
              <div className="space-y-3">
                {unresolvedAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum alerta ativo</p>
                  </div>
                ) : (
                  unresolvedAlerts.map(alert => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                        alert.severity === 'critical' && "bg-red-50 dark:bg-red-950/30 border-red-500",
                        alert.severity === 'warning' && "bg-amber-50 dark:bg-amber-950/30 border-amber-500",
                        alert.severity === 'info' && "bg-blue-50 dark:bg-blue-950/30 border-blue-500",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
                          {alert.location && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* KPIs and Charts */}
      <Tabs defaultValue="kpis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kpis" className="gap-2">
            <Gauge className="h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="bairros" className="gap-2">
            <Layers className="h-4 w-4" />
            Bairros
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kpis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <Card key={kpi.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{kpi.name}</span>
                    <Badge 
                      variant={kpi.trend === 'up' ? 'default' : kpi.trend === 'down' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                      {kpi.trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold">{kpi.value}{kpi.unit}</div>
                  <Progress 
                    value={Math.min(100, kpi.value)} 
                    className="mt-3 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Categoria: {kpi.category}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bairros">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {neighborhoodRisks.map((n, index) => (
              <Card 
                key={n.neighborhood}
                className={cn(
                  n.riskScore > 80 && "border-red-300 dark:border-red-900",
                  n.riskScore > 60 && n.riskScore <= 80 && "border-orange-300 dark:border-orange-900",
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-semibold">{n.neighborhood}</span>
                    </div>
                    <Badge 
                      variant={
                        n.riskScore > 80 ? 'destructive' : 
                        n.riskScore > 60 ? 'default' : 'secondary'
                      }
                    >
                      {n.riskScore > 80 && 'Crítico'}
                      {n.riskScore > 60 && n.riskScore <= 80 && 'Alto'}
                      {n.riskScore > 40 && n.riskScore <= 60 && 'Médio'}
                      {n.riskScore <= 40 && 'Baixo'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-red-600">{n.demandCount}</p>
                      <p className="text-xs text-muted-foreground">Demandas</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{n.avgResolutionDays}d</p>
                      <p className="text-xs text-muted-foreground">Tempo Médio</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{n.riskScore}</p>
                      <p className="text-xs text-muted-foreground">Score Risco</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {n.mainIssues.map(issue => (
                      <Badge key={issue} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tendencias">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Demandas por Hora</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Gráfico de tendências</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Secretaria</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Gauge className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Gráfico por secretaria</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function KPICard({ 
  title, 
  value, 
  icon, 
  trend, 
  color 
}: { 
  title: string
  value: number | string
  icon: React.ReactNode
  trend: number
  color: 'purple' | 'blue' | 'amber' | 'emerald' | 'red' | 'teal'
}) {
  const colors = {
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-900/50',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900/50',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-900/50',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-900/50',
    red: 'from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900/50',
    teal: 'from-teal-500/10 to-teal-500/5 border-teal-200 dark:border-teal-900/50',
  }

  const iconColors = {
    purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-500/20 text-red-600 dark:text-red-400',
    teal: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
  }

  return (
    <Card className={cn("bg-gradient-to-br", colors[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg", iconColors[color])}>
            {icon}
          </div>
          <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="text-xs">
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </Badge>
        </div>
        <p className="text-2xl font-bold mt-3">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

function TVModeKPICard({ kpi }: { kpi: { id: string; name: string; value: number; unit: string; trend: 'up' | 'down' | 'stable'; trendValue: number } }) {
  return (
    <Card className="bg-slate-900 border-slate-700 flex flex-col justify-center">
      <CardContent className="p-6 text-center">
        <p className="text-slate-400 text-sm mb-2">{kpi.name}</p>
        <p className="text-5xl font-bold text-white">{kpi.value}{kpi.unit}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge 
            variant={kpi.trend === 'up' ? 'default' : kpi.trend === 'down' ? 'destructive' : 'secondary'}
          >
            {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
            {kpi.trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-1" />}
            {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function StatMini({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'default' 
}: { 
  label: string
  value: string
  icon: React.ReactNode
  trend?: string
  variant?: 'default' | 'warning'
}) {
  return (
    <Card className={cn(
      "bg-slate-900 border-slate-700",
      variant === 'warning' && "bg-amber-900/30 border-amber-700"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-slate-500",
            variant === 'warning' && "text-amber-500"
          )}>
            {icon}
          </span>
          <span className="text-xs text-slate-400">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{value}</span>
          {trend && <span className="text-xs text-emerald-400">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
