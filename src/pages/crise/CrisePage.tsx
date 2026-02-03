import { useEffect, useState, useMemo } from 'react'
import { useCrisisStore } from '@/store/smartCityStore'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Plus,
  Users,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Timer,
  Shield,
  Zap,
  Phone,
  MessageSquare,
  FileDown,
  History,
  Target,
  Activity,
  Flag,
  Loader2,
} from 'lucide-react'
import { cn, formatDateTime, formatDate } from '@/lib/utils'
import type { Crisis, CrisisEvent, CrisisTask, CrisisType, CrisisStatus, CrisisEventType } from '@/types'

export function CrisePage() {
  // Usar seletores individuais para evitar re-renders desnecessários
  const secretarias = useAppStore((state) => state.secretarias)
  const { 
    crises, 
    activeCrisis, 
    setActiveCrisis, 
    createCrisis, 
    updateCrisis,
    addEvent, 
    addTask, 
    updateTask,
    initializeMockCrises 
  } = useCrisisStore()

  const [showNewCrisisDialog, setShowNewCrisisDialog] = useState(false)
  const [showNewEventDialog, setShowNewEventDialog] = useState(false)
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [selectedTab, setSelectedTab] = useState('timeline')
  
  // Form states
  const [newCrisis, setNewCrisis] = useState({
    name: '',
    type: 'infraestrutura' as CrisisType,
    description: '',
    severity: 3 as Crisis['severity'],
    affectedNeighborhoods: [] as string[],
    secretariasEnvolvidas: [] as string[],
  })

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'atualizacao' as CrisisEventType,
  })

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    secretariaId: '',
    priority: 'alta' as CrisisTask['priority'],
    deadline: '',
  })

  useEffect(() => {
    initializeMockCrises()
  }, [initializeMockCrises])

  // Stats
  const stats = useMemo(() => {
    const ativa = crises.filter(c => c.status === 'ativa').length
    const monitoramento = crises.filter(c => c.status === 'monitoramento').length
    const encerrada = crises.filter(c => c.status === 'encerrada').length
    const totalTasks = activeCrisis?.tasks.length || 0
    const completedTasks = activeCrisis?.tasks.filter(t => t.status === 'concluida').length || 0
    return { ativa, monitoramento, encerrada, totalTasks, completedTasks }
  }, [crises, activeCrisis])

  const handleCreateCrisis = () => {
    createCrisis({
      ...newCrisis,
      status: 'ativa',
      affectedPopulation: 0,
      relatedDemandIds: [],
      startedAt: new Date().toISOString(),
    })
    setShowNewCrisisDialog(false)
    setNewCrisis({
      name: '',
      type: 'infraestrutura',
      description: '',
      severity: 3,
      affectedNeighborhoods: [],
      secretariasEnvolvidas: [],
    })
  }

  const handleAddEvent = () => {
    if (!activeCrisis) return
    addEvent(activeCrisis.id, {
      type: newEvent.type,
      title: newEvent.title,
      description: newEvent.description,
      userId: 'user-1',
    })
    setShowNewEventDialog(false)
    setNewEvent({ title: '', description: '', type: 'atualizacao' })
  }

  const handleAddTask = () => {
    if (!activeCrisis) return
    addTask(activeCrisis.id, {
      title: newTask.title,
      description: newTask.description,
      secretariaId: newTask.secretariaId,
      priority: newTask.priority,
      status: 'pendente',
      deadline: newTask.deadline,
      comments: [],
    })
    setShowNewTaskDialog(false)
    setNewTask({ title: '', description: '', secretariaId: '', priority: 'alta', deadline: '' })
  }

  const getSeverityColor = (severity: Crisis['severity']) => {
    switch (severity) {
      case 5: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 4: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 1: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const getSeverityLabel = (severity: Crisis['severity']) => {
    switch (severity) {
      case 5: return 'Crítico'
      case 4: return 'Alto'
      case 3: return 'Médio'
      case 2: return 'Baixo'
      case 1: return 'Mínimo'
      default: return 'N/A'
    }
  }

  const getStatusColor = (status: CrisisStatus) => {
    switch (status) {
      case 'ativa': return 'bg-red-500'
      case 'monitoramento': return 'bg-amber-500'
      case 'encerrada': return 'bg-emerald-500'
      default: return 'bg-slate-500'
    }
  }

  const getStatusLabel = (status: CrisisStatus) => {
    switch (status) {
      case 'ativa': return 'Ativa'
      case 'monitoramento': return 'Monitoramento'
      case 'encerrada': return 'Encerrada'
      default: return status
    }
  }

  const getEventTypeStyle = (type: CrisisEventType) => {
    switch (type) {
      case 'alerta': return 'bg-red-100 dark:bg-red-900/30'
      case 'decisao': return 'bg-purple-100 dark:bg-purple-900/30'
      case 'acao': return 'bg-blue-100 dark:bg-blue-900/30'
      case 'atualizacao': return 'bg-slate-100 dark:bg-slate-800'
      case 'conclusao': return 'bg-emerald-100 dark:bg-emerald-900/30'
      default: return 'bg-slate-100 dark:bg-slate-800'
    }
  }

  const getEventTypeLabel = (type: CrisisEventType) => {
    switch (type) {
      case 'alerta': return 'Alerta'
      case 'decisao': return 'Decisão'
      case 'acao': return 'Ação'
      case 'atualizacao': return 'Atualização'
      case 'conclusao': return 'Conclusão'
      default: return type
    }
  }

  const getTaskPriorityColor = (priority: CrisisTask['priority']) => {
    switch (priority) {
      case 'critica': return 'bg-red-500 text-white'
      case 'alta': return 'bg-orange-500 text-white'
      case 'media': return 'bg-yellow-500 text-white'
      case 'baixa': return 'bg-blue-500 text-white'
      default: return 'bg-slate-500 text-white'
    }
  }

  const getTaskStatusIcon = (status: CrisisTask['status']) => {
    switch (status) {
      case 'concluida': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'em_andamento': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'bloqueada': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Circle className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gabinete Virtual de Crise</h1>
            <p className="text-sm text-muted-foreground">
              Gestão de situações críticas e emergências
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewCrisisDialog(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="mr-2 h-4 w-4" />
          Nova Crise
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200 dark:border-red-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ativa}</p>
                <p className="text-xs text-muted-foreground">Crises Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.monitoramento}</p>
                <p className="text-xs text-muted-foreground">Monitoramento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.encerrada}</p>
                <p className="text-xs text-muted-foreground">Encerradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200 dark:border-purple-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tarefas da Crise Ativa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Crisis List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              Crises
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-2">
                {crises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma crise registrada</p>
                  </div>
                ) : (
                  crises.map(crisis => (
                    <div
                      key={crisis.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                        activeCrisis?.id === crisis.id && "bg-slate-100 dark:bg-slate-800 ring-2 ring-primary"
                      )}
                      onClick={() => setActiveCrisis(crisis.id)}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn("w-2 h-2 rounded-full mt-2 shrink-0", getStatusColor(crisis.status))} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{crisis.name}</h4>
                            <Badge className={cn("text-xs", getSeverityColor(crisis.severity))}>
                              {getSeverityLabel(crisis.severity)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{crisis.affectedNeighborhoods.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{crisis.affectedPopulation?.toLocaleString() || 0} afetados</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Crisis Detail */}
        <Card className="lg:col-span-3">
          {activeCrisis ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-xs", getSeverityColor(activeCrisis.severity))}>
                        {getSeverityLabel(activeCrisis.severity).toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {getStatusLabel(activeCrisis.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{activeCrisis.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {activeCrisis.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Contatos
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-1" />
                      Relatório
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{activeCrisis.affectedNeighborhoods.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{activeCrisis.affectedPopulation?.toLocaleString() || 0} afetados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Início: {formatDateTime(activeCrisis.startedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{activeCrisis.secretariasEnvolvidas.length} secretarias</span>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="w-full justify-start rounded-none border-b h-12 px-4">
                    <TabsTrigger value="timeline" className="gap-2">
                      <History className="h-4 w-4" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                      <Target className="h-4 w-4" />
                      Tarefas ({activeCrisis.tasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="gap-2">
                      <Users className="h-4 w-4" />
                      Recursos
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comunicação
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="p-4 mt-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Histórico de Eventos</h3>
                      <Button size="sm" onClick={() => setShowNewEventDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Novo Evento
                      </Button>
                    </div>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-3">
                        {activeCrisis.events
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "p-3 rounded-lg border-l-4",
                                getEventTypeStyle(event.type),
                                event.type === 'alerta' && "border-red-500",
                                event.type === 'decisao' && "border-purple-500",
                                event.type === 'acao' && "border-blue-500",
                                event.type === 'atualizacao' && "border-slate-400",
                                event.type === 'conclusao' && "border-emerald-500",
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {getEventTypeLabel(event.type)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateTime(event.createdAt)}
                                    </span>
                                  </div>
                                  <h4 className="font-medium mt-1">{event.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="tasks" className="p-4 mt-0">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold">Tarefas da Crise</h3>
                        <p className="text-sm text-muted-foreground">
                          {stats.completedTasks} de {stats.totalTasks} concluídas
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setShowNewTaskDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Nova Tarefa
                      </Button>
                    </div>
                    <Progress value={(stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100} className="h-2 mb-4" />
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {activeCrisis.tasks.map(task => {
                          const sec = secretarias.find(s => s.id === task.secretariaId)
                          return (
                            <div
                              key={task.id}
                              className="p-3 rounded-lg border bg-card hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => {
                                    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
                                    updateTask(activeCrisis.id, task.id, { status: newStatus })
                                  }}
                                >
                                  {getTaskStatusIcon(task.status)}
                                </Button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                      "font-medium text-sm",
                                      task.status === 'concluida' && "line-through text-muted-foreground"
                                    )}>
                                      {task.title}
                                    </h4>
                                    <Badge className={cn("text-xs", getTaskPriorityColor(task.priority))}>
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {sec?.name || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      {formatDate(task.deadline)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="resources" className="p-4 mt-0">
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Gerenciamento de recursos em desenvolvimento</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="communication" className="p-4 mt-0">
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Centro de comunicação em desenvolvimento</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Selecione uma crise</p>
              <p className="text-sm">Escolha uma crise na lista ou crie uma nova</p>
            </div>
          )}
        </Card>
      </div>

      {/* New Crisis Dialog */}
      <Dialog open={showNewCrisisDialog} onOpenChange={setShowNewCrisisDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Crise</DialogTitle>
            <DialogDescription>
              Registre uma nova situação de crise para coordenação de ações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="crisis-name">Nome da Crise</Label>
              <Input
                id="crisis-name"
                placeholder="Ex: Alagamento Centro"
                value={newCrisis.name}
                onChange={(e) => setNewCrisis({ ...newCrisis, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newCrisis.type}
                  onValueChange={(value: CrisisType) => setNewCrisis({ ...newCrisis, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="climatica">Climática</SelectItem>
                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select
                  value={newCrisis.severity.toString()}
                  onValueChange={(value) => setNewCrisis({ ...newCrisis, severity: parseInt(value) as Crisis['severity'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 - Crítico</SelectItem>
                    <SelectItem value="4">4 - Alto</SelectItem>
                    <SelectItem value="3">3 - Médio</SelectItem>
                    <SelectItem value="2">2 - Baixo</SelectItem>
                    <SelectItem value="1">1 - Mínimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crisis-description">Descrição</Label>
              <Textarea
                id="crisis-description"
                placeholder="Descreva a situação..."
                value={newCrisis.description}
                onChange={(e) => setNewCrisis({ ...newCrisis, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCrisisDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCrisis} className="bg-red-600 hover:bg-red-700">
              Criar Crise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Event Dialog */}
      <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
            <DialogDescription>
              Registre um novo evento na timeline da crise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: CrisisEventType) => setNewEvent({ ...newEvent, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="decisao">Decisão</SelectItem>
                  <SelectItem value="acao">Ação</SelectItem>
                  <SelectItem value="atualizacao">Atualização</SelectItem>
                  <SelectItem value="conclusao">Conclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-title">Título</Label>
              <Input
                id="event-title"
                placeholder="Ex: Nova equipe mobilizada"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Descrição</Label>
              <Textarea
                id="event-description"
                placeholder="Detalhes do evento..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent}>
              Adicionar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Crie uma tarefa para a gestão da crise
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                placeholder="Ex: Evacuar área afetada"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                placeholder="Detalhes da tarefa..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Secretaria Responsável</Label>
                <Select
                  value={newTask.secretariaId}
                  onValueChange={(value) => setNewTask({ ...newTask, secretariaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {secretarias.map(sec => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: CrisisTask['priority']) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critica">Crítica</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-deadline">Prazo</Label>
              <Input
                id="task-deadline"
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask}>
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
