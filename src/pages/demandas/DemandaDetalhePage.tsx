import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { api } from '@/lib/api'
import { getUploadUrl } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MiniMap } from '@/components/map/CityMap'
import { ErrorBoundary, RouteErrorFallback } from '@/components/ErrorBoundary'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  MessageSquare,
  Image as ImageIcon,
  Paperclip,
  Building2,
  AlertTriangle,
  History,
  Plus,
} from 'lucide-react'
import { cn, formatDateTime, formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import type { Demand } from '@/types'

/**
 * Skeleton para loading state da página de detalhes
 */
function DemandaDetalheSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
              <div className="h-6 w-3/4 bg-muted rounded" />
              <div className="h-20 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-40 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * Conteúdo principal da página de detalhes
 */
function DemandaDetalheContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Usar seletores individuais para evitar re-renders desnecessários
  const updateDemand = useAppStore((state) => state.updateDemand)
  const [demand, setDemand] = useState<Demand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  
  // Estados para resolução com imagem
  const [resolutionComment, setResolutionComment] = useState('')
  const [resolutionImage, setResolutionImage] = useState<File | null>(null)
  const [resolutionImagePreview, setResolutionImagePreview] = useState<string | null>(null)
  const [notifyCitizen, setNotifyCitizen] = useState(true)
  const [isResolving, setIsResolving] = useState(false)

  // Função para buscar demanda com tratamento de erro robusto
  const fetchDemand = useCallback(async () => {
    console.log('📍 DemandaDetalhePage montada, id:', id);
    
    if (!id) {
      console.error('❌ ID não fornecido');
      setError('ID da demanda não fornecido');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Chamando API para demanda:', id);
      const response = await api.getDemandById(id);
      console.log('📦 Resposta completa da API:', JSON.stringify(response, null, 2));
      
      if (response.error) {
        console.error('❌ Erro retornado pela API:', response.error);
        setError(response.error);
        setIsLoading(false);
        return;
      }
      
      const demandResponse = response.data;
      
      if (demandResponse) {
        console.log('✅ Demanda encontrada:', demandResponse);
        // Normalizar dados da API para o formato do frontend
        const demandData: Demand = {
          id: demandResponse.id,
          protocol: demandResponse.protocol || 'N/D',
          title: demandResponse.title || 'Sem título',
          description: demandResponse.description || '',
          status: demandResponse.status?.toLowerCase() === 'open' ? 'aberta' : 
                 demandResponse.status?.toLowerCase() === 'in_progress' ? 'em_andamento' :
                 demandResponse.status?.toLowerCase() === 'resolved' ? 'resolvida' : 
                 demandResponse.status || 'aberta',
          priority: demandResponse.priority?.toLowerCase() || 'media',
          source: demandResponse.source?.toLowerCase() || 'web',
          address: demandResponse.address || 'Endereço não informado',
          neighborhood: demandResponse.neighborhood || 'Bairro não informado',
          latitude: demandResponse.latitude ?? -5.9,
          longitude: demandResponse.longitude ?? -35.2,
          categoryId: demandResponse.categoryId,
          category: demandResponse.category,
          secretariaId: demandResponse.secretaryId,
          secretaria: demandResponse.secretary,
          citizenName: demandResponse.requesterName,
          citizenPhone: demandResponse.requesterPhone,
          citizenEmail: demandResponse.requesterEmail,
          images: demandResponse.images || [],
          attachments: (demandResponse.attachments || []).map((att: { id: string; filename?: string; name?: string; url: string; mimeType?: string; type?: string; size: number; createdAt: string }) => ({
            id: att.id,
            name: att.filename || att.name || 'Anexo',
            url: att.url,
            type: att.mimeType || att.type || 'application/octet-stream',
            size: att.size,
            createdAt: att.createdAt,
          })),
          history: demandResponse.history || [],
          comments: demandResponse.comments || [],
          createdAt: demandResponse.createdAt || new Date().toISOString(),
          updatedAt: demandResponse.updatedAt,
          resolvedAt: demandResponse.resolvedAt,
        };
        setDemand(demandData);
      } else {
        setError('Demanda não encontrada');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar demanda:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar demanda: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Buscar demanda ao montar o componente
  useEffect(() => {
    fetchDemand();
  }, [fetchDemand])

  // Loading state
  if (isLoading) {
    return <DemandaDetalheSkeleton />
  }

  // Error state com opção de retry
  if (error) {
    return (
      <RouteErrorFallback 
        message={error} 
        onRetry={fetchDemand}
      />
    )
  }

  // Not found state
  if (!demand) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground font-medium">Demanda não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/demandas')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Demandas
        </Button>
      </div>
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResolutionImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setResolutionImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setResolutionImage(null)
    setResolutionImagePreview(null)
  }

  const handleResolve = async () => {
    if (!demand) return
    
    setIsResolving(true)
    try {
      const response = await api.resolveDemandWithImage(
        demand.id,
        resolutionComment || undefined,
        resolutionImage || undefined,
        notifyCitizen
      )
      
      if (response.error) {
        console.error('❌ Erro ao resolver demanda:', response.error)
        alert(`Erro: ${response.error}`)
        return
      }

      // Atualizar estado local
      updateDemand(demand.id, {
        status: 'resolvida',
        resolvedAt: new Date().toISOString(),
      })
      setDemand(prev => prev ? { ...prev, status: 'resolvida' } : null)
      
      // Limpar estados do modal
      setIsResolveDialogOpen(false)
      setResolutionComment('')
      setResolutionImage(null)
      setResolutionImagePreview(null)
    } catch (err: any) {
      console.error('❌ Erro ao resolver demanda:', err)
      alert(`Erro: ${err?.message || err}`)
    } finally {
      setIsResolving(false)
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    // In a real app, this would be an API call
    setNewComment('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">#{demand.protocol}</h1>
              {demand.priority === 'urgente' && (
                <Badge variant="danger" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgente
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Registrada {formatRelativeTime(demand.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {demand.status !== 'resolvida' && (
            <>
              <Button variant="outline" onClick={() => setIsForwardDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Encaminhar
              </Button>
              <Button onClick={() => setIsResolveDialogOpen(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Resolver
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={cn('text-sm', getStatusColor(demand.status))}>
                  {demand.status === 'aberta' && 'Aberta'}
                  {demand.status === 'em_andamento' && 'Em andamento'}
                  {demand.status === 'resolvida' && 'Resolvida'}
                  {demand.status === 'arquivada' && 'Arquivada'}
                  {demand.status === 'cancelada' && 'Cancelada'}
                </Badge>
                <Badge className={cn('text-sm', getPriorityColor(demand.priority))}>
                  Prioridade {demand.priority}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  via {demand.source}
                </Badge>
              </div>

              <h2 className="text-xl font-semibold mb-2">{demand.title}</h2>
              <p className="text-muted-foreground">{demand.description}</p>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico da Demanda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border">
                    {demand.history.map((item, index) => (
                      <div key={item.id} className="relative">
                        <div className={cn(
                          'absolute -left-4 w-4 h-4 rounded-full border-2 border-background',
                          index === 0 ? 'bg-primary' : 'bg-muted'
                        )} />
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{item.action}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.previousStatus && item.newStatus && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {item.previousStatus}
                              </Badge>
                              <span className="text-xs">→</span>
                              <Badge variant="outline" className="text-xs">
                                {item.newStatus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {demand.history.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum histórico registrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comentários Internos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    {demand.comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    ) : (
                      demand.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <UserAvatar name={comment.user?.name || 'Usuário'} size="sm" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {comment.user?.name || 'Usuário'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                              {comment.isInternal && (
                                <Badge variant="outline" className="text-xs">Interno</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handleAddComment}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Imagens e Anexos</CardTitle>
                </CardHeader>
                <CardContent>
                  {demand.images.length === 0 && demand.attachments.length === 0 ? (
                    <div className="text-center py-8">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum anexo disponível
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Renderizar attachments com URLs reais */}
                      {demand.attachments.map((attachment, index) => (
                        <a
                          key={attachment.id || index}
                          href={getUploadUrl(attachment.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border border-border"
                        >
                          {attachment.type?.startsWith('image') || attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img 
                              src={getUploadUrl(attachment.url)}
                              alt={attachment.name || `Anexo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback se imagem não carregar
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-4">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground text-center truncate max-w-full">
                                {attachment.name || 'Anexo'}
                              </span>
                            </div>
                          )}
                        </a>
                      ))}
                      {/* Renderizar images (strings de URL) */}
                      {demand.images.map((imageUrl, index) => (
                        <a
                          key={`img-${index}`}
                          href={getUploadUrl(imageUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border border-border"
                        >
                          <img 
                            src={getUploadUrl(imageUrl)}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MiniMap
                latitude={demand.latitude}
                longitude={demand.longitude}
                height="180px"
              />
              <div>
                <p className="font-medium">{demand.address}</p>
                <p className="text-sm text-muted-foreground">{demand.neighborhood}</p>
                {demand.referencePoint && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ref: {demand.referencePoint}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Citizen Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Cidadão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demand.citizenName ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{demand.citizenName}</span>
                  </div>
                  {demand.citizenPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{demand.citizenPhone}</span>
                    </div>
                  )}
                  {demand.citizenEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{demand.citizenEmail}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Solicitação anônima
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Secretaria</p>
                <p className="font-medium">
                  {demand.secretaria?.name || 'Não atribuída'}
                </p>
              </div>
              {demand.assignedTo && (
                <div className="flex items-center gap-2">
                  <UserAvatar name={demand.assignedTo.name} size="sm" />
                  <div>
                    <p className="font-medium text-sm">{demand.assignedTo.name}</p>
                    <p className="text-xs text-muted-foreground">Atribuído</p>
                  </div>
                </div>
              )}
              {!demand.assignedTo && (
                <Button variant="outline" className="w-full" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Atribuir responsável
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <p className="font-medium">{formatDateTime(demand.createdAt)}</p>
              </div>
              {demand.slaDeadline && (
                <div>
                  <p className="text-sm text-muted-foreground">Prazo SLA</p>
                  <p className={cn(
                    'font-medium',
                    new Date(demand.slaDeadline) < new Date() && demand.status !== 'resolvida'
                      ? 'text-destructive'
                      : ''
                  )}>
                    {formatDateTime(demand.slaDeadline)}
                  </p>
                </div>
              )}
              {demand.resolvedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolvida em</p>
                  <p className="font-medium text-green-600">
                    {formatDateTime(demand.resolvedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={(open) => {
        setIsResolveDialogOpen(open)
        if (!open) {
          setResolutionComment('')
          setResolutionImage(null)
          setResolutionImagePreview(null)
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolver Demanda</DialogTitle>
            <DialogDescription>
              Confirme a resolução da demanda #{demand.protocol}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Descrição da solução</Label>
              <Textarea
                placeholder="Descreva como o problema foi resolvido..."
                className="mt-1"
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
              />
            </div>
            
            {/* Upload de imagem */}
            <div>
              <Label>Foto do problema resolvido (opcional)</Label>
              <div className="mt-2">
                {resolutionImagePreview ? (
                  <div className="relative">
                    <img 
                      src={resolutionImagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Clique para adicionar uma foto
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Checkbox para notificar cidadão */}
            {demand.citizenPhone && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyCitizen"
                  checked={notifyCitizen}
                  onChange={(e) => setNotifyCitizen(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="notifyCitizen" className="text-sm font-normal cursor-pointer">
                  Notificar cidadão via WhatsApp ({demand.citizenPhone})
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsResolveDialogOpen(false)} disabled={isResolving}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              id="btn-confirmar-resolucao"
              onClick={handleResolve} 
              disabled={isResolving}
            >
              {isResolving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Resolvendo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Resolução
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaminhar Demanda</DialogTitle>
            <DialogDescription>
              Encaminhe esta demanda para outra secretaria ou equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Secretaria destino</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a secretaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Infraestrutura e Obras</SelectItem>
                  <SelectItem value="2">Iluminação Pública</SelectItem>
                  <SelectItem value="3">Saneamento e Meio Ambiente</SelectItem>
                  <SelectItem value="4">Trânsito e Mobilidade</SelectItem>
                  <SelectItem value="5">Serviços Urbanos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                placeholder="Adicione observações sobre o encaminhamento..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForwardDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsForwardDialogOpen(false)}>
              <Send className="mr-2 h-4 w-4" />
              Encaminhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Componente exportado com Error Boundary para capturar erros de renderização
 */
export function DemandaDetalhePage() {
  return (
    <ErrorBoundary>
      <DemandaDetalheContent />
    </ErrorBoundary>
  )
}
