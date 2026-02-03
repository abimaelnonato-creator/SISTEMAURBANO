import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { secretarias } from '@/data/mockData'
import { SecretaryCard } from '@/components/secretary/SecretaryCard'
import { SecretaryKPICards } from '@/components/secretary/SecretaryKPICards'

export function SecretariesIndexPage() {
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)

  const secretariesWithStats = useMemo(() => {
    return secretarias.map((sec) => {
      const secDemands = demands.filter((d) => d.secretariaId === sec.id)
      const total = secDemands.length
      const abertas = secDemands.filter((d) => d.status === 'aberta').length
      const emAndamento = secDemands.filter((d) => d.status === 'em_andamento').length
      const resolvidas = secDemands.filter((d) => d.status === 'resolvida').length
      const urgentes = secDemands.filter((d) => d.priority === 'urgente').length
      const resolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0

      return {
        ...sec,
        stats: {
          total,
          abertas,
          emAndamento,
          resolvidas,
          urgentes,
          resolucao,
        },
      }
    })
  }, [demands])

  const globalStats = useMemo(() => {
    const total = demands.length
    const abertas = demands.filter((d) => d.status === 'aberta').length
    const emAndamento = demands.filter((d) => d.status === 'em_andamento').length
    const resolvidas = demands.filter((d) => d.status === 'resolvida').length
    const resolucao = total > 0 ? Math.round((resolvidas / total) * 100) : 0
    const tempoMedioHoras = 48

    return { total, abertas, emAndamento, resolvidas, resolucao, tempoMedioHoras }
  }, [demands])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Secretarias</h1>
        <p className="text-muted-foreground">Visão geral das secretarias com KPIs e atalhos rápidos</p>
      </div>

      <SecretaryKPICards stats={globalStats} />

      <div className="grid gap-6 lg:grid-cols-2">
        {secretariesWithStats.map((sec) => (
          <SecretaryCard key={sec.id} secretary={sec} />
        ))}
      </div>
    </div>
  )
}

export default SecretariesIndexPage
