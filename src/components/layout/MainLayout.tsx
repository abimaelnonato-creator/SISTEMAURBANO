import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import { CommandPalette } from '@/components/CommandPalette'
import Breadcrumbs from '@/components/Breadcrumbs'

export function MainLayout() {
  // Usar seletores individuais para evitar re-renders desnecessários
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
            'min-h-screen pt-20 transition-all duration-300',
            sidebarCollapsed ? 'pl-16' : 'pl-72'
        )}
      >
        <div className="p-6">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  )
}
