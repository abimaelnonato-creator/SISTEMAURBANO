import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const mockTeam = [
  { id: '1', name: 'Coordenador', role: 'Coordenador', resolved: 42, pending: 5 },
  { id: '2', name: 'Operador A', role: 'Operador', resolved: 30, pending: 8 },
  { id: '3', name: 'Operador B', role: 'Operador', resolved: 24, pending: 6 },
]

export function SecretaryTeamPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Equipe da secretaria</h1>
        <p className="text-muted-foreground">Mock para gestão de time</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockTeam.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="text-base">{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge variant="outline">{member.resolved} resolvidas</Badge>
              <Badge variant="outline">{member.pending} pendentes</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SecretaryTeamPage
