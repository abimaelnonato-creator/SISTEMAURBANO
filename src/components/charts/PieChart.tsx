import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  title?: string
  height?: number
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

const COLORS = [
  'hsl(222.2, 47.4%, 37.3%)',
  'hsl(160, 84%, 39%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(262, 83%, 58%)',
  'hsl(142, 71%, 45%)',
  'hsl(215, 16%, 47%)',
]

export function PieChart({
  data,
  title,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                  className="stroke-background"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value, name) => [
                `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            {showLegend && (
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value: string) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  title?: string
  height?: number
  centerLabel?: string
  centerValue?: string | number
}

export function DonutChart({
  data,
  title,
  height = 250,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                    className="stroke-background"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          {(centerLabel || centerValue) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {centerValue && (
                <span className="text-3xl font-bold">{centerValue}</span>
              )}
              {centerLabel && (
                <span className="text-sm text-muted-foreground">{centerLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground truncate">{item.name}</span>
              <span className="text-xs font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
