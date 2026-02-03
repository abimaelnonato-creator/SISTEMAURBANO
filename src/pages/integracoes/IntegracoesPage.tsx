// ============================================
// HUB DE INTEGRAÇÕES - PÁGINA PRINCIPAL
// "Tudo cai num só lugar" - Integração Total
// Sistema de Gestão Urbana Parnamirim
// ============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIntegracoesStore } from '@/store/integracoesStore';
import {
  MessageCircle,
  Camera,
  Plane,
  Building2,
  FileText,
  Satellite,
  Radar,
  Car,
  Lightbulb,
  AlertTriangle,
  CloudRain,
  Building,
  RefreshCw,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Database,
  Wifi,
  WifiOff,
  Signal,
  Users,
  DollarSign,
  Leaf,
  Eye,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

// Mapa de ícones
const iconMap: Record<string, React.ElementType> = {
  MessageCircle,
  Camera,
  Plane,
  Building2,
  FileText,
  Satellite,
  Radar,
  Car,
  Lightbulb,
  AlertTriangle,
  CloudRain,
  Building,
};

// Cores por categoria
const categoryColors: Record<string, string> = {
  comunicacao: 'emerald',
  monitoramento: 'blue',
  fiscalizacao: 'amber',
  infraestrutura: 'purple',
  meio_ambiente: 'cyan',
  seguranca: 'red',
  administrativo: 'slate',
};

// Labels de categoria
const categoryLabels: Record<string, string> = {
  comunicacao: 'Comunicação',
  monitoramento: 'Monitoramento',
  fiscalizacao: 'Fiscalização',
  infraestrutura: 'Infraestrutura',
  meio_ambiente: 'Meio Ambiente',
  seguranca: 'Segurança',
  administrativo: 'Administrativo',
};

// Status badge
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    online: { color: 'bg-emerald-500', icon: CheckCircle, label: 'Online' },
    offline: { color: 'bg-red-500', icon: XCircle, label: 'Offline' },
    degraded: { color: 'bg-amber-500', icon: AlertCircle, label: 'Degradado' },
    maintenance: { color: 'bg-blue-500', icon: Clock, label: 'Manutenção' },
    error: { color: 'bg-red-600', icon: XCircle, label: 'Erro' },
  }[status] || { color: 'bg-gray-500', icon: AlertCircle, label: status };

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full animate-pulse', config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
};

// Card de integração
const IntegrationCard = ({
  integrationKey,
  data,
  onClick,
}: {
  integrationKey: string;
  data: {
    id: string;
    nome: string;
    descricao: string;
    categoria: string;
    status: string;
    ultimaAtualizacao: Date;
    dadosRecebidos: number;
    taxaAtualizacao: string;
    icone: string;
    cor: string;
  };
  onClick: () => void;
}) => {
  const Icon = iconMap[data.icone] || Database;
  const categoryColor = categoryColors[data.categoria] || 'slate';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/10',
        'border-l-4',
        data.status === 'online' && `border-l-${categoryColor}-500`,
        data.status === 'offline' && 'border-l-red-500 opacity-60',
        data.status === 'degraded' && 'border-l-amber-500',
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              'p-2.5 rounded-xl',
              `bg-${categoryColor}-500/10`,
            )}
          >
            <Icon className={cn('h-5 w-5', `text-${categoryColor}-500`)} />
          </div>
          <StatusBadge status={data.status} />
        </div>

        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
          {data.nome}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {data.descricao}
        </p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>{formatNumber(data.dadosRecebidos)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeSince(data.ultimaAtualizacao)}</span>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">
            {categoryLabels[data.categoria]}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {data.taxaAtualizacao}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Card de alerta
const AlertCard = ({
  alerta,
  onMarkRead,
}: {
  alerta: {
    id: string;
    tipo: 'info' | 'warning' | 'error' | 'success';
    origem: string;
    mensagem: string;
    dataHora: Date;
    lido: boolean;
  };
  onMarkRead: () => void;
}) => {
  const config = {
    info: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: AlertCircle },
    warning: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
    success: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  }[alerta.tipo];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer',
        alerta.lido ? 'opacity-60' : config.bg,
        'hover:opacity-100'
      )}
      onClick={onMarkRead}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{alerta.origem}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(alerta.dataHora).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {alerta.mensagem}
        </p>
      </div>
      {!alerta.lido && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </div>
  );
};

