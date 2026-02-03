import { useState } from 'react'
import { secretarias } from '@/data/mockData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChartIcon,
  Printer,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data para relatórios
const monthlyData = [
  { name: 'Jan', abertas: 145, resolvidas: 128, tempo: 4.2 },
  { name: 'Fev', abertas: 162, resolvidas: 145, tempo: 3.8 },
  { name: 'Mar', abertas: 138, resolvidas: 142, tempo: 3.5 },
  { name: 'Abr', abertas: 175, resolvidas: 155, tempo: 4.0 },
  { name: 'Mai', abertas: 158, resolvidas: 162, tempo: 3.2 },
  { name: 'Jun', abertas: 185, resolvidas: 168, tempo: 3.6 },
]

const categoryData = [
  { name: 'Buracos', value: 245 },
  { name: 'Iluminação', value: 189 },
  { name: 'Limpeza', value: 156 },
  { name: 'Esgoto', value: 134 },
  { name: 'Trânsito', value: 98 },
]

const priorityData = [
  { name: 'Baixa', value: 180, color: '#22c55e' },
  { name: 'Média', value: 320, color: '#3b82f6' },
  { name: 'Alta', value: 150, color: '#f59e0b' },
  { name: 'Urgente', value: 50, color: '#ef4444' },
]

const neighborhoodData = [
  { name: 'Nova Parnamirim', value: 145 },
  { name: 'Parque das Nações', value: 128 },
  { name: 'Emaús', value: 112 },
  { name: 'Rosa dos Ventos', value: 98 },
  { name: 'Pium', value: 87 },
  { name: 'Monte Castelo', value: 76 },
  { name: 'Centro', value: 72 },
  { name: 'Passagem de Areia', value: 65 },
]

const sourceData = [
  { name: 'App', value: 280, color: '#3b82f6' },
  { name: 'Telefone', value: 220, color: '#22c55e' },
  { name: 'Presencial', value: 120, color: '#f59e0b' },
  { name: 'Site', value: 80, color: '#8b5cf6' },
]

export function RelatoriosPage() {
  const [period, setPeriod] = useState('30d')
  const [secretariaFilter, setSecretariaFilter] = useState('all')
  const [reportType, setReportType] = useState('geral')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e indicadores de desempenho
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Secretaria</Label>
              <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as secretarias</SelectItem>
                  {secretarias.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Visão Geral</SelectItem>
                  <SelectItem value="demandas">Demandas</SelectItem>
                  <SelectItem value="desempenho">Desempenho</SelectItem>
                  <SelectItem value="geografico">Geográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Demandas</p>
                <p className="text-3xl font-bold">963</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                <p className="text-3xl font-bold">87.3%</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">+3.2%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-3xl font-bold">3.6 dias</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-green-600">-0.8 dias</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Cumprido</p>
                <p className="text-3xl font-bold">92.1%</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">+1.5%</span>
              <span className="text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="geographic" className="gap-2">
            <MapPin className="h-4 w-4" />
            Geográfico
          </TabsTrigger>
          <TabsTrigger value="secretarias" className="gap-2">
            <Building2 className="h-4 w-4" />
            Secretarias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
                  height={280}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tempo Médio de Resolução</CardTitle>
                <CardDescription>Dias para resolver demandas</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={monthlyData}
                  bars={[{ dataKey: 'tempo', name: 'Dias', color: '#3b82f6' }]}
                  xAxisKey="name"
                  height={280}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Origem das Demandas</CardTitle>
                <CardDescription>Canais de entrada</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={sourceData} height={280} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Prioridade</CardTitle>
                <CardDescription>Distribuição por nível de prioridade</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={priorityData} height={280} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Categorias</CardTitle>
                <CardDescription>Tipos de ocorrência mais frequentes</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={categoryData}
                  bars={[{ dataKey: 'value', name: 'Demandas', color: '#1E40AF' }]}
                  xAxisKey="name"
                  height={300}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">% Total</TableHead>
                      <TableHead className="text-right">Resolvidas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.map((cat, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">{cat.value}</TableCell>
                        <TableCell className="text-right">
                          {((cat.value / 822) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {Math.round(cat.value * 0.85)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demandas por Bairro</CardTitle>
                <CardDescription>Distribuição geográfica</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={neighborhoodData}
                  bars={[{ dataKey: 'value', name: 'Demandas', color: '#6366f1' }]}
                  xAxisKey="name"
                  height={350}
                  layout="vertical"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Bairros</CardTitle>
                <CardDescription>Ordenado por número de demandas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {neighborhoodData.map((bairro, index) => (
                    <div key={bairro.name} className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{bairro.name}</span>
                          <span className="text-sm text-muted-foreground">{bairro.value}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(bairro.value / neighborhoodData[0].value) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="secretarias" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desempenho por Secretaria</CardTitle>
              <CardDescription>Comparativo de indicadores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Secretaria</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Abertas</TableHead>
                    <TableHead className="text-right">Andamento</TableHead>
                    <TableHead className="text-right">Resolvidas</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead className="text-right">Tempo Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secretarias.map((sec) => (
                    <TableRow key={sec.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sec.color }}
                          />
                          <span className="font-medium">{sec.acronym || sec.name.split(' ').map(w => w[0]).join('')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Math.round(Math.random() * 150 + 50)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600">
                        {Math.round(Math.random() * 20 + 5)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {Math.round(Math.random() * 15 + 3)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {Math.round(Math.random() * 100 + 40)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            Math.random() > 0.3 
                              ? 'text-green-600 border-green-600' 
                              : 'text-amber-600 border-amber-600'
                          )}
                        >
                          {(Math.random() * 20 + 75).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(Math.random() * 3 + 2).toFixed(1)} dias
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
