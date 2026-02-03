import { cn } from '@/lib/utils'

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded'
type SkeletonAnimation = 'pulse' | 'wave' | 'none'

interface SkeletonProps {
  className?: string
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  animation?: SkeletonAnimation
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg',
}

const animationClasses: Record<SkeletonAnimation, string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer',
  none: '',
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-slate-200 dark:bg-slate-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton variant="rounded" width="50%" height={14} />
          <Skeleton variant="rounded" width="30%" height={12} />
        </div>
      </div>
      <Skeleton variant="rounded" height={100} />
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
        <Skeleton variant="rounded" width={160} height={18} />
      </div>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {Array.from({ length: cols }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <Skeleton variant="rounded" width="60%" height={14} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton width={colIndex === 0 ? 120 : '80%'} height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface SkeletonChartProps {
  height?: number
}

export function SkeletonChart({ height = 300 }: SkeletonChartProps) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      style={{ height }}
    >
      <Skeleton variant="rounded" width={140} height={18} />
      <div className="mt-auto flex h-full items-end gap-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            width="100%"
            height={`${30 + Math.random() * 60}%`}
          />
        ))}
      </div>
    </div>
  )
}
