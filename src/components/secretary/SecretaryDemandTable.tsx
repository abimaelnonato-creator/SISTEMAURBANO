import { Link } from 'react-router-dom'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { cn, formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils'
import type { Demand } from '@/types'

interface SecretaryDemandTableProps {
  demands: Demand[]
}

export function SecretaryDemandTable({ demands }: SecretaryDemandTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Protocolo</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Bairro</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {demands.slice(0, 8).map((demand) => (
          <TableRow key={demand.id}>
            <TableCell className="font-mono text-sm">#{demand.protocol}</TableCell>
            <TableCell>{demand.title}</TableCell>
            <TableCell>
              <Badge className={cn('text-xs', getStatusColor(demand.status))}>
                {demand.status === 'aberta' && 'Aberta'}
                {demand.status === 'em_andamento' && 'Em andamento'}
                {demand.status === 'resolvida' && 'Resolvida'}
                {demand.status === 'arquivada' && 'Arquivada'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={cn('text-xs', getPriorityColor(demand.priority))}>
                {demand.priority}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{demand.neighborhood}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(demand.createdAt)}</TableCell>
            <TableCell>
              <Link to={`/demandas/${demand.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
