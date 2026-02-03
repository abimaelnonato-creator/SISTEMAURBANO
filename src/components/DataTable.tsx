// ============================================
// DATA TABLE ENTERPRISE
// Sistema de Gestão Urbana Parnamirim
// ============================================

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRefresh?: () => void;
  exportable?: boolean;
  title?: string;
  description?: string;
  toolbar?: React.ReactNode;
  className?: string;
  striped?: boolean;
  compact?: boolean;
}

export default function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading,
  pagination,
  onRowClick,
  selectable,
  onSelectionChange,
  actions,
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon,
  onRefresh,
  exportable,
  title,
  description,
  toolbar,
  className,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const visibleColumns = useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns]
  );

  const handleSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const processedData = useMemo(() => {
    let result = [...data];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        visibleColumns.some((col) =>
          String((row as any)[col.key]).toLowerCase().includes(q)
        )
      );
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortKey];
        const bVal = (b as any)[sortKey];
        const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, visibleColumns]);

  const handleSelectAll = useCallback(() => {
    if (selected.size === processedData.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(processedData.map((r) => r.id));
      setSelected(all);
      onSelectionChange?.(processedData);
    }
  }, [selected.size, processedData, onSelectionChange]);

  const handleSelect = useCallback(
    (id: string | number) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelected(next);
      onSelectionChange?.(processedData.filter((r) => next.has(r.id)));
    },
    [selected, processedData, onSelectionChange]
  );

  const exportCSV = useCallback(() => {
    const headers = visibleColumns.map((c) => c.title).join(',');
    const rows = processedData.map((row) =>
      visibleColumns
        .map((c) => {
          const val = (row as any)[c.key];
          // Escape quotes and wrap in quotes if contains comma
          const str = String(val ?? '');
          if (str.includes(',') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, processedData]);

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;

  const colSpan =
    visibleColumns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm border overflow-hidden',
        className
      )}
    >
      {/* Header */}
      {(title || description || toolbar || onRefresh || exportable) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
          <div>
            {title && <h3 className="font-semibold text-lg">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {toolbar}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={cn('h-4 w-4', loading && 'animate-spin')}
                />
              </Button>
            )}
            {exportable && (
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {selectable && selected.size > 0 && (
          <span className="text-sm text-muted-foreground">
            {selected.size} selecionado(s)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === processedData.length &&
                      processedData.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-input"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                    compact ? 'py-2' : 'py-3',
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                        ? 'text-right'
                        : 'text-left',
                    col.sortable && 'cursor-pointer hover:bg-muted transition-colors'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.title}
                    {col.sortable && (
                      <span className="text-muted-foreground/50">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="w-12 px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12 text-center">
                  <RefreshCw className="animate-spin mx-auto text-muted-foreground h-6 w-6" />
                  <p className="text-muted-foreground mt-2">Carregando...</p>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {emptyIcon && <div className="mb-2">{emptyIcon}</div>}
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer',
                    selected.has(row.id) && 'bg-primary/5',
                    striped && rowIndex % 2 === 1 && 'bg-muted/30',
                    'hover:bg-muted/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td
                      className={cn('px-4', compact ? 'py-2' : 'py-3')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => handleSelect(row.id)}
                        className="rounded border-input"
                      />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 text-sm',
                        compact ? 'py-2' : 'py-3',
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                            ? 'text-right'
                            : ''
                      )}
                    >
                      {col.render
                        ? col.render((row as any)[col.key], row, rowIndex)
                        : (row as any)[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className={cn('px-4', compact ? 'py-2' : 'py-3')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Mostrar</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(val) => pagination.onLimitChange(Number(val))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>de {pagination.total}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-3 py-1 text-sm">
              {pagination.page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
