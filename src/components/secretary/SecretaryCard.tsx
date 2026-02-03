import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { Secretaria } from '@/types'

export interface SecretaryCardProps {
  secretary: Secretaria & {
    stats: {
      total: number
      abertas: number
      emAndamento: number
      resolvidas: number
      urgentes: number
      resolucao: number
    }
  }
}

export function SecretaryCard({ secretary }: SecretaryCardProps) {
  return (
    <Card className="overflow-hidden h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${secretary.color || '#2563eb'}20` }}
            >
              <span className="text-sm font-semibold" style={{ color: secretary.color || '#2563eb' }}>
                {secretary.acronym || secretary.slug}
              </span>
            </div>
            <div>
              <CardTitle className="text-base">{secretary.name}</CardTitle>
              <CardDescription className="text-xs">{secretary.slug}</CardDescription>
            </div>
          </div>
          {secretary.stats.urgentes > 0 && (
            <Badge variant="danger" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {secretary.stats.urgentes} urgente{secretary.stats.urgentes > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{secretary.stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <p className="text-lg font-bold text-amber-600">{secretary.stats.abertas}</p>
            <p className="text-xs text-muted-foreground">Abertas</p>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{secretary.stats.emAndamento}</p>
            <p className="text-xs text-muted-foreground">Andamento</p>
          </div>
          <div className="p-2 bg-green-500/10 rounded-lg">
            <p className="text-lg font-bold text-green-600">{secretary.stats.resolvidas}</p>
            <p className="text-xs text-muted-foreground">Resolvidas</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de resolução</span>
            <span className="font-medium">{secretary.stats.resolucao}%</span>
          </div>
          <Progress value={secretary.stats.resolucao} className="h-2" />
        </div>

        <Link to={`/secretaries/${secretary.id}`}>
          <Button variant="outline" className="w-full">
            Ver detalhes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
