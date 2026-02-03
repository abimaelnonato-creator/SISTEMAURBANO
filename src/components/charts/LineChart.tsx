import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LineChartProps {
  data: Array<Record<string, string | number>>
  title?: string
  xAxisKey: string
  lines: Array<{
    dataKey: string
    name: string
    color: string
    strokeWidth?: number
  }>
  height?: number
  showGrid?: boolean
  showLegend?: boolean
}

export function LineChart({
  data,
  title,
  xAxisKey,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
}: LineChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
            {showLegend && <Legend />}
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color}
                strokeWidth={line.strokeWidth || 2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
