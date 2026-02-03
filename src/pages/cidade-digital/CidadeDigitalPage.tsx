import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Building2, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Users,
  Lightbulb,
  Trash2,
  Camera,
  Play,
  Pause,
  Maximize2,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Tipos
interface Building {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'industrial' | 'public' | 'education' | 'health'
  x: number
  y: number
  width: number
  depth: number
  height: number
  floors: number
  status: 'normal' | 'warning' | 'critical' | 'maintenance'
  sensors: {
    energy: number
    water: number
    temperature: number
    occupancy: number
  }
  alerts: number
}

interface Sensor {
  id: string
  type: 'traffic' | 'air' | 'noise' | 'camera' | 'lighting' | 'waste'
  x: number
  y: number
  status: 'online' | 'offline' | 'warning'
  value: number
  unit: string
}

interface District {
  id: string
  name: string
  population: number
  area: number
  demands: number
  satisfaction: number
}

// Dados mockados
const mockBuildings: Building[] = [
  { id: 'b1', name: 'Prefeitura Municipal', type: 'public', x: 50, y: 50, width: 40, depth: 30, height: 80, floors: 8, status: 'normal', sensors: { energy: 78, water: 65, temperature: 24, occupancy: 85 }, alerts: 0 },
  { id: 'b2', name: 'Hospital Regional', type: 'health', x: 120, y: 30, width: 60, depth: 40, height: 60, floors: 6, status: 'warning', sensors: { energy: 92, water: 88, temperature: 22, occupancy: 95 }, alerts: 2 },
  { id: 'b3', name: 'Escola Municipal', type: 'education', x: 200, y: 60, width: 50, depth: 35, height: 40, floors: 4, status: 'normal', sensors: { energy: 45, water: 35, temperature: 25, occupancy: 0 }, alerts: 0 },
  { id: 'b4', name: 'Centro Comercial', type: 'commercial', x: 80, y: 130, width: 70, depth: 50, height: 100, floors: 10, status: 'normal', sensors: { energy: 85, water: 70, temperature: 23, occupancy: 72 }, alerts: 1 },
  { id: 'b5', name: 'Condomínio Residencial', type: 'residential', x: 180, y: 120, width: 35, depth: 35, height: 120, floors: 12, status: 'normal', sensors: { energy: 55, water: 48, temperature: 24, occupancy: 68 }, alerts: 0 },
  { id: 'b6', name: 'Parque Industrial', type: 'industrial', x: 280, y: 40, width: 80, depth: 60, height: 30, floors: 2, status: 'critical', sensors: { energy: 98, water: 95, temperature: 32, occupancy: 45 }, alerts: 5 },
  { id: 'b7', name: 'Terminal Rodoviário', type: 'public', x: 30, y: 180, width: 55, depth: 40, height: 25, floors: 2, status: 'normal', sensors: { energy: 60, water: 40, temperature: 26, occupancy: 35 }, alerts: 0 },
  { id: 'b8', name: 'Biblioteca Pública', type: 'education', x: 150, y: 180, width: 30, depth: 25, height: 35, floors: 3, status: 'maintenance', sensors: { energy: 20, water: 15, temperature: 22, occupancy: 0 }, alerts: 1 },
]

const mockSensors: Sensor[] = [
  { id: 's1', type: 'traffic', x: 100, y: 100, status: 'online', value: 850, unit: 'veículos/h' },
  { id: 's2', type: 'traffic', x: 200, y: 150, status: 'online', value: 1200, unit: 'veículos/h' },
  { id: 's3', type: 'air', x: 150, y: 80, status: 'online', value: 42, unit: 'AQI' },
  { id: 's4', type: 'air', x: 280, y: 120, status: 'warning', value: 85, unit: 'AQI' },
  { id: 's5', type: 'noise', x: 80, y: 180, status: 'online', value: 65, unit: 'dB' },
  { id: 's6', type: 'camera', x: 50, y: 100, status: 'online', value: 1, unit: '' },
  { id: 's7', type: 'camera', x: 180, y: 50, status: 'offline', value: 0, unit: '' },
  { id: 's8', type: 'lighting', x: 120, y: 160, status: 'online', value: 85, unit: '%' },
  { id: 's9', type: 'waste', x: 220, y: 100, status: 'online', value: 72, unit: '%' },
  { id: 's10', type: 'waste', x: 60, y: 140, status: 'warning', value: 95, unit: '%' },
]

const mockDistricts: District[] = [
  { id: 'd1', name: 'Centro', population: 45000, area: 8.5, demands: 127, satisfaction: 78 },
  { id: 'd2', name: 'Nova Parnamirim', population: 82000, area: 15.2, demands: 245, satisfaction: 72 },
  { id: 'd3', name: 'Emaús', population: 35000, area: 6.8, demands: 89, satisfaction: 81 },
  { id: 'd4', name: 'Parque Industrial', population: 12000, area: 12.5, demands: 34, satisfaction: 68 },
  { id: 'd5', name: 'Rosa dos Ventos', population: 28000, area: 5.2, demands: 156, satisfaction: 65 },
]

// Componentes
function Building3D({ building, isSelected, onClick, rotateY, zoom }: { 
  building: Building
  isSelected: boolean
  onClick: () => void
  rotateY: number
  zoom: number
}) {
  const typeColors = {
    residential: 'from-blue-400 to-blue-600',
    commercial: 'from-purple-400 to-purple-600',
    industrial: 'from-orange-400 to-orange-600',
    public: 'from-emerald-400 to-emerald-600',
    education: 'from-amber-400 to-amber-600',
    health: 'from-red-400 to-red-600',
  }

  const statusGlow = {
    normal: '',
    warning: 'shadow-yellow-500/50 shadow-lg',
    critical: 'shadow-red-500/50 shadow-lg animate-pulse',
    maintenance: 'opacity-60',
  }

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-300',
        isSelected && 'z-50'
      )}
      style={{
        left: building.x * zoom,
        top: building.y * zoom,
        transform: `rotateX(60deg) rotateZ(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onClick={onClick}
    >
      {/* Base do prédio */}
      <div
        className={cn(
          'relative bg-gradient-to-t rounded-sm transition-all duration-300',
          typeColors[building.type],
          statusGlow[building.status],
          isSelected && 'ring-4 ring-white ring-offset-2 ring-offset-slate-900'
        )}
        style={{
          width: building.width * zoom,
          height: building.depth * zoom,
          transform: `translateZ(${building.height * zoom}px)`,
          boxShadow: `0 0 ${20 * zoom}px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Indicador de alertas */}
        {building.alerts > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold animate-bounce">
            {building.alerts}
          </div>
        )}
        
        {/* Andares */}
        <div className="absolute inset-0 flex flex-col justify-evenly p-0.5">
          {Array.from({ length: Math.min(building.floors, 6) }).map((_, i) => (
            <div key={i} className="flex-1 border-b border-white/20 last:border-b-0" />
          ))}
        </div>
      </div>

      {/* Sombra */}
      <div
        className="absolute bg-black/30 rounded-sm blur-sm"
        style={{
          width: building.width * zoom,
          height: building.depth * zoom,
          transform: `translateZ(0) translateX(${10 * zoom}px) translateY(${10 * zoom}px)`,
        }}
      />
    </div>
  )
}

function SensorMarker({ sensor, zoom, onClick }: { sensor: Sensor; zoom: number; onClick: () => void }) {
  const icons = {
    traffic: Car,
    air: Wind,
    noise: Activity,
    camera: Camera,
    lighting: Lightbulb,
    waste: Trash2,
  }
  
  const Icon = icons[sensor.type]
  
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    warning: 'bg-yellow-500',
  }

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200 hover:scale-125"
      style={{
        left: sensor.x * zoom - 12,
        top: sensor.y * zoom - 12,
        zIndex: 100,
      }}
      onClick={onClick}
    >
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center',
        statusColors[sensor.status],
        sensor.status === 'warning' && 'animate-pulse'
      )}>
        <Icon className="w-3 h-3 text-white" />
      </div>
    </div>
  )
}

