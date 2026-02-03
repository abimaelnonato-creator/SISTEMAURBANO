import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BarChartProps {
  data: Array<Record<string, unknown>>
  title?: string
  xAxisKey: string
  bars: Array<{
    dataKey: string
    name: string
    color: string
    stackId?: string
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  layout?: 'horizontal' | 'vertical'
}

export function BarChart({
  data,
  title,
  xAxisKey,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
}: BarChartProps) {
  const isVertical = layout === 'vertical'

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart 
            data={data} 
            layout={layout}
            margin={{ top: 5, right: 30, left: isVertical ? 80 : 0, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            {isVertical ? (
              <>
                <XAxis type="number" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey={xAxisKey} 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />
              </>
            ) : (
              <>
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
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            {showLegend && <Legend />}
            {bars.map((bar) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color}
                stackId={bar.stackId}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number; color?: string }>
  title?: string
  height?: number
  showValues?: boolean
}

export function SimpleBarChart({
  data,
  title,
  height = 300,
  showValues: _showValues = true,
}: SimpleBarChartProps) {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              width={75}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]} 
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
