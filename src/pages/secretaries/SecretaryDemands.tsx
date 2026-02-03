import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { SecretaryDemandTable } from '@/components/secretary/SecretaryDemandTable'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function SecretaryDemandsPage() {
  const { id } = useParams()
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)

  const secDemands = useMemo(() => demands.filter((d) => d.secretariaId === id), [demands, id])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Demandas da secretaria</h1>
        <p className="text-muted-foreground">Lista com últimas demandas vinculadas</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandas recentes</CardTitle>
          <CardDescription>Mock com dados simulados</CardDescription>
        </CardHeader>
        <CardContent>
          <SecretaryDemandTable demands={secDemands} />
        </CardContent>
      </Card>
    </div>
  )
}

export default SecretaryDemandsPage
