import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeNames: Record<string, string> = {
  '': 'Dashboard',
  dashboard: 'Dashboard',
  demandas: 'Demandas',
  nova: 'Nova',
  mapa: 'Mapa da Cidade',
  whatsapp: 'WhatsApp',
  secretarias: 'Secretarias',
  secretaries: 'Secretaries',
  seinfra: 'Infraestrutura',
  seilum: 'Iluminação',
  semam: 'Meio Ambiente',
  setrans: 'Trânsito',
  serurb: 'Serviços Urbanos',
  usuarios: 'Usuários',
  configuracoes: 'Configurações',
  relatorios: 'Relatórios',
}

const formatSegment = (segment: string) => {
  if (routeNames[segment]) return routeNames[segment]
  if (/^\d+$/.test(segment)) return `#${segment}`
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function Breadcrumbs() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  if (pathSegments.length === 0) return null

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link to="/" className="inline-flex items-center gap-1 text-foreground hover:text-primary">
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Início</span>
      </Link>
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`
        const isLast = index === pathSegments.length - 1
        const name = formatSegment(segment)

        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link to={path} className="text-foreground hover:text-primary">
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
