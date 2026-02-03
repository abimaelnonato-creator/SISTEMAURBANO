import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Agora mesmo'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `Há ${hours} hora${hours > 1 ? 's' : ''}`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `Há ${days} dia${days > 1 ? 's' : ''}`
  } else {
    return formatDate(d)
  }
}

export function generateProtocol(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `${year}${random}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    aberta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    resolvida: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    arquivada: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  return colors[status] || colors.aberta
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    baixa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    urgente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }
  return colors[priority] || colors.media
}

/**
 * Gera URL completa para arquivos de upload
 * O VITE_API_URL inclui /api/v1, mas uploads estão na raiz do servidor
 */
export function getUploadUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  // Extrair URL base do VITE_API_URL removendo /api/v1
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
  const baseUrl = apiUrl.replace(/\/api\/v\d+$/, '').replace(/\/api$/, '')
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`
}