// Componente principal
export default function IntegracoesPage() {
  const {
    hub,
    filtroCategoria,
    filtroStatus,
    buscaTexto,
    visualizacao,
    isLoading,
    setFiltroCategoria,
    setFiltroStatus,
    setBuscaTexto,
    setVisualizacao,
    setIntegracaoSelecionada,
    marcarAlertaLido,
    refreshHub,
    getIntegracoesFiltradas,
    getEstatisticasGerais,
  } = useIntegracoesStore();

  const [showFilters, setShowFilters] = useState(false);
  const integracoesFiltradas = getIntegracoesFiltradas();
  const stats = getEstatisticasGerais();

  // Simula eventos em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Atualiza timestamp
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-primary/10">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Hub de Integrações</h1>
                  <p className="text-sm text-muted-foreground">
                    Tudo cai num só lugar • {integracoesFiltradas.length} fontes de dados conectadas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshHub()}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {[
            { label: 'Online', value: stats.online, icon: Wifi, color: 'emerald' },
            { label: 'Offline', value: stats.offline, icon: WifiOff, color: 'red' },
            { label: 'Degradado', value: stats.degraded, icon: Signal, color: 'amber' },
            { label: 'Alertas', value: stats.alertasNaoLidos, icon: Bell, color: 'orange' },
            { label: 'População', value: formatNumber(hub.metricsUnificadas.populacaoAtendida), icon: Users, color: 'blue' },
            { label: 'Dispositivos', value: formatNumber(hub.metricsUnificadas.dispositivosConectados), icon: Activity, color: 'purple' },
            { label: 'Eventos/dia', value: formatNumber(hub.metricsUnificadas.eventosProcessadosHoje), icon: Zap, color: 'cyan' },
            { label: 'Satisfação', value: `${hub.metricsUnificadas.satisfacaoCidadao.toFixed(1)}★`, icon: TrendingUp, color: 'yellow' },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-lg', `bg-${metric.color}-500/10`)}>
                      <Icon className={cn('h-4 w-4', `text-${metric.color}-500`)} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{metric.value}</p>
                      <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel Principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros e Busca */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar integração..."
                      value={buscaTexto}
                      onChange={(e) => setBuscaTexto(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={showFilters ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>

                    <Separator orientation="vertical" className="h-8" />

                    <div className="flex rounded-lg border overflow-hidden">
                      <Button
                        variant={visualizacao === 'grid' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setVisualizacao('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={visualizacao === 'lista' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setVisualizacao('lista')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={visualizacao === 'mapa' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setVisualizacao('mapa')}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground mr-2">Categoria:</span>
                      <Button
                        variant={filtroCategoria === null ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroCategoria(null)}
                      >
                        Todas
                      </Button>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <Button
                          key={key}
                          variant={filtroCategoria === key ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setFiltroCategoria(key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-sm text-muted-foreground mr-2">Status:</span>
                      <Button
                        variant={filtroStatus === null ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroStatus(null)}
                      >
                        Todos
                      </Button>
                      {['online', 'offline', 'degraded', 'maintenance'].map((status) => (
                        <Button
                          key={status}
                          variant={filtroStatus === status ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setFiltroStatus(status)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grid de Integrações */}
            <div
              className={cn(
                'grid gap-4',
                visualizacao === 'grid' && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                visualizacao === 'lista' && 'grid-cols-1',
              )}
            >
              {integracoesFiltradas.map(({ key, data }) => (
                <IntegrationCard
                  key={key}
                  integrationKey={key}
                  data={data as any}
                  onClick={() => setIntegracaoSelecionada(key)}
                />
              ))}
            </div>

            {integracoesFiltradas.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Nenhuma integração encontrada</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Painel Lateral */}
          <div className="space-y-6">
            {/* Status Geral */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Barra de progresso de saúde */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Saúde Geral</span>
                      <span className="text-sm font-bold text-emerald-500">
                        {Math.round((stats.online / (stats.online + stats.offline + stats.degraded)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${(stats.online / (stats.online + stats.offline + stats.degraded)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Estatísticas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Área coberta</span>
                      <span className="text-sm font-medium">
                        {hub.metricsUnificadas.areaCobertaKm2} km²
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Tempo resposta</span>
                      <span className="text-sm font-medium">
                        {hub.metricsUnificadas.tempoMedioResposta} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Economia anual</span>
                      <span className="text-sm font-medium text-emerald-500">
                        R$ {(hub.metricsUnificadas.economia / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sustentabilidade</span>
                      <span className="text-sm font-medium">
                        {hub.metricsUnificadas.sustentabilidade}/100
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Alertas
                    {stats.alertasNaoLidos > 0 && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                        {stats.alertasNaoLidos}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 pt-0 space-y-2">
                    {hub.alertasGerais.map((alerta) => (
                      <AlertCard
                        key={alerta.id}
                        alerta={alerta}
                        onMarkRead={() => marcarAlertaLido(alerta.id)}
                      />
                    ))}
                    {hub.alertasGerais.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta ativo</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Links Rápidos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Acesso Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Ontologia Urbana', href: '/ontologia', icon: Eye },
                    { label: 'Monitoramento', href: '/monitoramento', icon: Activity },
                    { label: 'Gabinete de Crise', href: '/crise', icon: AlertTriangle },
                    { label: 'Assistente IA', href: '/assistente', icon: MessageCircle },
                  ].map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{link.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Última atualização */}
            <div className="text-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Última atualização:{' '}
              {new Date(hub.ultimaAtualizacaoGeral).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
