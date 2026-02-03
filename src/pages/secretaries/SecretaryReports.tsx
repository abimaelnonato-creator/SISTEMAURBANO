import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function SecretaryReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Relatórios da secretaria</h1>
        <p className="text-muted-foreground">Mock de relatórios rápidos</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores principais</CardTitle>
          <CardDescription>Números simulados para acompanhamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Tempo médio de atendimento: 48h</p>
          <p>Taxa de resolução: 78%</p>
          <p>Demandas críticas abertas: 5</p>
          <p>Demandas fora do SLA: 3</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecretaryReportsPage
