import { DemandStatus, Priority } from '@prisma/client'

export class SecretaryQuickStatsDto {
  total!: number
  open!: number
  inProgress!: number
  resolved!: number
  critical!: number
  overdue!: number
  resolutionRate!: number
}

export class StatusBreakdownDto {
  status!: DemandStatus
  count!: number
}

export class PriorityBreakdownDto {
  priority!: Priority
  count!: number
}

export class CategoryBreakdownDto {
  categoryId!: string
  category!: string
  count!: number
}

export class TimelinePointDto {
  date!: string
  count!: number
}

export class TopCategoryDto {
  category!: string
  count!: number
}

export class SecretaryDetailedStatsDto {
  byStatus!: StatusBreakdownDto[]
  byPriority!: PriorityBreakdownDto[]
  byCategory!: CategoryBreakdownDto[]
  timeline!: TimelinePointDto[]
  avgResolutionTimeHours!: number
  topCategories!: TopCategoryDto[]
}
