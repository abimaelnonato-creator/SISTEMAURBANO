import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AreaChartProps {
  data: Array<Record<string, string | number>>
  title?: string
  xAxisKey: string
  areas: Array<{
    dataKey: string
    name: string
    color: string
    fillOpacity?: number
  }>
  height?: number
  showGrid?: boolean
  stacked?: boolean
}

export function AreaChart({
  data,
  title,
  xAxisKey,
  areas,
  height = 300,
  showGrid = true,
  stacked = false,
}: AreaChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {areas.map((area) => (
                <linearGradient
                  key={`gradient-${area.dataKey}`}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={area.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={area.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis
              dataKey={xAxisKey}
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            {areas.map((area) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name}
                stroke={area.color}
                fill={`url(#gradient-${area.dataKey})`}
                fillOpacity={area.fillOpacity || 1}
                stackId={stacked ? 'stack' : undefined}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
