import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  )
}

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = 'Carregando...' }: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}
