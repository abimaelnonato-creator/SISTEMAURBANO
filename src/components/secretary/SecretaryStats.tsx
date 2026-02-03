import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Clock, CheckCircle2, TrendingUp, FileText } from 'lucide-react'

interface SecretaryStatsProps {
  stats: {
    total: number
    abertas: number
    emAndamento: number
    resolvidas: number
    urgentes: number
    atrasadas: number
    resolucao: number
    tempoMedio: string
  }
}

export function SecretaryStats({ stats }: SecretaryStatsProps) {
  return (
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
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          {(stats.urgentes > 0 || stats.atrasadas > 0) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
              {stats.urgentes > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {stats.urgentes} urgente
                </span>
              )}
              {stats.atrasadas > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {stats.atrasadas} atrasada
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
