import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Clock, CheckCircle2, Activity } from 'lucide-react'

interface SecretaryKPICardsProps {
  stats: {
    total: number
    abertas: number
    emAndamento: number
    resolvidas: number
    resolucao: number
    tempoMedioHoras: number
  }
}

export function SecretaryKPICards({ stats }: SecretaryKPICardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Abertas</p>
              <p className="text-2xl font-bold">{stats.abertas}</p>
            </div>
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolvidas</p>
              <p className="text-2xl font-bold">{stats.resolvidas}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <Progress value={stats.resolucao} className="h-2 mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tempo Médio</p>
              <p className="text-2xl font-bold">{Math.round(stats.tempoMedioHoras)}h</p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
