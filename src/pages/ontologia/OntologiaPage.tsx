// ==========================================
// PÁGINA - Núcleo de Ontologia Urbana
// Modelo Digital da Cidade de Parnamirim
// ==========================================

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useOntologyStore } from '@/store/ontologyStore'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Network,
  Map,
  List,
  LayoutDashboard,
  Zap,
  Droplets,
  Wifi,
  Car,
  Building2,
  Users,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Brain,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Lightbulb,
  Camera,
  TrafficCone,
  School,
  Hospital,
  Shield,
  TreeDeciduous,
  Flame,
  CloudRain,
  Construction,
  Clock,
  Target,
  Gauge,
  Signal,
  MapPin,
  CircleDot,
  Layers,
  GitBranch,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BairroData, FlowAlert } from '@/types/ontology'

// Componente de métrica circular
function CircularMetric({ value, label, color, icon: Icon }: { 
  value: number
  label: string
  color: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/30"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="h-5 w-5 mb-1" style={{ color }} />
          <span className="text-lg font-bold">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2 text-center">{label}</span>
    </div>
  )
}

// Card de bairro
function BairroCard({ bairro, onClick }: { bairro: BairroData; onClick: () => void }) {
  const getStatusColor = (indice: number) => {
    if (indice >= 75) return 'text-emerald-500'
    if (indice >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBgColor = (indice: number) => {
    if (indice >= 75) return 'bg-emerald-500/10 border-emerald-500/20'
    if (indice >= 60) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
        getBgColor(bairro.indiceGeral)
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{bairro.nome}</h4>
          <p className="text-xs text-muted-foreground">
            {bairro.populacao.toLocaleString()} hab • {bairro.area} km²
          </p>
        </div>
        <div className={cn("text-2xl font-bold", getStatusColor(bairro.indiceGeral))}>
          {bairro.indiceGeral}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-xs text-muted-foreground">Saúde</div>
          <div className={cn("font-medium text-sm", getStatusColor(bairro.indiceSaude))}>
            {bairro.indiceSaude}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Educação</div>
          <div className={cn("font-medium text-sm", getStatusColor(bairro.indiceEducacao))}>
            {bairro.indiceEducacao}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Segurança</div>
          <div className={cn("font-medium text-sm", getStatusColor(bairro.indiceSeguranca))}>
            {bairro.indiceSeguranca}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Infra</div>
          <div className={cn("font-medium text-sm", getStatusColor(bairro.indiceInfraestrutura))}>
            {bairro.indiceInfraestrutura}
          </div>
        </div>
      </div>
    </div>
  )
}

// Card de alerta
function AlertCard({ alert }: { alert: FlowAlert }) {
  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'interrupcao': return Zap
      case 'baixa_pressao': return Droplets
      case 'vazamento': return Droplets
      case 'sobrecarga': return TrafficCone
      case 'manutencao': return Construction
      default: return AlertTriangle
    }
  }

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return 'bg-red-500/10 border-red-500/30 text-red-500'
    if (sev >= 3) return 'bg-amber-500/10 border-amber-500/30 text-amber-500'
    return 'bg-blue-500/10 border-blue-500/30 text-blue-500'
  }

  const Icon = getAlertIcon(alert.tipo)

  return (
    <div className={cn(
      "p-3 rounded-lg border flex items-start gap-3",
      getSeverityColor(alert.severidade)
    )}>
      <div className="p-2 rounded-lg bg-current/10">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm capitalize">{alert.tipo.replace('_', ' ')}</span>
          <Badge variant="outline" className="text-[10px]">
            Sev. {alert.severidade}/5
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {alert.descricao}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Início: {new Date(alert.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          {alert.previsaoRetorno && (
            <>
              <span>•</span>
              <span>Previsão: {new Date(alert.previsaoRetorno).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Visualização do Grafo (simplificada)
function GraphVisualization() {
  const { metricas } = useOntologyStore()
  
  const nodes = [
    { id: 'pessoas', label: 'Pessoas', count: metricas.populacaoTotal, color: '#8B5CF6', icon: Users, x: 50, y: 30 },
    { id: 'enderecos', label: 'Endereços', count: 58000, color: '#06B6D4', icon: MapPin, x: 20, y: 50 },
    { id: 'infra', label: 'Infraestrutura', count: metricas.infraestrutura.postesTotal + metricas.infraestrutura.camerasTotal, color: '#F59E0B', icon: Lightbulb, x: 80, y: 50 },
    { id: 'veiculos', label: 'Veículos', count: metricas.veiculos.total, color: '#10B981', icon: Car, x: 35, y: 70 },
    { id: 'equipamentos', label: 'Equipamentos', count: metricas.equipamentos.escolas + metricas.equipamentos.postosSaude, color: '#EC4899', icon: Building2, x: 65, y: 70 },
    { id: 'fluxos', label: 'Fluxos', count: 5, color: '#3B82F6', icon: Activity, x: 50, y: 90 },
  ]

  const edges = [
    { from: 'pessoas', to: 'enderecos' },
    { from: 'pessoas', to: 'equipamentos' },
    { from: 'enderecos', to: 'infra' },
    { from: 'enderecos', to: 'fluxos' },
    { from: 'veiculos', to: 'enderecos' },
    { from: 'equipamentos', to: 'fluxos' },
    { from: 'infra', to: 'fluxos' },
  ]

  return (
    <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_50%)]" />
      
      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full">
        {edges.map((edge, i) => {
          const fromNode = nodes.find(n => n.id === edge.from)!
          const toNode = nodes.find(n => n.id === edge.to)!
          return (
            <line
              key={i}
              x1={`${fromNode.x}%`}
              y1={`${fromNode.y}%`}
              x2={`${toNode.x}%`}
              y2={`${toNode.y}%`}
              stroke="rgba(139,92,246,0.3)"
              strokeWidth="2"
              strokeDasharray="5,5"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="10;0"
                dur="1s"
                repeatCount="indefinite"
              />
            </line>
          )
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => (
        <div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div 
            className="relative p-4 rounded-xl border-2 transition-all group-hover:scale-110"
            style={{ 
              backgroundColor: `${node.color}20`,
              borderColor: `${node.color}50`
            }}
          >
            {/* Pulse effect */}
            <div 
              className="absolute inset-0 rounded-xl animate-ping opacity-20"
              style={{ backgroundColor: node.color }}
            />
            
            <node.icon className="h-6 w-6 relative z-10" style={{ color: node.color }} />
          </div>
          
          {/* Label */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center whitespace-nowrap">
            <div className="text-xs font-medium text-white">{node.label}</div>
            <div className="text-[10px] text-slate-400">{node.count.toLocaleString()}</div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <CircleDot className="h-3 w-3" />
          <span>Entidades</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>Conexões</span>
        </div>
        <div className="flex items-center gap-1">
          <Radio className="h-3 w-3 text-violet-400 animate-pulse" />
          <span>Fluxo Ativo</span>
        </div>
      </div>
      
      {/* Total stats */}
      <div className="absolute top-4 right-4 text-right">
        <div className="text-2xl font-bold text-white">{metricas.totalEntidades.toLocaleString()}</div>
        <div className="text-xs text-slate-400">Entidades no Grafo</div>
        <div className="text-lg font-semibold text-violet-400 mt-1">{metricas.totalConexoes.toLocaleString()}</div>
        <div className="text-xs text-slate-400">Conexões Ativas</div>
      </div>
    </div>
  )
}

export function OntologiaPage() {
  const { 
    bairros, 
    metricas, 
    alertasAtivos, 
    eventosRecentes,
    viewMode, 
    setViewMode, 
    initializeData 
  } = useOntologyStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBairro, setSelectedBairro] = useState<BairroData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const handleQuimeraAnalysis = async () => {
    setIsAnalyzing(true)
    // Simulação de análise
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsAnalyzing(false)
  }

  const sortedBairros = useMemo(() => {
    return [...bairros].sort((a, b) => a.indiceGeral - b.indiceGeral)
  }, [bairros])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white">
              <Network className="h-6 w-6" />
            </div>
            Núcleo de Ontologia Urbana
          </h1>
          <p className="text-muted-foreground mt-1">
            Modelo digital da cidade de Parnamirim como organismo vivo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar entidade..." 
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleQuimeraAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Análise Quimera
          </Button>

          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grafo' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grafo')}
            >
              <Network className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'mapa' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mapa')}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'lista' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('lista')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Saúde Geral do Sistema */}
      <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Saúde Geral */}
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/20"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#healthGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 2 * Math.PI * 56,
                      strokeDashoffset: 2 * Math.PI * 56 * (1 - metricas.saudeGeral / 100),
                      transition: 'stroke-dashoffset 1s ease'
                    }}
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Activity className="h-6 w-6 text-violet-500 mb-1" />
                  <span className="text-3xl font-bold">{metricas.saudeGeral}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Saúde do Organismo</h3>
                <p className="text-sm text-muted-foreground">
                  Estado geral da cidade
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.3% esta semana
                  </Badge>
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="h-24 hidden lg:block" />

            {/* Métricas de Fluxo */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-6">
              <CircularMetric 
                value={metricas.fluxos.coberturaEnergia} 
                label="Energia" 
                color="#F59E0B"
                icon={Zap}
              />
              <CircularMetric 
                value={metricas.fluxos.coberturaAgua} 
                label="Água" 
                color="#06B6D4"
                icon={Droplets}
              />
              <CircularMetric 
                value={metricas.fluxos.coberturaEsgoto} 
                label="Esgoto" 
                color="#10B981"
                icon={Droplets}
              />
              <CircularMetric 
                value={metricas.fluxos.coberturaInternet} 
                label="Internet" 
                color="#8B5CF6"
                icon={Wifi}
              />
              <CircularMetric 
                value={metricas.fluxos.qualidadeTransito} 
                label="Trânsito" 
                color="#EC4899"
                icon={Car}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização do Grafo */}
      {viewMode === 'grafo' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-violet-500" />
              Grafo Urbano - Entidades e Conexões
            </CardTitle>
            <CardDescription>
              Visualização das entidades interconectadas da cidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraphVisualization />
          </CardContent>
        </Card>
      )}

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Infraestrutura e Veículos */}
          <div className="space-y-6">
            {/* Infraestrutura */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Infraestrutura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Postes</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{metricas.infraestrutura.postesAtivos.toLocaleString()}</span>
                      <span className="text-muted-foreground">/{metricas.infraestrutura.postesTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <Progress value={(metricas.infraestrutura.postesAtivos / metricas.infraestrutura.postesTotal) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Câmeras</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{metricas.infraestrutura.camerasAtivas}</span>
                      <span className="text-muted-foreground">/{metricas.infraestrutura.camerasTotal}</span>
                    </div>
                  </div>
                  <Progress value={(metricas.infraestrutura.camerasAtivas / metricas.infraestrutura.camerasTotal) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrafficCone className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Semáforos</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{metricas.infraestrutura.semaforosAtivos}</span>
                      <span className="text-muted-foreground">/{metricas.infraestrutura.semaforosTotal}</span>
                    </div>
                  </div>
                  <Progress value={(metricas.infraestrutura.semaforosAtivos / metricas.infraestrutura.semaforosTotal) * 100} className="h-2" />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Buracos Reportados</span>
                  </div>
                  <Badge variant="destructive">{metricas.infraestrutura.buracosReportados}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Frota */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-emerald-500" />
                  Frota Municipal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-2xl font-bold text-emerald-500">{metricas.veiculos.disponiveis}</div>
                    <div className="text-xs text-muted-foreground">Disponíveis</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                    <div className="text-2xl font-bold text-blue-500">{metricas.veiculos.emMissao}</div>
                    <div className="text-xs text-muted-foreground">Em Missão</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <div className="text-2xl font-bold text-amber-500">{metricas.veiculos.manutencao}</div>
                    <div className="text-xs text-muted-foreground">Manutenção</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-center">
                    <div className="text-2xl font-bold">{metricas.veiculos.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-500" />
                  Equipamentos Públicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Escolas</span>
                  </div>
                  <span className="font-semibold">{metricas.equipamentos.escolas}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Hospital className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Postos de Saúde</span>
                  </div>
                  <span className="font-semibold">{metricas.equipamentos.postosSaude}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-sm">Delegacias</span>
                  </div>
                  <span className="font-semibold">{metricas.equipamentos.delegacias}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <TreeDeciduous className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">Praças</span>
                  </div>
                  <span className="font-semibold">{metricas.equipamentos.pracas}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Bairros */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-500" />
                    Bairros - Índice de Saúde
                  </CardTitle>
                  <Badge variant="outline">{bairros.length} bairros</Badge>
                </div>
                <CardDescription>
                  Ordenados por criticidade (menor → maior)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {sortedBairros.map(bairro => (
                      <BairroCard 
                        key={bairro.id} 
                        bairro={bairro}
                        onClick={() => setSelectedBairro(bairro)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Alertas e Eventos */}
          <div className="space-y-6">
            {/* Alertas de Fluxo */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alertas de Fluxo
                  </CardTitle>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                    {alertasAtivos.length} ativos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertasAtivos.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Eventos Recentes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Eventos Ativos
                  </CardTitle>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                    {eventosRecentes.filter(e => e.emAndamento).length} em andamento
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventosRecentes.map(evento => (
                    <div 
                      key={evento.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          evento.severidade >= 4 ? "bg-red-500/10 text-red-500" :
                          evento.severidade >= 3 ? "bg-amber-500/10 text-amber-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {evento.categoria === 'alagamento' ? <CloudRain className="h-4 w-4" /> :
                           evento.categoria === 'queda_arvore' ? <TreeDeciduous className="h-4 w-4" /> :
                           evento.categoria === 'incendio' ? <Flame className="h-4 w-4" /> :
                           <AlertTriangle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{evento.name}</span>
                            <Badge variant={evento.emAndamento ? "default" : "secondary"} className="text-[10px]">
                              {evento.emAndamento ? 'Em Andamento' : 'Finalizado'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {evento.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {evento.populacaoAfetada} afetados
                            </span>
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {evento.recursosMobilizados.length} veículos
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Gerais */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Signal className="h-4 w-4 text-cyan-400" />
                  Estatísticas do Grafo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-400">População</div>
                    <div className="text-lg font-bold">{metricas.populacaoTotal.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-400">Área</div>
                    <div className="text-lg font-bold">{metricas.areaTotalKm2} km²</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-400">Entidades</div>
                    <div className="text-lg font-bold">{metricas.totalEntidades.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-400">Conexões</div>
                    <div className="text-lg font-bold">{metricas.totalConexoes.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-sm text-slate-300">Powered by Quimera</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mapa View - Placeholder */}
      {viewMode === 'mapa' && (
        <Card className="h-[600px] flex items-center justify-center">
          <div className="text-center">
            <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Visualização do Mapa</h3>
            <p className="text-muted-foreground">
              Integração com mapa geográfico em desenvolvimento
            </p>
          </div>
        </Card>
      )}

      {/* Lista View - Placeholder */}
      {viewMode === 'lista' && (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Entidades</CardTitle>
            <CardDescription>
              Navegue por todas as entidades do grafo urbano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pessoas">
              <TabsList>
                <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
                <TabsTrigger value="enderecos">Endereços</TabsTrigger>
                <TabsTrigger value="infraestrutura">Infraestrutura</TabsTrigger>
                <TabsTrigger value="veiculos">Veículos</TabsTrigger>
                <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                <TabsTrigger value="fluxos">Fluxos</TabsTrigger>
              </TabsList>
              <TabsContent value="pessoas" className="mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>268.000 pessoas cadastradas no sistema</p>
                  <p className="text-sm">Dados agregados por privacidade</p>
                </div>
              </TabsContent>
              {/* Outras tabs similares */}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OntologiaPage
