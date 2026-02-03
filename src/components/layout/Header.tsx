import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Command,
  FileText,
  Map,
  Building2,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

export function Header() {
  const navigate = useNavigate()
  
  // Usar seletores individuais para evitar re-renders desnecessários
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const globalSearchOpen = useAppStore((state) => state.globalSearchOpen)
  const setGlobalSearchOpen = useAppStore((state) => state.setGlobalSearchOpen)
  const notifications = useAppStore((state) => state.notifications)
  const unreadCount = useAppStore((state) => state.unreadCount)
  const markAsRead = useAppStore((state) => state.markAsRead)
  const markAllAsRead = useAppStore((state) => state.markAllAsRead)
  
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/demandas?search=${encodeURIComponent(searchQuery)}`)
      setGlobalSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Mock search results
  const searchResults = [
    { type: 'demand', title: 'Buraco na Rua Principal', protocol: '2026000001', href: '/demandas/1' },
    { type: 'demand', title: 'Poste com lâmpada queimada', protocol: '2026000002', href: '/demandas/2' },
    { type: 'page', title: 'Mapa da Cidade', href: '/mapa' },
    { type: 'page', title: 'Dashboard', href: '/dashboard' },
  ]

  const filteredResults = searchQuery
    ? searchResults.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.protocol && r.protocol.includes(searchQuery))
      )
    : []

  return (
    <>
      <header className={cn(
        'fixed top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-gradient-header px-4 text-white transition-all duration-300 backdrop-blur',
        sidebarCollapsed ? 'left-16' : 'left-72',
        'right-0'
      )}>
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Button
            variant="outline"
            className="w-full justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setGlobalSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Buscar demandas, protocolos...</span>
            <span className="sm:hidden">Buscar...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden sm:flex text-white hover:bg-white/10"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-200 text-[10px] font-medium text-secondary-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={markAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 cursor-pointer',
                        !notification.isRead && 'bg-accent/50'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={notification.type === 'error' ? 'danger' : 'info'} className="text-[10px]">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full text-white hover:bg-white/10">
                <UserAvatar name={user?.name || 'Usuário'} size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-[10px] mt-1">
                    {user?.role === 'admin' && 'Administrador'}
                    {user?.role === 'secretario' && 'Secretário'}
                    {user?.role === 'operador' && 'Operador'}
                    {user?.role === 'visualizador' && 'Visualizador'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Ajuda
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Dialog */}
      <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="sr-only">Buscar</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch}>
            <div className="flex items-center border-b px-4 pb-4">
              <Search className="mr-2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar demandas, protocolos, endereços..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>
          </form>
          
          {searchQuery && (
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {filteredResults.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado
                  </p>
                ) : (
                  filteredResults.map((result, index) => (
                    <button
                      key={index}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                      onClick={() => {
                        navigate(result.href)
                        setGlobalSearchOpen(false)
                        setSearchQuery('')
                      }}
                    >
                      {result.type === 'demand' ? (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      ) : result.href === '/mapa' ? (
                        <Map className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{result.title}</p>
                        {result.protocol && (
                          <p className="text-xs text-muted-foreground">
                            Protocolo: {result.protocol}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {!searchQuery && (
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Atalhos rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    navigate('/demandas/nova')
                    setGlobalSearchOpen(false)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Nova Demanda
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    navigate('/mapa')
                    setGlobalSearchOpen(false)
                  }}
                >
                  <Map className="mr-2 h-4 w-4" />
                  Mapa da Cidade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
