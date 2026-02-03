import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useDemandsSocket, type DemandData } from '@/hooks/useDemandsSocket'
import { useApiStatus } from '@/hooks/useApiStatus'
import { CityMap } from '@/components/map/CityMap'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  FileText,
  Clock,
  User,
  Phone,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Activity,
  ChevronRight,
  Zap,
  Building2,
  Calendar,
  LayoutGrid,
  List,
  Eye,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import type { MapMarker, Demand, Category } from '@/types'

export function MapPage() {
  const navigate = useNavigate()
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const addDemand = useAppStore((state) => state.addDemand)
  const updateDemand = useAppStore((state) => state.updateDemand)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarTab, setSidebarTab] = useState('recentes')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [newDemandsCount, setNewDemandsCount] = useState(0)

  // 🔌 WebSocket para receber demandas em tempo real (WhatsApp)
  // Callbacks simplificados - o hook usa refs internamente para evitar reconexões
  useDemandsSocket({
    onDemandCreated: (demandData: DemandData) => {
      // Nova demanda recebida - adiciona direto no store sem refresh
      const newDemand: Demand = {
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
      setNewDemandsCount(prev => prev + 1)
      
      // Limpa contador após 5 segundos
      setTimeout(() => setNewDemandsCount(0), 5000)
    },
    onDemandUpdated: (demandData: DemandData) => {
      // Atualiza demanda existente sem refresh
      updateDemand(demandData.id, {
        status: demandData.status?.toLowerCase() === 'resolved' ? 'resolvida' : 
                demandData.status?.toLowerCase() === 'in_progress' ? 'em_andamento' : 'aberta',
        updatedAt: new Date().toISOString(),
      })
    },
    enabled: true,
  })

  // Verifica status de conexão com a API
  const { isOnline } = useApiStatus({ checkInterval: 30000 })
  // Convert demands to map markers - SEMSUR categories
  const markers: MapMarker[] = useMemo(() => demands.map((demand) => {
    // Mapeia categoria para tipo de marcador
    const categoryValue = demand.category as Category | string | undefined
    const categoryName = typeof categoryValue === 'string' 
      ? categoryValue.toLowerCase() 
      : (categoryValue?.name || '').toLowerCase()
    let markerType = 'servicos'
    
    if (categoryName.includes('iluminação') || categoryName.includes('poste') || categoryName.includes('lamp')) {
      markerType = 'iluminacao'
    } else if (categoryName.includes('limpeza') || categoryName.includes('lixo') || categoryName.includes('entulho')) {
      markerType = 'limpeza'
    } else if (categoryName.includes('praça') || categoryName.includes('jardim') || categoryName.includes('poda') || categoryName.includes('árvore')) {
      markerType = 'pracas'
    } else if (categoryName.includes('drenagem') || categoryName.includes('bueiro') || categoryName.includes('alagamento')) {
      markerType = 'drenagem'
    } else if (categoryName.includes('mercado') || categoryName.includes('cemitério')) {
      markerType = 'mercados'
    } else if (categoryName.includes('calçada') || categoryName.includes('buraco') || categoryName.includes('infra')) {
      markerType = 'infraestrutura'
    }
    
    return {
      id: demand.id,
      latitude: demand.latitude,
      longitude: demand.longitude,
      type: markerType,
      status: demand.status,
      priority: demand.priority,
      title: demand.title,
      address: demand.address,
      demandId: demand.id,
    }
  }), [demands])

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    const demand = demands.find(d => d.id === marker.demandId)
    if (demand) {
      setSelectedDemand(demand)
      setIsDetailOpen(true)
    }
  }, [demands])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Os dados já são gerenciados pelo App.tsx - aqui só indicamos que está atualizando
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [])

  // Stats
  const stats = useMemo(() => ({
    urgent: demands.filter(d => d.priority === 'urgente' && d.status !== 'resolvida').length,
    open: demands.filter(d => d.status === 'aberta').length,
    inProgress: demands.filter(d => d.status === 'em_andamento').length,
    resolved: demands.filter(d => d.status === 'resolvida').length,
    total: demands.length,
  }), [demands])

  // Recent demands (last 7 days)
  const recentDemands = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return demands
      .filter(d => new Date(d.createdAt) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [demands])

  // Urgent demands
  const urgentDemands = useMemo(() => 
    demands
      .filter(d => d.priority === 'urgente' && d.status !== 'resolvida')
      .slice(0, 10)
  , [demands])

  // Group by neighborhood
  const neighborhoodStats = useMemo(() => {
    const grouped: Record<string, number> = {}
    demands.forEach(d => {
      if (d.neighborhood) {
        grouped[d.neighborhood] = (grouped[d.neighborhood] || 0) + 1
      }
    })
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [demands])

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mapa de Demandas SEMSUR</h1>
            <p className="text-sm text-muted-foreground">
              Visualização geográfica em tempo real • {stats.total} demandas mapeadas
            </p>
          </div>
          {/* Indicador de Status */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
            isOnline 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {/* Badge de novas demandas */}
          {newDemandsCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              +{newDemandsCount} novas via WhatsApp
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden lg:flex"
          >
            {showSidebar ? <LayoutGrid className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
            {showSidebar ? 'Ocultar painel' : 'Mostrar painel'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.urgent}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Urgentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-200 dark:border-yellow-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.open}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Abertas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200 dark:border-green-900/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Resolvidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 col-span-2 md:col-span-1">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Mapeado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Map + Sidebar */}
      <div className="flex-1 flex gap-4 min-h-[400px]">
        {/* Map */}
        <div className={cn("flex-1 min-w-0 min-h-[400px]", showSidebar && "lg:flex-[2]")}>
          <CityMap
            markers={markers}
            height="calc(100vh - 280px)"
            onMarkerClick={handleMarkerClick}
            onRefresh={handleRefresh}
            showFilters
            showLegend
            showControls
            showSearch
            enableClustering
            className="h-full"
          />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <Card className="hidden lg:flex lg:w-[320px] flex-col shrink-0 overflow-hidden">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 m-2 h-9">
                <TabsTrigger value="recentes" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Recentes
                </TabsTrigger>
                <TabsTrigger value="urgentes" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Urgentes
                </TabsTrigger>
                <TabsTrigger value="areas" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Áreas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recentes" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Últimas demandas registradas nos últimos 7 dias
                    </p>
                    {recentDemands.length === 0 ? (
                      <p className="text-sm text-center text-muted-foreground py-8">
                        Nenhuma demanda recente
                      </p>
                    ) : (
                      recentDemands.map((demand) => (
                        <DemandListItem 
                          key={demand.id} 
                          demand={demand} 
                          onClick={() => {
                            setSelectedDemand(demand)
                            setIsDetailOpen(true)
                          }}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="urgentes" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Demandas que requerem atenção imediata
                    </p>
                    {urgentDemands.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nenhuma demanda urgente!
                        </p>
                      </div>
                    ) : (
                      urgentDemands.map((demand) => (
                        <DemandListItem 
                          key={demand.id} 
                          demand={demand} 
                          urgent
                          onClick={() => {
                            setSelectedDemand(demand)
                            setIsDetailOpen(true)
                          }}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="areas" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Bairros com maior concentração de demandas
                    </p>
                    {neighborhoodStats.map(([neighborhood, count], index) => (
                      <div 
                        key={neighborhood}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                          index === 0 && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                          index === 1 && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                          index === 2 && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{neighborhood}</p>
                          <p className="text-xs text-muted-foreground">{count} demandas</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      {/* Demand Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg z-[10000]" style={{ zIndex: 10000 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Demanda
            </DialogTitle>
          </DialogHeader>

          {selectedDemand && (
            <div className="space-y-4">
              {/* Protocol & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Protocolo</p>
                  <p className="text-lg font-mono font-bold">#{selectedDemand.protocol}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={cn(getStatusColor(selectedDemand.status))}>
                    {selectedDemand.status === 'aberta' && 'Aberta'}
                    {selectedDemand.status === 'em_andamento' && 'Em andamento'}
                    {selectedDemand.status === 'resolvida' && 'Resolvida'}
                  </Badge>
                  <Badge className={cn(getPriorityColor(selectedDemand.priority))}>
                    {selectedDemand.priority}
                  </Badge>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-semibold">{selectedDemand.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDemand.description}
                </p>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm">{selectedDemand.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDemand.neighborhood}
                  </p>
                </div>
              </div>

              {/* Citizen Info */}
              {selectedDemand.citizenName && (
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{selectedDemand.citizenName}</p>
                    {selectedDemand.citizenPhone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedDemand.citizenPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Registrada em {formatDateTime(selectedDemand.createdAt)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailOpen(false)
                    navigate(`/demandas/${selectedDemand.id}`)
                  }}
                >
                  Ver detalhes completos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline">
                  Encaminhar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Demand List Item Component for Sidebar
function DemandListItem({ 
  demand, 
  urgent = false,
  onClick 
}: { 
  demand: Demand
  urgent?: boolean
  onClick: () => void 
}) {
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md group",
        urgent 
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800" 
          : "bg-card hover:bg-muted/50 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium line-clamp-1 flex-1">{demand.title}</h4>
        <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0",
            getStatusColor(demand.status)
          )}
        >
          {demand.status === 'aberta' && 'Aberta'}
          {demand.status === 'em_andamento' && 'Em andamento'}
          {demand.status === 'resolvida' && 'Resolvida'}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0",
            getPriorityColor(demand.priority)
          )}
        >
          {demand.priority}
        </Badge>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span className="truncate">{demand.address || demand.neighborhood}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
        <Calendar className="h-3 w-3" />
        <span>{formatDateTime(demand.createdAt)}</span>
      </div>
    </div>
  )
}
