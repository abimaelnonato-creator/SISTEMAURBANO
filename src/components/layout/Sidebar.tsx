import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Map,
  FileText,
  Building2,
  Users,
  BarChart3,
  Settings,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  TreePine,
  Trees,
  AlertTriangle,
  ListOrdered,
  Monitor,
  Shield,
  Sparkles,
  Network,
  Database,
  Boxes,
  Brain,
  Layers,
  Trash2,
  Droplets,
  Store,
  Phone,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
  children?: NavItem[]
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Mapa da Cidade',
    href: '/mapa',
    icon: <Map className="h-5 w-5" />,
  },
  {
    title: 'Demandas',
    href: '/demandas',
    icon: <FileText className="h-5 w-5" />,
    badge: 23,
  },
]

const smartCityNavItems: NavItem[] = [
  {
    title: 'Gêmeo Digital 3D',
    href: '/digital-twin',
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: 'Foundry Urbano',
    href: '/foundry-urbano',
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: 'Cidade Digital 3D',
    href: '/cidade-digital',
    icon: <Boxes className="h-5 w-5" />,
  },
  {
    title: 'Hub de Integrações',
    href: '/integracoes',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'Ontologia Urbana',
    href: '/ontologia',
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: 'Priorização',
    href: '/priorizacao',
    icon: <ListOrdered className="h-5 w-5" />,
  },
  {
    title: 'Monitoramento',
    href: '/monitoramento',
    icon: <Monitor className="h-5 w-5" />,
  },
  {
    title: 'Gabinete de Crise',
    href: '/crise',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: 'Assistente IA',
    href: '/assistente',
    icon: <Sparkles className="h-5 w-5" />,
  },
]

// Categorias SEMSUR - Serviços oferecidos
const semsurNavItems: NavItem[] = [
  {
    title: 'Iluminação',
    href: '/demandas?categoria=iluminacao',
    icon: <Lightbulb className="h-5 w-5" />,
  },
  {
    title: 'Limpeza Urbana',
    href: '/demandas?categoria=limpeza',
    icon: <Trash2 className="h-5 w-5" />,
  },
  {
    title: 'Praças/Jardins',
    href: '/demandas?categoria=pracas',
    icon: <Trees className="h-5 w-5" />,
  },
  {
    title: 'Drenagem',
    href: '/demandas?categoria=drenagem',
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    title: 'Mercados',
    href: '/demandas?categoria=mercados',
    icon: <Store className="h-5 w-5" />,
  },
]

const adminNavItems: NavItem[] = [
  {
    title: 'Usuários',
    href: '/usuarios',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'WhatsApp',
    href: '/whatsapp',
    icon: <MessageCircle className="h-5 w-5" />,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar() {
  const location = useLocation()
  // Usar seletores individuais para evitar re-renders desnecessários
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const user = useAuthStore((state) => state.user)

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return location.pathname + location.search === href
    }
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)

    const linkContent = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-white/20 text-white shadow-md backdrop-blur-sm'
            : 'text-white/80 hover:bg-white/15 hover:text-white'
        )}
      >
        {item.icon}
        {!sidebarCollapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-medium',
                active ? 'bg-white text-primary-700' : 'bg-secondary-200 text-secondary-900'
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )

    if (sidebarCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-200 text-xs text-secondary-900">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col shadow-sidebar transition-all duration-300 bg-gradient-parnamirim text-primary-50',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        {/* Logo SEMSUR */}
        <div className={cn(
          'flex h-16 items-center border-b border-white/10 px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'
        )}>
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <div className="text-sm font-bold tracking-wide text-white">SEMSUR</div>
                <div className="text-[11px] uppercase text-yellow-300 font-medium">Serviços Urbanos</div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Main Navigation */}
            {!sidebarCollapsed && (
              <span className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-blue-200">
                Menu Principal
              </span>
            )}
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            <Separator className="my-3 border-white/10" />

            {/* Smart City */}
            {!sidebarCollapsed && (
              <span className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-blue-200">
                Smart City
              </span>
            )}
            {smartCityNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            <Separator className="my-3 border-white/10" />

            {/* Serviços SEMSUR */}
            {!sidebarCollapsed && (
              <span className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-blue-200">
                Serviços SEMSUR
              </span>
            )}
            {semsurNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            <Separator className="my-3 border-white/10" />

            {/* Admin */}
            {(user?.role === 'admin' || user?.role === 'secretario') && (
              <>
                {!sidebarCollapsed && (
                  <span className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-blue-200">
                    Administração
                  </span>
                )}
                {adminNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Urgent Demands Alert */}
        {!sidebarCollapsed && (
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/15 p-3 text-white backdrop-blur-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-300" />
              <div className="flex-1 text-xs">
                <p className="font-semibold">5 demandas urgentes</p>
                <p className="text-white/70">Aguardando ação</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-white hover:bg-white/10"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Recolher menu</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
