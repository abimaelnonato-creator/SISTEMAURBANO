import { useState } from 'react'
import { Filter, X, Plus, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterCondition {
  field: string
  operator: string
  value: string
}

export interface SavedFilter {
  id: string
  name: string
  conditions: FilterCondition[]
}

type FieldType = 'text' | 'select' | 'date' | 'number'

interface FieldOption {
  value: string
  label: string
}

interface Field {
  key: string
  label: string
  type: FieldType
  options?: FieldOption[]
}

interface AdvancedFiltersProps {
  fields: Field[]
  onApply: (conditions: FilterCondition[]) => void
  savedFilters?: SavedFilter[]
  onSaveFilter?: (filter: SavedFilter) => void
  onDeleteFilter?: (id: string) => void
}

const operators: Record<FieldType, { value: string; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contém' },
    { value: 'equals', label: 'Igual a' },
    { value: 'starts_with', label: 'Começa com' },
    { value: 'ends_with', label: 'Termina com' },
    { value: 'not_contains', label: 'Não contém' },
  ],
  select: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'in', label: 'Um de' },
  ],
  date: [
    { value: 'equals', label: 'Igual a' },
    { value: 'before', label: 'Antes de' },
    { value: 'after', label: 'Depois de' },
    { value: 'between', label: 'Entre' },
    { value: 'last_7_days', label: 'Últimos 7 dias' },
    { value: 'last_30_days', label: 'Últimos 30 dias' },
    { value: 'this_month', label: 'Este mês' },
  ],
  number: [
    { value: 'equals', label: 'Igual a' },
    { value: 'greater_than', label: 'Maior que' },
    { value: 'less_than', label: 'Menor que' },
    { value: 'between', label: 'Entre' },
  ],
}

export default function AdvancedFilters({
  fields,
  onApply,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conditions, setConditions] = useState<FilterCondition[]>([])
  const [filterName, setFilterName] = useState('')

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: fields[0]?.key || '', operator: 'contains', value: '' }])
  }

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    setConditions((prev) => prev.map((condition, i) => (i === index ? { ...condition, ...updates } : condition)))
  }

  const applyFilters = () => {
    onApply(conditions.filter((c) => c.value))
    setIsOpen(false)
  }

  const clearFilters = () => {
    setConditions([])
    onApply([])
  }

  const loadSavedFilter = (filter: SavedFilter) => {
    setConditions(filter.conditions)
  }

  const saveCurrentFilter = () => {
    if (filterName.trim() && conditions.length > 0 && onSaveFilter) {
      onSaveFilter({
        id: crypto.randomUUID(),
        name: filterName.trim(),
        conditions,
      })
      setFilterName('')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
          conditions.length > 0
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'
        )}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {conditions.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
            {conditions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-[600px] rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Filtros Avançados</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {savedFilters.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Filtros Salvos</p>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((saved) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => loadSavedFilter(saved)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {saved.name}
                    {onDeleteFilter && (
                      <X
                        className="h-3.5 w-3.5 text-slate-400 hover:text-red-500"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteFilter(saved.id)
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 space-y-3">
            {conditions.map((condition, index) => {
              const field = fields.find((f) => f.key === condition.field)
              const ops = operators[field?.type || 'text']

              return (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={condition.field}
                    onChange={(event) => updateCondition(index, { field: event.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  >
                    {fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(event) => updateCondition(index, { operator: event.target.value })}
                    className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  >
                    {ops.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {field?.type === 'select' ? (
                    <select
                      value={condition.value}
                      onChange={(event) => updateCondition(index, { value: event.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    >
                      <option value="">Selecione...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field?.type === 'date' ? 'date' : field?.type === 'number' ? 'number' : 'text'}
                      value={condition.value}
                      onChange={(event) => updateCondition(index, { value: event.target.value })}
                      placeholder="Valor..."
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Adicionar condição
          </button>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {onSaveFilter && conditions.length > 0 && (
                <>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(event) => setFilterName(event.target.value)}
                    placeholder="Nome do filtro"
                    className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                  />
                  <button
                    type="button"
                    onClick={saveCurrentFilter}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-primary/10 hover:text-primary"
                    title="Salvar filtro"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
