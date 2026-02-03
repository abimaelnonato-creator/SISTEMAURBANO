import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { secretarias } from '@/data/mockData'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react'

export function SecretariasPage() {
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)

  const secretariasWithStats = useMemo(() => {
    return secretarias.map(sec => {
      const secDemands = demands.filter(d => d.secretariaId === sec.id)
      const total = secDemands.length
      const abertas = secDemands.filter(d => d.status === 'aberta').length
      const emAndamento = secDemands.filter(d => d.status === 'em_andamento').length
      const resolvidas = secDemands.filter(d => d.status === 'resolvida').length
      const urgentes = secDemands.filter(d => d.priority === 'urgente').length
      const resolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0

      return {
        ...sec,
        stats: {
          total,
          abertas,
          emAndamento,
          resolvidas,
          urgentes,
          resolucao,
        },
      }
    })
  }, [demands])

  const totalStats = useMemo(() => ({
    total: demands.length,
    abertas: demands.filter(d => d.status === 'aberta').length,
    emAndamento: demands.filter(d => d.status === 'em_andamento').length,
    resolvidas: demands.filter(d => d.status === 'resolvida').length,
  }), [demands])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Secretarias</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho de cada secretaria
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Secretarias</p>
                <p className="text-2xl font-bold">{secretarias.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Demandas Abertas</p>
                <p className="text-2xl font-bold">{totalStats.abertas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{totalStats.emAndamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolvidas</p>
                <p className="text-2xl font-bold">{totalStats.resolvidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secretarias Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {secretariasWithStats.map((sec) => (
          <Card key={sec.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2.5 rounded-lg"
                    style={{ backgroundColor: `${sec.color}20` }}
                  >
                    <Building2 className="h-5 w-5" style={{ color: sec.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{sec.name}</CardTitle>
                    <CardDescription className="text-xs">{sec.acronym || sec.slug}</CardDescription>
                  </div>
                </div>
                {sec.stats.urgentes > 0 && (
                  <Badge variant="danger" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {sec.stats.urgentes} urgente{sec.stats.urgentes > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold">{sec.stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <p className="text-lg font-bold text-amber-600">{sec.stats.abertas}</p>
                  <p className="text-xs text-muted-foreground">Abertas</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{sec.stats.emAndamento}</p>
                  <p className="text-xs text-muted-foreground">Andamento</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{sec.stats.resolvidas}</p>
                  <p className="text-xs text-muted-foreground">Resolvidas</p>
                </div>
              </div>

              {/* Resolution Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de resolução</span>
                  <span className="font-medium">{sec.stats.resolucao}%</span>
                </div>
                <Progress value={sec.stats.resolucao} className="h-2" />
              </div>

              {/* Contact Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {sec.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{sec.phone}</span>
                  </div>
                )}
                {sec.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{sec.email}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <Link to={`/secretarias/${sec.id}`}>
                <Button variant="outline" className="w-full">
                  Ver detalhes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
