import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SecretarySettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Configurações da secretaria</h1>
        <p className="text-muted-foreground">Ajustes simulados de contato e SLA</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados de contato</CardTitle>
          <CardDescription>Mock – sem persistência real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Telefone</Label>
            <Input placeholder="(84) 99999-0000" />
          </div>
          <div className="space-y-1">
            <Label>E-mail</Label>
            <Input placeholder="secretaria@parnamirim.rn.gov.br" />
          </div>
          <div className="space-y-1">
            <Label>SLA padrão (horas)</Label>
            <Input placeholder="48" />
          </div>
          <Button>Salvar mock</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecretarySettingsPage
