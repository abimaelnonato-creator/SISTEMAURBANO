import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { secretarias, categories } from '@/data/mockData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserAvatar } from '@/components/ui/avatar'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { DonutChart } from '@/components/charts/PieChart'
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
  ArrowLeft,
  Building2,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Settings,
  Eye,
} from 'lucide-react'
import { cn, formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils'

export function SecretariaDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const [period, setPeriod] = useState('30d')

  const secretaria = useMemo(() => {
    return secretarias.find(s => s.id === id || s.slug === id)
  }, [id])

  const secretariaId = secretaria?.id || id || ''

  const secCategories = useMemo(() => {
    return categories.filter(c => c.secretariaId === secretariaId)
  }, [secretariaId])

  const secDemands = useMemo(() => {
    return demands.filter(d => d.secretariaId === secretariaId)
  }, [demands, secretariaId])

  const stats = useMemo(() => {
    const total = secDemands.length
    const abertas = secDemands.filter(d => d.status === 'aberta').length
    const emAndamento = secDemands.filter(d => d.status === 'em_andamento').length
    const resolvidas = secDemands.filter(d => d.status === 'resolvida').length
    const urgentes = secDemands.filter(d => d.priority === 'urgente').length
    const atrasadas = secDemands.filter(d => {
      if (!d.slaDeadline || d.status === 'resolvida') return false
      return new Date(d.slaDeadline) < new Date()
    }).length
    const resolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0
    const tempoMedio = '3.2 dias'

    return { total, abertas, emAndamento, resolvidas, urgentes, atrasadas, resolucao, tempoMedio }
  }, [secDemands])

  // Chart data
  const monthlyData = [
    { name: 'Jan', abertas: 45, resolvidas: 38 },
    { name: 'Fev', abertas: 52, resolvidas: 45 },
    { name: 'Mar', abertas: 38, resolvidas: 42 },
    { name: 'Abr', abertas: 65, resolvidas: 55 },
    { name: 'Mai', abertas: 48, resolvidas: 52 },
    { name: 'Jun', abertas: 55, resolvidas: 48 },
  ]

  const categoryData = secCategories.map(cat => {
    const count = secDemands.filter(d => d.categoryId === cat.id).length
    return { name: cat.name, value: count }
  }).filter(d => d.value > 0)

  const priorityData = [
    { name: 'Baixa', value: secDemands.filter(d => d.priority === 'baixa').length, color: '#22c55e' },
    { name: 'Média', value: secDemands.filter(d => d.priority === 'media').length, color: '#3b82f6' },
    { name: 'Alta', value: secDemands.filter(d => d.priority === 'alta').length, color: '#f59e0b' },
    { name: 'Urgente', value: secDemands.filter(d => d.priority === 'urgente').length, color: '#ef4444' },
  ]

  const neighborhoodData = useMemo(() => {
    const counts: Record<string, number> = {}
    secDemands.forEach(d => {
      counts[d.neighborhood] = (counts[d.neighborhood] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [secDemands])

  if (!secretaria) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Secretaria não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${secretaria.color}20` }}
              >
                <Building2 className="h-6 w-6" style={{ color: secretaria.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{secretaria.name}</h1>
                <p className="text-muted-foreground">{secretaria.acronym || secretaria.slug}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Demandas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.abertas + stats.emAndamento}</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <Badge variant="outline">{stats.abertas} abertas</Badge>
              <Badge variant="outline">{stats.emAndamento} em andamento</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                <p className="text-2xl font-bold">{stats.resolucao}%</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <Progress value={stats.resolucao} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{stats.tempoMedio}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingDown className="h-4 w-4" />
              <span>-0.5 dias vs média</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(stats.urgentes > 0 || stats.atrasadas > 0) && (
        <div className="flex gap-4 flex-wrap">
          {stats.urgentes > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {stats.urgentes} demanda{stats.urgentes > 1 ? 's' : ''} urgente{stats.urgentes > 1 ? 's' : ''}
              </span>
              <Link to={`/demandas?secretaria=${id}&priority=urgente`}>
                <Button variant="link" size="sm" className="text-red-700 dark:text-red-400 p-0 h-auto">
                  Ver
                </Button>
              </Link>
            </div>
          )}
          {stats.atrasadas > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {stats.atrasadas} demanda{stats.atrasadas > 1 ? 's' : ''} fora do prazo SLA
              </span>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="demands">Demandas</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução Mensal</CardTitle>
                <CardDescription>Demandas abertas vs resolvidas</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={monthlyData}
                  lines={[
                    { dataKey: 'abertas', name: 'Abertas', color: '#f59e0b' },
                    { dataKey: 'resolvidas', name: 'Resolvidas', color: '#22c55e' },
                  ]}
                  xAxisKey="name"
                  height={250}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Prioridade</CardTitle>
                <CardDescription>Distribuição das demandas</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={priorityData}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
                <CardDescription>Tipos de ocorrência mais frequentes</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={categoryData}
                  bars={[{ dataKey: 'value', name: 'Demandas', color: secretaria.color }]}
                  xAxisKey="name"
                  height={250}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Bairro</CardTitle>
                <CardDescription>Top 5 bairros com mais demandas</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={neighborhoodData}
                  bars={[{ dataKey: 'value', name: 'Demandas', color: '#3b82f6' }]}
                  xAxisKey="name"
                  height={250}
                  layout="vertical"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demands" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Demandas Recentes</CardTitle>
                <Link to={`/demandas?secretaria=${id}`}>
                  <Button variant="outline" size="sm">
                    Ver todas
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secDemands.slice(0, 5).map((demand) => (
                    <TableRow key={demand.id}>
                      <TableCell className="font-mono text-sm">
                        #{demand.protocol}
                      </TableCell>
                      <TableCell>{demand.title}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', getStatusColor(demand.status))}>
                          {demand.status === 'aberta' && 'Aberta'}
                          {demand.status === 'em_andamento' && 'Em andamento'}
                          {demand.status === 'resolvida' && 'Resolvida'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', getPriorityColor(demand.priority))}>
                          {demand.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRelativeTime(demand.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link to={`/demandas/${demand.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {secDemands.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma demanda encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Equipe</CardTitle>
                  <CardDescription>Membros da secretaria</CardDescription>
                </div>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'João Silva', role: 'Coordenador', demands: 12 },
                  { name: 'Maria Santos', role: 'Técnico', demands: 8 },
                  { name: 'Pedro Oliveira', role: 'Técnico', demands: 15 },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                    <UserAvatar name={member.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant="outline">{member.demands} demandas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Categorias</CardTitle>
                  <CardDescription>Tipos de ocorrência gerenciados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {secCategories.map((category) => {
                  const count = secDemands.filter(d => d.categoryId === category.id).length
                  return (
                    <div key={category.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm text-muted-foreground">SLA: {category.slaDays || Math.ceil(category.slaHours / 24)} dias</span>
                        <Badge variant="outline">{count} demandas</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {secretaria.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{secretaria.phone}</span>
              </div>
            )}
            {secretaria.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{secretaria.email}</span>
              </div>
            )}
            {secretaria.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{secretaria.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
