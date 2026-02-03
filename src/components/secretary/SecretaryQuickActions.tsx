import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Plus, FileText, MapPin, Settings } from 'lucide-react'

interface SecretaryQuickActionsProps {
  secretaryId: string
}

export function SecretaryQuickActions({ secretaryId }: SecretaryQuickActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Button variant="outline" asChild>
        <Link to={`/demandas/nova?secretaria=${secretaryId}`}>
          <Plus className="mr-2 h-4 w-4" /> Nova demanda
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to={`/demandas?secretaria=${secretaryId}`}>
          <FileText className="mr-2 h-4 w-4" /> Ver demandas
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to={`/mapa?secretaria=${secretaryId}`}>
          <MapPin className="mr-2 h-4 w-4" /> Ver no mapa
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to={`/secretaries/${secretaryId}/settings`}>
          <Settings className="mr-2 h-4 w-4" /> Configurar
        </Link>
      </Button>
    </div>
  )
}
