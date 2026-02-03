import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { usePrioritizationStore } from '@/store/smartCityStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowUpDown,
  Calculator,
  ChevronRight,
  Filter,
  Info,
  ListOrdered,
  MapPin,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Clock,
  AlertTriangle,
  Users,
  Building2,
  Gauge,
  Play,
  X,
} from 'lucide-react'
import { cn, formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import type { PrioritizedDemand, PriorityWeights } from '@/types'

export function PriorizacaoPage() {
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const secretarias = useAppStore((state) => state.secretarias)
  const { 
    weights, 
    prioritizedDemands, 
    isCalculating, 
    lastCalculated,
    setWeights, 
    recalculatePriorities 
  } = usePrioritizationStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all')
  const [minScore, setMinScore] = useState(0)
  const [selectedDemand, setSelectedDemand] = useState<PrioritizedDemand | null>(null)
  const [showWeightsDialog, setShowWeightsDialog] = useState(false)
  const [showSimulationDialog, setShowSimulationDialog] = useState(false)
  const [tempWeights, setTempWeights] = useState<PriorityWeights>(weights)

  useEffect(() => {
    if (demands.length > 0) {
      recalculatePriorities(demands)
    }
  }, [demands, weights, recalculatePriorities])

  // Get unique neighborhoods
  const neighborhoods = useMemo(() => {
    const unique = [...new Set(demands.map(d => d.neighborhood).filter(Boolean))]
    return unique.sort()
  }, [demands])

  // Filter prioritized demands
  const filteredDemands = useMemo(() => {
    return prioritizedDemands.filter(demand => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!demand.title.toLowerCase().includes(query) && 
            !demand.protocol.toLowerCase().includes(query) &&
            !demand.address?.toLowerCase().includes(query)) {
          return false
        }
      }
      if (selectedSecretaria !== 'all' && demand.secretariaId !== selectedSecretaria) return false
      if (selectedStatus !== 'all' && demand.status !== selectedStatus) return false
      if (selectedNeighborhood !== 'all' && demand.neighborhood !== selectedNeighborhood) return false
      if (demand.priorityMetrics.prioridadeScore < minScore) return false
      return true
    })
  }, [prioritizedDemands, searchQuery, selectedSecretaria, selectedStatus, selectedNeighborhood, minScore])

  // Stats
  const stats = useMemo(() => {
    const total = prioritizedDemands.length
    const critical = prioritizedDemands.filter(d => d.priorityMetrics.prioridadeScore >= 40).length
    const high = prioritizedDemands.filter(d => d.priorityMetrics.prioridadeScore >= 30 && d.priorityMetrics.prioridadeScore < 40).length
    const medium = prioritizedDemands.filter(d => d.priorityMetrics.prioridadeScore >= 20 && d.priorityMetrics.prioridadeScore < 30).length
    const avgScore = total > 0 ? prioritizedDemands.reduce((sum, d) => sum + d.priorityMetrics.prioridadeScore, 0) / total : 0
    const maxScore = Math.max(...prioritizedDemands.map(d => d.priorityMetrics.prioridadeScore), 0)
    
    return { total, critical, high, medium, avgScore, maxScore }
  }, [prioritizedDemands])

  const handleApplyWeights = () => {
    setWeights(tempWeights)
    setShowWeightsDialog(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-red-600 dark:text-red-400'
    if (score >= 30) return 'text-orange-600 dark:text-orange-400'
    if (score >= 20) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 40) return 'bg-red-100 dark:bg-red-900/30'
    if (score >= 30) return 'bg-orange-100 dark:bg-orange-900/30'
    if (score >= 20) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-green-100 dark:bg-green-900/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg">
            <ListOrdered className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Priorização de Demandas</h1>
            <p className="text-sm text-muted-foreground">
              Algoritmo inteligente de priorização • {stats.total} demandas analisadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => recalculatePriorities(demands)}
            disabled={isCalculating}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isCalculating && "animate-spin")} />
            Recalcular
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTempWeights(weights)
              setShowWeightsDialog(true)
            }}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Configurar Pesos
          </Button>
          <Button 
            size="sm"
            onClick={() => setShowSimulationDialog(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Simular Cenário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Críticas (≥40)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</p>
                <p className="text-xs text-muted-foreground">Alta (30-39)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-200 dark:border-yellow-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</p>
                <p className="text-xs text-muted-foreground">Média (20-29)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Score Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maxScore}</p>
                <p className="text-xs text-muted-foreground">Score Máx.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedSecretaria} onValueChange={setSelectedSecretaria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Secretaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Secretarias</SelectItem>
                {secretarias.map(sec => (
                  <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Bairros</SelectItem>
                {neighborhoods.map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">Score mín:</Label>
              <Input
                type="number"
                min={0}
                max={55}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-[80px]"
              />
            </div>

            {(searchQuery || selectedSecretaria !== 'all' || selectedStatus !== 'all' || selectedNeighborhood !== 'all' || minScore > 0) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSecretaria('all')
                  setSelectedStatus('all')
                  setSelectedNeighborhood('all')
                  setMinScore(0)
                }}
              >
                <X className="mr-1 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority Formula Info */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Fórmula de Priorização</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Score = (Gravidade × {weights.gravidade}) + (Impacto × {weights.impactoPessoas}) + 
                (Urgência × {weights.urgencia}) + (Criticidade × {weights.criticidadeLocal}) + 
                (Tempo × {weights.tempoEspera}) + (Reincidência × {weights.reincidencia})
              </p>
              {lastCalculated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Última atualização: {formatDateTime(lastCalculated)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demands Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Demandas Priorizadas
            <Badge variant="secondary" className="ml-2">
              {filteredDemands.length} resultados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Dias</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemands.map((demand, index) => (
                  <TableRow 
                    key={demand.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedDemand(demand)}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold",
                        getScoreBg(demand.priorityMetrics.prioridadeScore),
                        getScoreColor(demand.priorityMetrics.prioridadeScore)
                      )}>
                        {demand.priorityMetrics.prioridadeScore}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{demand.protocol}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {demand.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {demand.neighborhood}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", getStatusColor(demand.status))}>
                        {demand.status === 'aberta' && 'Aberta'}
                        {demand.status === 'em_andamento' && 'Em andamento'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {demand.priorityMetrics.diasEspera}d
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Demand Detail Dialog */}
      <Dialog open={!!selectedDemand} onOpenChange={() => setSelectedDemand(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Detalhes da Priorização
            </DialogTitle>
            <DialogDescription>
              Protocolo #{selectedDemand?.protocol}
            </DialogDescription>
          </DialogHeader>

          {selectedDemand && (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <h3 className="font-semibold">{selectedDemand.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDemand.address} - {selectedDemand.neighborhood}
                  </p>
                </div>
                <div className={cn(
                  "text-3xl font-bold px-4 py-2 rounded-xl",
                  getScoreBg(selectedDemand.priorityMetrics.prioridadeScore),
                  getScoreColor(selectedDemand.priorityMetrics.prioridadeScore)
                )}>
                  {selectedDemand.priorityMetrics.prioridadeScore}
                </div>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard 
                  label="Gravidade" 
                  value={selectedDemand.priorityMetrics.gravidade}
                  weight={weights.gravidade}
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                <MetricCard 
                  label="Impacto" 
                  value={selectedDemand.priorityMetrics.impactoPessoas}
                  weight={weights.impactoPessoas}
                  icon={<Users className="h-4 w-4" />}
                />
                <MetricCard 
                  label="Urgência" 
                  value={selectedDemand.priorityMetrics.urgencia}
                  weight={weights.urgencia}
                  icon={<Zap className="h-4 w-4" />}
                />
                <MetricCard 
                  label="Criticidade Local" 
                  value={selectedDemand.priorityMetrics.criticidadeLocal}
                  weight={weights.criticidadeLocal}
                  icon={<Building2 className="h-4 w-4" />}
                />
                <MetricCard 
                  label="Tempo de Espera" 
                  value={selectedDemand.priorityMetrics.diasEspera}
                  weight={weights.tempoEspera}
                  icon={<Clock className="h-4 w-4" />}
                  suffix=" dias"
                />
                <MetricCard 
                  label="Reincidência" 
                  value={selectedDemand.priorityMetrics.reincidencia}
                  weight={weights.reincidencia}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Atendimento
                </Button>
                <Button variant="outline">
                  Ver Demanda Completa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Weights Configuration Dialog */}
      <Dialog open={showWeightsDialog} onOpenChange={setShowWeightsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Configurar Pesos do Algoritmo
            </DialogTitle>
            <DialogDescription>
              Ajuste os pesos para personalizar a fórmula de priorização
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <WeightSlider 
              label="Gravidade" 
              description="Risco à vida, segurança ou dano ao patrimônio"
              value={tempWeights.gravidade}
              onChange={(v) => setTempWeights(p => ({ ...p, gravidade: v }))}
            />
            <WeightSlider 
              label="Impacto" 
              description="Quantidade de pessoas afetadas"
              value={tempWeights.impactoPessoas}
              onChange={(v) => setTempWeights(p => ({ ...p, impactoPessoas: v }))}
            />
            <WeightSlider 
              label="Urgência" 
              description="Prazo legal ou risco imediato"
              value={tempWeights.urgencia}
              onChange={(v) => setTempWeights(p => ({ ...p, urgencia: v }))}
            />
            <WeightSlider 
              label="Criticidade do Local" 
              description="Proximidade de escola, hospital, via arterial"
              value={tempWeights.criticidadeLocal}
              onChange={(v) => setTempWeights(p => ({ ...p, criticidadeLocal: v }))}
            />
            <WeightSlider 
              label="Tempo de Espera" 
              description="Dias desde a abertura da demanda"
              value={tempWeights.tempoEspera}
              onChange={(v) => setTempWeights(p => ({ ...p, tempoEspera: v }))}
            />
            <WeightSlider 
              label="Reincidência" 
              description="Reclamações semelhantes na região"
              value={tempWeights.reincidencia}
              onChange={(v) => setTempWeights(p => ({ ...p, reincidencia: v }))}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowWeightsDialog(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleApplyWeights} className="flex-1">
              Aplicar Pesos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simulation Dialog */}
      <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Simulação de Cenário
            </DialogTitle>
            <DialogDescription>
              Simule mudanças de recursos e veja o impacto no backlog
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="equipes" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="equipes">Equipes</TabsTrigger>
              <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
              <TabsTrigger value="foco">Foco Regional</TabsTrigger>
            </TabsList>

            <TabsContent value="equipes" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Secretaria</Label>
                    <Select defaultValue="1">
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {secretarias.map(sec => (
                          <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Adicionar equipes</Label>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Slider defaultValue={[2]} max={10} min={1} className="flex-1" />
                      <span className="font-mono text-lg w-12">+2</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calcular Impacto
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">
                    Resultado da Simulação
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Backlog atual</p>
                      <p className="text-2xl font-bold">42 demandas</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dias para zerar</p>
                      <p className="text-2xl font-bold">14 → <span className="text-green-600">7 dias</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Redução</p>
                      <p className="text-2xl font-bold text-green-600">-50%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Custo adicional</p>
                      <p className="text-2xl font-bold">R$ 45k/mês</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orcamento" className="mt-4">
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Simulação de orçamento em desenvolvimento</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="foco" className="mt-4">
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Simulação de foco regional em desenvolvimento</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function MetricCard({ 
  label, 
  value, 
  weight, 
  icon, 
  suffix = '' 
}: { 
  label: string
  value: number
  weight: number
  icon: React.ReactNode
  suffix?: string
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}{suffix}</span>
        <span className="text-xs text-muted-foreground">× {weight}</span>
      </div>
      <Progress value={(value / 5) * 100} className="mt-2 h-1.5" />
    </div>
  )
}

function WeightSlider({ 
  label, 
  description, 
  value, 
  onChange 
}: { 
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <Label>{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <Slider 
        value={[value]} 
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={5}
        step={1}
      />
    </div>
  )
}
