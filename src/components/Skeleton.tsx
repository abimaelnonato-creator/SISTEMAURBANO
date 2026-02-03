// ============================================
// SKELETON LOADERS
// Sistema de Gestão Urbana Parnamirim
// ============================================

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rounded',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-muted',
        animate && 'animate-pulse',
        variants[variant],
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
      }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={14}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl p-6 border',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={32} />
          <Skeleton width={120} height={14} />
        </div>
        <Skeleton variant="rounded" width={48} height={48} />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b">
        <Skeleton width={200} height={32} />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton
                key={j}
                width={j === 0 ? 120 : undefined}
                height={16}
                className="flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <SkeletonAvatar size={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={12} />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({
  height = 250,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn('bg-card rounded-xl p-6 border', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={150} height={20} />
        <Skeleton width={80} height={28} />
      </div>
      <Skeleton height={height} />
    </div>
  );
}

export function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Table */}
      <SkeletonTable />
    </div>
  );
}

export function SkeletonForm({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width={100} height={14} />
          <Skeleton height={40} />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton width={100} height={40} />
        <Skeleton width={80} height={40} />
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl p-6 border', className)}>
      <div className="flex flex-col items-center text-center">
        <SkeletonAvatar size={96} className="mb-4" />
        <Skeleton width={150} height={20} className="mb-2" />
        <Skeleton width={100} height={14} className="mb-4" />
        <div className="flex gap-4 w-full justify-center">
          <div className="text-center">
            <Skeleton width={40} height={24} className="mx-auto mb-1" />
            <Skeleton width={60} height={12} className="mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton width={40} height={24} className="mx-auto mb-1" />
            <Skeleton width={60} height={12} className="mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton width={40} height={24} className="mx-auto mb-1" />
            <Skeleton width={60} height={12} className="mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-muted rounded-xl animate-pulse relative overflow-hidden',
        className
      )}
      style={{ height: 400 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-2" />
          <Skeleton width={120} height={14} className="mx-auto" />
        </div>
      </div>
    </div>
  );
}
