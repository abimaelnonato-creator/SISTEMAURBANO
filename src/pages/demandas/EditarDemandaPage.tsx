import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '@/store/appStore'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MiniMap } from '@/components/map/CityMap'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  MapPin,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const demandSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres'),
  description: z.string().min(20, 'A descrição deve ter pelo menos 20 caracteres'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  secretariaId: z.string().min(1, 'Selecione uma secretaria'),
  priority: z.enum(['baixa', 'media', 'alta', 'urgente']),
  source: z.enum(['telefone', 'presencial', 'app', 'site', 'redes_sociais', 'oficio', 'whatsapp']),
  address: z.string().min(5, 'Informe o endereço'),
  neighborhood: z.string().min(1, 'Selecione o bairro'),
  referencePoint: z.string().optional(),
  citizenName: z.string().optional(),
  citizenPhone: z.string().optional(),
  citizenEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

type DemandFormData = z.infer<typeof demandSchema>

export function EditarDemandaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const secretarias = useAppStore((state) => state.secretarias)
  const storeCategories = useAppStore((state) => state.categories)
  const updateDemand = useAppStore((state) => state.updateDemand)
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])
  const [demandData, setDemandData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<DemandFormData>({
    resolver: zodResolver(demandSchema),
  })

  const selectedSecretariaId = watch('secretariaId')

  const filteredCategories = selectedSecretariaId
    ? storeCategories.filter(c => c.secretariaId === selectedSecretariaId)
    : storeCategories

  // Fetch neighborhoods
  useEffect(() => {
    api.getNeighborhoods().then((res) => {
      if (res.data) {
        const names = Array.isArray(res.data) 
          ? res.data.map((n: any) => n.name || n) 
          : []
        setNeighborhoods(names)
      }
    })
  }, [])

  // Fetch demand data
  useEffect(() => {
    if (!id) return

    const fetchDemand = async () => {
      try {
        const response = await api.getDemandById(id)
        if (response.data) {
          const demand = response.data
          setDemandData(demand)
          
          // Set location if available
          if (demand.latitude && demand.longitude) {
            setSelectedLocation({ lat: demand.latitude, lng: demand.longitude })
          }
          
          // Reset form with demand data
          reset({
            title: demand.title || '',
            description: demand.description || '',
            categoryId: demand.categoryId || demand.category?.id || '',
            secretariaId: demand.secretaryId || demand.secretary?.id || '',
            priority: demand.priority?.toLowerCase() || 'media',
            source: demand.source?.toLowerCase() || 'presencial',
            address: demand.address || '',
            neighborhood: demand.neighborhood || '',
            referencePoint: demand.referencePoint || '',
            citizenName: demand.requesterName || '',
            citizenPhone: demand.requesterPhone || '',
            citizenEmail: demand.requesterEmail || '',
          })
        }
      } catch (error) {
        console.error('Erro ao carregar demanda:', error)
        setSubmitError('Erro ao carregar dados da demanda')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDemand()
  }, [id, reset])

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
  }, [])

  const onSubmit = async (data: DemandFormData) => {
    if (!id) return
    
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const updateData = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        secretaryId: data.secretariaId,
        priority: data.priority.toUpperCase(),
        source: data.source.toUpperCase(),
        address: data.address,
        neighborhood: data.neighborhood,
        referencePoint: data.referencePoint || undefined,
        latitude: selectedLocation?.lat,
        longitude: selectedLocation?.lng,
        requesterName: data.citizenName || undefined,
        requesterPhone: data.citizenPhone || undefined,
        requesterEmail: data.citizenEmail || undefined,
      }

      const response = await api.updateDemand(id, updateData)

      if (response.error) {
        throw new Error(response.error)
      }

      // Update local store
      if (response.data) {
        updateDemand(id, response.data)
      }

      setSubmitSuccess(true)

      setTimeout(() => {
        navigate(`/demandas/${id}`)
      }, 2000)
    } catch (error) {
      console.error('Erro ao atualizar demanda:', error)
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'Erro ao atualizar demanda. Tente novamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Demanda Atualizada!</h2>
            <p className="text-muted-foreground mb-4">
              As alterações foram salvas com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Demanda</h1>
          <p className="text-muted-foreground">
            {demandData?.protocol && `Protocolo: #${demandData.protocol}`}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Erro ao atualizar demanda</p>
              <p className="text-sm text-muted-foreground">{submitError}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto"
              onClick={() => setSubmitError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações da Demanda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Buraco na via, Lâmpada queimada, Entulho acumulado..."
                {...register('title')}
                className={cn(errors.title && 'border-destructive')}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição detalhada *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o problema com detalhes: localização exata, tamanho, há quanto tempo ocorre, etc."
                rows={4}
                {...register('description')}
                className={cn(errors.description && 'border-destructive')}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Secretaria responsável *</Label>
                <Controller
                  name="secretariaId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={cn(errors.secretariaId && 'border-destructive')}>
                        <SelectValue placeholder="Selecione a secretaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {secretarias.map(sec => (
                          <SelectItem key={sec.id} value={sec.id}>
                            {sec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.secretariaId && (
                  <p className="text-sm text-destructive mt-1">{errors.secretariaId.message}</p>
                )}
              </div>

              <div>
                <Label>Categoria *</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedSecretariaId}
                    >
                      <SelectTrigger className={cn(errors.categoryId && 'border-destructive')}>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && (
                  <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Prioridade *</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Origem do registro *</Label>
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="app">Aplicativo</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="redes_sociais">Redes Sociais</SelectItem>
                        <SelectItem value="oficio">Ofício</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </CardTitle>
            <CardDescription>
              Clique no mapa para alterar a localização exata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MiniMap
              latitude={selectedLocation?.lat || -5.9116}
              longitude={selectedLocation?.lng || -35.2625}
              height="300px"
              interactive
              onLocationSelect={handleLocationSelect}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  {...register('address')}
                  className={cn(errors.address && 'border-destructive')}
                />
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label>Bairro *</Label>
                <Controller
                  name="neighborhood"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={cn(errors.neighborhood && 'border-destructive')}>
                        <SelectValue placeholder="Selecione o bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map(n => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.neighborhood && (
                  <p className="text-sm text-destructive mt-1">{errors.neighborhood.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="referencePoint">Ponto de referência</Label>
              <Input
                id="referencePoint"
                placeholder="Próximo a algum estabelecimento, praça, escola..."
                {...register('referencePoint')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Citizen Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados do Solicitante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="citizenName">Nome completo</Label>
                <Input
                  id="citizenName"
                  placeholder="Nome do cidadão"
                  {...register('citizenName')}
                />
              </div>
              <div>
                <Label htmlFor="citizenPhone">Telefone</Label>
                <Input
                  id="citizenPhone"
                  placeholder="(84) 99999-9999"
                  {...register('citizenPhone')}
                />
              </div>
              <div>
                <Label htmlFor="citizenEmail">E-mail</Label>
                <Input
                  id="citizenEmail"
                  type="email"
                  placeholder="cidadao@email.com"
                  {...register('citizenEmail')}
                />
                {errors.citizenEmail && (
                  <p className="text-sm text-destructive mt-1">{errors.citizenEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