export function CidadeDigitalPage() {
  const [rotateY, setRotateY] = useState(-45)
  const [zoom, setZoom] = useState(1)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showLayers, setShowLayers] = useState({
    buildings: true,
    sensors: true,
    traffic: true,
    alerts: true,
  })
  const [viewMode, setViewMode] = useState<'3d' | 'map' | 'data'>('3d')
  const [time, setTime] = useState(new Date())

  // Atualizar hora
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Rotação automática
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setRotateY(prev => (prev + 0.2) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Stats gerais
  const stats = useMemo(() => ({
    totalBuildings: mockBuildings.length,
    alertBuildings: mockBuildings.filter(b => b.alerts > 0).length,
    onlineSensors: mockSensors.filter(s => s.status === 'online').length,
    totalSensors: mockSensors.length,
    avgEnergy: Math.round(mockBuildings.reduce((a, b) => a + b.sensors.energy, 0) / mockBuildings.length),
    avgWater: Math.round(mockBuildings.reduce((a, b) => a + b.sensors.water, 0) / mockBuildings.length),
  }), [])

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.2, 2)), [])
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.2, 0.5)), [])
  const handleResetView = useCallback(() => {
    setRotateY(-45)
    setZoom(1)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Cidade Digital 3D</h1>
                  <p className="text-xs text-slate-400">Parnamirim • Gêmeo Digital</p>
                </div>
              </div>
              
              <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                <Sparkles className="w-3 h-3 mr-1" />
                Powered by Quimera
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              {/* Stats rápidos */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{stats.onlineSensors}/{stats.totalSensors} sensores</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">{stats.alertBuildings} alertas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span className="text-sm">26°C</span>
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-sm">{time.toLocaleTimeString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar esquerda - Controles */}
        <div className="w-64 border-r border-slate-700 bg-slate-900/50 p-4 space-y-4 overflow-y-auto">
          {/* Modo de visualização */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Visualização</h3>
            <div className="grid grid-cols-3 gap-1">
              {(['3d', 'map', 'data'] as const).map(mode => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  className={cn(
                    'text-xs',
                    viewMode === mode && 'bg-cyan-600 hover:bg-cyan-700'
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  {mode.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Controles de câmera */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Câmera</h3>
            <div className="space-y-2">
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleZoomIn} className="flex-1">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleZoomOut} className="flex-1">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleResetView} className="flex-1">
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pausar rotação' : 'Rotacionar'}
              </Button>
            </div>
          </div>

          {/* Camadas */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Camadas</h3>
            <div className="space-y-1">
              {Object.entries(showLayers).map(([key, value]) => (
                <Button
                  key={key}
                  size="sm"
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowLayers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                >
                  <span className="capitalize">{key}</span>
                  {value ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                </Button>
              ))}
            </div>
          </div>

          {/* Legenda de tipos */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Tipos de Edificação</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-600" />
                <span>Residencial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-400 to-purple-600" />
                <span>Comercial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-400 to-orange-600" />
                <span>Industrial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-400 to-emerald-600" />
                <span>Público</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-amber-600" />
                <span>Educação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-red-400 to-red-600" />
                <span>Saúde</span>
              </div>
            </div>
          </div>

          {/* Bairros */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Bairros</h3>
            <div className="space-y-1">
              {mockDistricts.map(district => (
                <div key={district.id} className="p-2 bg-slate-800/50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{district.name}</span>
                    <Badge variant={district.satisfaction > 75 ? 'default' : district.satisfaction > 60 ? 'secondary' : 'destructive'} className="text-xs">
                      {district.satisfaction}%
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {district.population.toLocaleString()} hab • {district.demands} demandas
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Área principal - Canvas 3D */}
        <div className="flex-1 relative overflow-hidden">
          {/* Grid de fundo */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            }}
          />

          {/* Container 3D */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: '1500px' }}
          >
            <div
              className="relative"
              style={{
                width: 400 * zoom,
                height: 300 * zoom,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Prédios */}
              {showLayers.buildings && mockBuildings.map(building => (
                <Building3D
                  key={building.id}
                  building={building}
                  isSelected={selectedBuilding?.id === building.id}
                  onClick={() => setSelectedBuilding(selectedBuilding?.id === building.id ? null : building)}
                  rotateY={rotateY}
                  zoom={zoom}
                />
              ))}

              {/* Sensores */}
              {showLayers.sensors && mockSensors.map(sensor => (
                <SensorMarker
                  key={sensor.id}
                  sensor={sensor}
                  zoom={zoom}
                  onClick={() => setSelectedSensor(selectedSensor?.id === sensor.id ? null : sensor)}
                />
              ))}
            </div>
          </div>

          {/* Controles flutuantes */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-xs text-slate-400">Zoom: {Math.round(zoom * 100)}%</span>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-xs text-slate-400">Rotação: {Math.round(rotateY)}°</span>
            <div className="w-px h-4 bg-slate-700" />
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => {}}>
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Sidebar direita - Detalhes */}
        <div className="w-80 border-l border-slate-700 bg-slate-900/50 p-4 space-y-4 overflow-y-auto">
          {/* Informações do item selecionado */}
          {selectedBuilding ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedBuilding.name}</CardTitle>
                  <Badge variant={
                    selectedBuilding.status === 'normal' ? 'default' :
                    selectedBuilding.status === 'warning' ? 'secondary' :
                    selectedBuilding.status === 'critical' ? 'destructive' : 'outline'
                  }>
                    {selectedBuilding.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{selectedBuilding.floors} andares</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{selectedBuilding.sensors.occupancy}% ocupação</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Sensores</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        Energia
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${selectedBuilding.sensors.energy}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{selectedBuilding.sensors.energy}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        Água
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${selectedBuilding.sensors.water}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{selectedBuilding.sensors.water}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-400" />
                        Temperatura
                      </span>
                      <span className="text-sm">{selectedBuilding.sensors.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {selectedBuilding.alerts > 0 && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedBuilding.alerts} alertas ativos</span>
                    </div>
                  </div>
                )}

                <Button className="w-full" variant="outline">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Ver detalhes completos
                </Button>
              </CardContent>
            </Card>
          ) : selectedSensor ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">Sensor {selectedSensor.type}</CardTitle>
                  <Badge variant={
                    selectedSensor.status === 'online' ? 'default' :
                    selectedSensor.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {selectedSensor.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  {selectedSensor.value}
                  <span className="text-sm font-normal text-slate-400 ml-2">{selectedSensor.unit}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Última atualização: há 2 minutos
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Clique em um prédio ou sensor para ver detalhes</p>
            </div>
          )}

          {/* Métricas da cidade */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Métricas da Cidade</h3>
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-slate-800/50 border-slate-700 p-3">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-xs">Energia Média</span>
                </div>
                <div className="text-xl font-bold">{stats.avgEnergy}%</div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-3">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="text-xs">Água Média</span>
                </div>
                <div className="text-xl font-bold">{stats.avgWater}%</div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-3">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs">Qualidade do Ar</span>
                </div>
                <div className="text-xl font-bold text-green-400">Boa</div>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 p-3">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Car className="w-4 h-4" />
                  <span className="text-xs">Trânsito</span>
                </div>
                <div className="text-xl font-bold text-yellow-400">Moderado</div>
              </Card>
            </div>
          </div>

          {/* Alertas recentes */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Alertas Recentes</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Alto consumo de energia</p>
                  <p className="text-xs text-slate-400">Parque Industrial • há 15 min</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Coleta de lixo atrasada</p>
                  <p className="text-xs text-slate-400">Setor 5 • há 2 horas</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Manutenção concluída</p>
                  <p className="text-xs text-slate-400">Biblioteca Pública • há 3 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CidadeDigitalPage
