import { useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { api } from '@/lib/api'
import { useDemandsSocket, type DemandData } from '@/hooks/useDemandsSocket'
import { useApiStatus } from '@/hooks/useApiStatus'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  Download,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn, formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import { neighborhoods } from '@/data/mockData'
import type { Demand } from '@/types'

type ViewMode = 'table' | 'cards'

export function DemandasPage() {
  const [searchParams] = useSearchParams()
  // Dados já inicializados pelo App.tsx - usar seletores individuais
  const demands = useAppStore((state) => state.demands)
  const secretarias = useAppStore((state) => state.secretarias)
  const isLoading = useAppStore((state) => state.isLoading)
  const addDemand = useAppStore((state) => state.addDemand)
  const updateDemand = useAppStore((state) => state.updateDemand)
  const removeDemand = useAppStore((state) => state.removeDemand)
  
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [secretariaFilter, setSecretariaFilter] = useState<string>('all')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [demandToDelete, setDemandToDelete] = useState<{ id: string; protocol: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 10

  // Função para excluir demanda
  const handleDeleteDemand = useCallback(async () => {
    if (!demandToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await api.deleteDemand(demandToDelete.id)
      if (response.data?.success) {
        removeDemand(demandToDelete.id)
        setDemandToDelete(null)
      }
    } catch (error) {
      console.error('Erro ao excluir demanda:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [demandToDelete, removeDemand])

  // Callback para nova demanda via WebSocket - useCallback para evitar re-renders
  const handleDemandCreated = useCallback((demandData: DemandData) => {
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
      category: demandData.category ? { 
        ...demandData.category, 
        id: '', 
        slug: '', 
        secretariaId: '', 
        slaHours: 48, 
        isActive: true 
      } : undefined,
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
  }, [addDemand])

  // Callback para demanda atualizada via WebSocket
  const handleDemandUpdated = useCallback((demandData: DemandData) => {
    updateDemand(demandData.id, {
      status: demandData.status?.toLowerCase() === 'resolved' ? 'resolvida' : 
              demandData.status?.toLowerCase() === 'in_progress' ? 'em_andamento' : 'aberta',
      updatedAt: new Date().toISOString(),
    })
  }, [updateDemand])

  // WebSocket DESABILITADO TEMPORARIAMENTE para debug
  // TODO: Reativar após resolver o problema de flickering
  useDemandsSocket({
    onDemandCreated: handleDemandCreated,
    onDemandUpdated: handleDemandUpdated,
    enabled: false, // DESABILITADO PARA DEBUG
    throttleMs: 3000, // 3 segundos entre atualizações para evitar flickering
  })

  // Verifica status de conexão com a API
  const { isOnline } = useApiStatus({ checkInterval: 30000 })

  // Filter demands
  const filteredDemands = useMemo(() => {
    return demands.filter((demand) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          demand.protocol.toLowerCase().includes(query) ||
          demand.title.toLowerCase().includes(query) ||
          demand.description.toLowerCase().includes(query) ||
          demand.address.toLowerCase().includes(query) ||
          demand.citizenName?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status
      if (statusFilter !== 'all' && demand.status !== statusFilter) return false

      // Priority
      if (priorityFilter !== 'all' && demand.priority !== priorityFilter) return false

      // Secretaria
      if (secretariaFilter !== 'all' && demand.secretariaId !== secretariaFilter) return false

      // Neighborhood
      if (neighborhoodFilter !== 'all' && demand.neighborhood !== neighborhoodFilter) return false

      return true
    })
  }, [demands, searchQuery, statusFilter, priorityFilter, secretariaFilter, neighborhoodFilter])

  // Pagination
  const totalPages = Math.ceil(filteredDemands.length / itemsPerPage)
  const paginatedDemands = filteredDemands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Counts by status
  const statusCounts = {
    all: demands.length,
    aberta: demands.filter(d => d.status === 'aberta').length,
    em_andamento: demands.filter(d => d.status === 'em_andamento').length,
    resolvida: demands.filter(d => d.status === 'resolvida').length,
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSecretariaFilter('all')
    setNeighborhoodFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || 
    secretariaFilter !== 'all' || neighborhoodFilter !== 'all' || searchQuery

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Demandas</h1>
            {/* Indicador de conexão WebSocket */}
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                isOnline 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}
              title={isOnline ? "Sistema online" : "Reconectando..."}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">
            Gerencie todas as demandas registradas no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Exportar como PDF</DropdownMenuItem>
              <DropdownMenuItem>Exportar como Excel</DropdownMenuItem>
              <DropdownMenuItem>Exportar como CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link to="/demandas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Demanda
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            Todas
            <Badge variant="secondary" className="h-5 text-xs">{statusCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="aberta" className="gap-2">
            Abertas
            <Badge variant="warning" className="h-5 text-xs">{statusCounts.aberta}</Badge>
          </TabsTrigger>
          <TabsTrigger value="em_andamento" className="gap-2">
            Em andamento
            <Badge variant="info" className="h-5 text-xs">{statusCounts.em_andamento}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolvida" className="gap-2">
            Resolvidas
            <Badge variant="success" className="h-5 text-xs">{statusCounts.resolvida}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por protocolo, título, endereço..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Secretaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {secretarias.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}

              {/* View Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results - Só mostra skeleton se está carregando E não tem dados */}
      {isLoading && demands.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 dark:bg-slate-800/80">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Protocolo</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Demanda</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Localização</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Prioridade</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Data</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDemands.map((demand) => (
                    <tr key={demand.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Link 
                          to={`/demandas/${demand.id}`}
                          className="text-sm font-mono text-primary hover:underline"
                        >
                          #{demand.protocol}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium truncate max-w-[250px]">
                            {demand.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {demand.citizenName || 'Anônimo'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm truncate max-w-[150px]">{demand.address}</p>
                            <p className="text-xs text-muted-foreground">{demand.neighborhood}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn('text-xs', getStatusColor(demand.status))}>
                          {demand.status === 'aberta' && 'Aberta'}
                          {demand.status === 'em_andamento' && 'Em andamento'}
                          {demand.status === 'resolvida' && 'Resolvida'}
                          {demand.status === 'arquivada' && 'Arquivada'}
                          {demand.status === 'cancelada' && 'Cancelada'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn('text-xs', getPriorityColor(demand.priority))}>
                          {demand.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(demand.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/demandas/${demand.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/demandas/${demand.id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Encaminhar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDemandToDelete({ id: demand.id, protocol: demand.protocol })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedDemands.length === 0 && (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhuma demanda encontrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Ainda não há demandas registradas'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedDemands.map((demand) => (
            <Card key={demand.id} hover className="relative overflow-hidden">
              {demand.priority === 'urgente' && (
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-destructive border-l-[40px] border-l-transparent">
                  <AlertTriangle className="absolute -top-9 right-1 h-4 w-4 text-white" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link 
                      to={`/demandas/${demand.id}`}
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      #{demand.protocol}
                    </Link>
                    <h3 className="font-medium mt-1 line-clamp-2">{demand.title}</h3>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <Badge className={cn('text-xs', getStatusColor(demand.status))}>
                    {demand.status === 'aberta' && 'Aberta'}
                    {demand.status === 'em_andamento' && 'Em andamento'}
                    {demand.status === 'resolvida' && 'Resolvida'}
                  </Badge>
                  <Badge className={cn('text-xs', getPriorityColor(demand.priority))}>
                    {demand.priority}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{demand.address}, {demand.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{formatRelativeTime(demand.createdAt)}</span>
                  </div>
                  {demand.citizenName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>{demand.citizenName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/demandas/${demand.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredDemands.length)} de {filteredDemands.length} demandas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!demandToDelete} onOpenChange={(open) => !open && setDemandToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a demanda <strong>#{demandToDelete?.protocol}</strong>?
              <br />
              <span className="text-destructive">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDemandToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDemand}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
