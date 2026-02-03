import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { secretarias, categories } from '@/data/mockData'
import { SecretaryStats } from '@/components/secretary/SecretaryStats'
import { SecretaryDemandTable } from '@/components/secretary/SecretaryDemandTable'
import { SecretaryQuickActions } from '@/components/secretary/SecretaryQuickActions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { DonutChart } from '@/components/charts/PieChart'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function SecretaryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const [period] = useState('30d')

  const secretary = useMemo(() => secretarias.find((s) => s.id === id || s.slug === id), [id])

  const secretaryId = secretary?.id || id || ''

  const secDemands = useMemo(() => demands.filter((d) => d.secretariaId === secretaryId), [demands, secretaryId])

  const secCategories = useMemo(
    () => categories.filter((c) => c.secretariaId === secretaryId),
    [secretaryId]
  )

  const stats = useMemo(() => {
    const total = secDemands.length
    const abertas = secDemands.filter((d) => d.status === 'aberta').length
    const emAndamento = secDemands.filter((d) => d.status === 'em_andamento').length
    const resolvidas = secDemands.filter((d) => d.status === 'resolvida').length
    const urgentes = secDemands.filter((d) => d.priority === 'urgente').length
    const atrasadas = secDemands.filter((d) => {
      if (!d.slaDeadline || d.status === 'resolvida') return false
      return new Date(d.slaDeadline) < new Date()
    }).length
    const resolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0
    const tempoMedio = '48h'
    return { total, abertas, emAndamento, resolvidas, urgentes, atrasadas, resolucao, tempoMedio }
  }, [secDemands])

  const monthlyData = [
    { name: 'Ago', abertas: 32, resolvidas: 28 },
    { name: 'Set', abertas: 45, resolvidas: 38 },
    { name: 'Out', abertas: 51, resolvidas: 46 },
    { name: 'Nov', abertas: 58, resolvidas: 52 },
    { name: 'Dez', abertas: 63, resolvidas: 57 },
    { name: 'Jan', abertas: 70, resolvidas: 64 },
  ]

  const priorityData = [
    { name: 'Baixa', value: secDemands.filter((d) => d.priority === 'baixa').length, color: '#22c55e' },
    { name: 'Média', value: secDemands.filter((d) => d.priority === 'media').length, color: '#3b82f6' },
    { name: 'Alta', value: secDemands.filter((d) => d.priority === 'alta').length, color: '#f59e0b' },
    { name: 'Urgente', value: secDemands.filter((d) => d.priority === 'urgente').length, color: '#ef4444' },
  ]

  const categoryData = secCategories
    .map((cat) => ({ name: cat.name, value: secDemands.filter((d) => d.categoryId === cat.id).length }))
    .filter((c) => c.value > 0)

  if (!secretary) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Secretaria não encontrada</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{secretary.name}</h1>
          <p className="text-muted-foreground">KPIs, demandas, equipe e relatórios</p>
        </div>
      </div>

      <SecretaryStats stats={stats} />
      <SecretaryQuickActions secretaryId={secretary.id} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="demands">Demandas</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução</CardTitle>
                <CardDescription>Últimos 6 meses ({period})</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={monthlyData}
                  lines={[
                    { dataKey: 'abertas', name: 'Abertas', color: '#f59e0b' },
                    { dataKey: 'resolvidas', name: 'Resolvidas', color: '#22c55e' },
                  ]}
                  xAxisKey="name"
                  height={260}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Prioridade</CardTitle>
                <CardDescription>Distribuição das demandas</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={priorityData} height={260} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Categoria</CardTitle>
                <CardDescription>Tipos mais frequentes</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={categoryData}
                  bars={[{ dataKey: 'value', name: 'Demandas', color: secretary.color || '#2563eb' }]}
                  xAxisKey="name"
                  height={260}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertas</CardTitle>
                <CardDescription>Urgências e atrasos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{stats.urgentes} urgente(s)</p>
                <p className="text-sm">{stats.atrasadas} fora do SLA</p>
                <p className="text-sm">Período: {period}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demands" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Demandas Recentes</CardTitle>
              <CardDescription>Últimas movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              <SecretaryDemandTable demands={secDemands} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipe (mock)</CardTitle>
              <CardDescription>Use esta aba para gestão futura da equipe</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Integração com usuários/roles pode ser conectada aqui.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SecretaryDetailPage
