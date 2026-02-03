import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  Edit,
  CheckCircle,
  MessageSquare,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityType =
  | 'demand_created'
  | 'demand_updated'
  | 'demand_resolved'
  | 'comment_added'
  | 'user_assigned'

interface ActivityUser {
  name: string
  avatar?: string
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  user?: ActivityUser
  metadata?: Record<string, unknown>
  timestamp: Date | string
}

interface ActivityFeedProps {
  limit?: number
  activities?: Activity[]
  socketUrl?: string
}

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  demand_created: Plus,
  demand_updated: Edit,
  demand_resolved: CheckCircle,
  comment_added: MessageSquare,
  user_assigned: User,
}

const activityColors: Record<ActivityType, string> = {
  demand_created: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  demand_updated: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  demand_resolved: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  comment_added: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  user_assigned: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function ActivityFeed({ limit = 20, activities: externalActivities, socketUrl }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(externalActivities ?? [])
  const [isConnected, setIsConnected] = useState(false)

  const addActivity = useCallback(
    (activity: Activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, limit))
    },
    [limit]
  )

  useEffect(() => {
    if (externalActivities) {
      setActivities(externalActivities)
    }
  }, [externalActivities])

  useEffect(() => {
    if (!socketUrl) return

    let socket: WebSocket | null = null

    const connect = () => {
      socket = new WebSocket(socketUrl)

      socket.onopen = () => {
        setIsConnected(true)
      }

      socket.onclose = () => {
        setIsConnected(false)
        setTimeout(connect, 3000)
      }

      socket.onerror = () => {
        socket?.close()
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Activity
          addActivity(data)
        } catch {
          console.warn('Failed to parse activity message')
        }
      }
    }

    connect()

    return () => {
      socket?.close()
    }
  }, [addActivity, socketUrl])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Atividade em Tempo Real
        </h3>
        {socketUrl && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              )}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-slate-400">
            <Clock className="mb-2 h-6 w-6" />
            Aguardando atividades...
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type] ?? Plus
            const colorClass = activityColors[activity.type] ?? 'bg-slate-100 text-slate-600'

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full', colorClass)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{activity.title}</p>
                  {activity.description && (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {activity.user && (
                      <>
                        <span>{activity.user.name}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex-shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
