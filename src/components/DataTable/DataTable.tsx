import { useMemo, useState } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Filter,
  Columns as ColumnsIcon,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T extends { id: string | number }> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}

export interface DataTableProps<T extends { id: string | number }> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  onRowClick?: (row: T) => void
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
  exportFileName?: string
  onRefresh?: () => void
}

export default function DataTable<T extends { id: string | number }>(props: DataTableProps<T>) {
  const {
    data,
    columns,
    loading,
    pagination,
    onRowClick,
    selectable,
    onSelectionChange,
    actions,
    emptyMessage = 'Nenhum registro encontrado',
    exportFileName = 'export',
    onRefresh,
  } = props

  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(columns.filter((col) => !col.hidden).map((col) => String(col.key)))
  )
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const processedData = useMemo(() => {
    let result = [...data]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((row) =>
        columns.some((col) => {
          const value = (row as Record<string, unknown>)[String(col.key)]
          return value?.toString().toLowerCase().includes(term)
        })
      )
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey]
        const bVal = (b as Record<string, unknown>)[sortKey]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return -1
        if (bVal == null) return 1
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [columns, data, searchTerm, sortDirection, sortKey])

  const handleSelectAll = () => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(processedData.map((row) => row.id))
      setSelectedRows(allIds)
      onSelectionChange?.(processedData)
    }
  }

  const handleSelectRow = (id: string | number) => {
    const updated = new Set(selectedRows)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setSelectedRows(updated)
    onSelectionChange?.(processedData.filter((row) => updated.has(row.id)))
  }

  const handleExport = (format: 'csv' | 'json') => {
    const exportData = processedData.map((row) => {
      const entry: Record<string, unknown> = {}
      columns.forEach((col) => {
        if (visibleColumns.has(String(col.key))) {
          entry[col.title] = (row as Record<string, unknown>)[String(col.key)]
        }
      })
      return entry
    })

    let content: string
    let mimeType: string
    let extension: string

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {}).join(',')
      const rows = exportData.map((row) => Object.values(row).join(','))
      content = [headers, ...rows].join('\n')
      mimeType = 'text/csv'
      extension = 'csv'
    } else {
      content = JSON.stringify(exportData, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFileName}-${new Date().toISOString().split('T')[0]}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const visibleCols = columns.filter((col) => visibleColumns.has(String(col.key)))
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectable && selectedRows.size > 0 && (
            <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {selectedRows.size} selecionado(s)
            </div>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              title="Recarregar"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
              showFilters
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'
            )}
            title="Filtros"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnSelector((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
                showColumnSelector
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'
              )}
              title="Colunas"
            >
              <ColumnsIcon className="h-4 w-4" />
              Colunas
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Visibilidade</div>
                <div className="space-y-2">
                  {columns.map((col) => (
                    <label key={String(col.key)} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-100">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(String(col.key))}
                        onChange={() => {
                          const updated = new Set(visibleColumns)
                          if (updated.has(String(col.key))) {
                            updated.delete(String(col.key))
                          } else {
                            updated.add(String(col.key))
                          }
                          setVisibleColumns(updated)
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      {col.title}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
          Estruture aqui filtros adicionais (datas, status, etc.).
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </th>
              )}
              {visibleCols.map((col) => {
                const isSorted = sortKey === String(col.key)
                return (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'select-none px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                      col.sortable && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <span className="inline-flex items-center gap-2">
                      {col.title}
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronsUpDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
              {actions && <th className="w-12 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Ações</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white text-slate-900 dark:divide-slate-800 dark:bg-slate-900 dark:text-slate-50">
            {loading ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-500">
                  Carregando...
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                    onRowClick && 'cursor-pointer',
                    selectedRows.has(row.id) && 'bg-primary/5'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>
                  )}

                  {visibleCols.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-sm',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      )}
                    >
                      {col.render ? col.render((row as Record<string, unknown>)[String(col.key)], row) : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                      {actions(row) ?? (
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={pagination.limit}
              onChange={(event) => pagination.onLimitChange(Number(event.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus:border-primary focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              {[10, 20, 50, 100].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>de {pagination.total} registros</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const pageNumber = index + 1
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => pagination.onPageChange(pageNumber)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition',
                      pagination.page === pageNumber
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
