import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Layers,
  Maximize2,
  Minimize2,
  MapPin,
  Search,
  Navigation,
  Eye,
  EyeOff,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Thermometer,
} from 'lucide-react'
import { cn, getStatusColor, getPriorityColor } from '@/lib/utils'
import type { MapMarker } from '@/types'

// Fix Leaflet default marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom marker icons by type - SEM ANIMAÇÕES para evitar tremor
const createCustomIcon = (color: string, _type: string, isUrgent = false) => {
  // Para urgente, usamos uma cor mais vibrante mas sem animação
  const fillColor = isUrgent ? '#DC2626' : color
  
  const iconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" width="36" height="36">
      <defs>
        <filter id="shadow-${_type}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path filter="url(#shadow-${_type})" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `
  return L.divIcon({
    html: iconSvg,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

// Cluster icon for grouped markers - with cache to prevent re-creation
const clusterIconCache = new Map<string, L.DivIcon>()

const createClusterIcon = (count: number, color: string) => {
  const cacheKey = `${count}-${color}`
  if (clusterIconCache.has(cacheKey)) {
    return clusterIconCache.get(cacheKey)!
  }
  
  const size = count > 50 ? 50 : count > 20 ? 44 : count > 10 ? 38 : 32
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${size > 40 ? '14px' : '12px'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">${count}</div>
  `
  const icon = L.divIcon({
    html: iconHtml,
    className: 'cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  
  clusterIconCache.set(cacheKey, icon)
  return icon
}

const markerIcons = {
  infraestrutura: createCustomIcon('#1E40AF', 'infraestrutura'),
  iluminacao: createCustomIcon('#F59E0B', 'iluminacao'),
  saneamento: createCustomIcon('#059669', 'saneamento'),
  drenagem: createCustomIcon('#0EA5E9', 'drenagem'),
  transito: createCustomIcon('#DC2626', 'transito'),
  servicos: createCustomIcon('#8B5CF6', 'servicos'),
  limpeza: createCustomIcon('#10B981', 'limpeza'),
  pracas: createCustomIcon('#22C55E', 'pracas'),
  mercados: createCustomIcon('#F97316', 'mercados'),
  urgente: createCustomIcon('#DC2626', 'urgente', true),
  default: createCustomIcon('#6B7280', 'default'),
}

// Type colors for clustering and heatmap
const typeColors: Record<string, string> = {
  infraestrutura: '#1E40AF',
  iluminacao: '#F59E0B',
  saneamento: '#059669',
  drenagem: '#0EA5E9',
  transito: '#DC2626',
  servicos: '#8B5CF6',
  limpeza: '#10B981',
  pracas: '#22C55E',
  mercados: '#F97316',
  default: '#6B7280',
}

// Map styles
const mapStyles = {
  default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

interface CityMapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: string
  showControls?: boolean
  showFilters?: boolean
  showLegend?: boolean
  showSearch?: boolean
  showHeatmap?: boolean
  enableClustering?: boolean
  onMarkerClick?: (marker: MapMarker) => void
  onRefresh?: () => void
  className?: string
}

// Component to handle map events and controls
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  
  return null
}

// Component to handle user location
function LocationMarker({ onLocationFound }: { onLocationFound?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const map = useMapEvents({
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
      map.flyTo(e.latlng, 15)
      onLocationFound?.(e.latlng.lat, e.latlng.lng)
    },
  })

  return position ? (
    <Circle
      center={position}
      radius={100}
      pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3 }}
    />
  ) : null
}

// Type for clustered marker items
type ClusteredItem = 
  | { type: 'single'; marker: MapMarker; position: [number, number] }
  | { type: 'cluster'; markers: MapMarker[]; position: [number, number] }

// Cluster markers by proximity
function clusterMarkers(markers: MapMarker[], zoom: number): ClusteredItem[] {
  if (zoom >= 15 || markers.length <= 10) {
    return markers.map(m => ({ 
      type: 'single' as const, 
      marker: m, 
      position: [m.latitude, m.longitude] as [number, number] 
    }))
  }

  const threshold = zoom < 12 ? 0.02 : 0.01
  const clusters: { markers: MapMarker[]; position: [number, number] }[] = []
  const used = new Set<string>()

  markers.forEach(marker => {
    if (used.has(marker.id)) return

    const nearby = markers.filter(m => {
      if (used.has(m.id)) return false
      const dist = Math.sqrt(
        Math.pow(m.latitude - marker.latitude, 2) + 
        Math.pow(m.longitude - marker.longitude, 2)
      )
      return dist < threshold
    })

    if (nearby.length > 1) {
      nearby.forEach(m => used.add(m.id))
      const avgLat = nearby.reduce((sum, m) => sum + m.latitude, 0) / nearby.length
      const avgLng = nearby.reduce((sum, m) => sum + m.longitude, 0) / nearby.length
      clusters.push({ markers: nearby, position: [avgLat, avgLng] })
    } else {
      used.add(marker.id)
      clusters.push({ markers: [marker], position: [marker.latitude, marker.longitude] })
    }
  })

  return clusters.map(c => 
    c.markers.length > 1 
      ? { type: 'cluster' as const, markers: c.markers, position: c.position }
      : { type: 'single' as const, marker: c.markers[0], position: c.position }
  )
}

export function CityMap({
  markers = [],
  center = [-5.9157, -35.2628], // Parnamirim/RN center
  zoom = 13,
  height = '500px',
  showControls = true,
  showFilters = true,
  showLegend = true,
  showSearch = true,
  showHeatmap = false,
  enableClustering = true,
  onMarkerClick,
  onRefresh,
  className,
}: CityMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [showLegendPanel, setShowLegendPanel] = useState(true)
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)
  const [mapStyle, setMapStyle] = useState<keyof typeof mapStyles>('default')
  const [currentZoom, setCurrentZoom] = useState(zoom)
  const [isLocating, setIsLocating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleLocateUser = useCallback(() => {
    if (mapRef.current) {
      setIsLocating(true)
      mapRef.current.locate({ setView: true, maxZoom: 15 })
      setTimeout(() => setIsLocating(false), 2000)
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [])

  const handleCenterMap = useCallback(() => {
    mapRef.current?.setView(center, zoom)
  }, [center, zoom])

  // Filter markers
  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      // Filtra marcadores sem coordenadas válidas
      if (!marker.latitude || !marker.longitude) return false
      if (marker.latitude === 0 && marker.longitude === 0) return false
      
      if (selectedStatus !== 'all' && marker.status !== selectedStatus) return false
      if (selectedType !== 'all' && marker.type !== selectedType) return false
      if (selectedPriority !== 'all' && marker.priority !== selectedPriority) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matches = 
          marker.title?.toLowerCase().includes(query) ||
          marker.address?.toLowerCase().includes(query)
        if (!matches) return false
      }
      return true
    })
  }, [markers, selectedStatus, selectedType, selectedPriority, searchQuery])

  // Get clustered markers
  const clusteredMarkers = useMemo((): ClusteredItem[] => {
    if (!enableClustering) {
      return filteredMarkers.map(m => ({ 
        type: 'single' as const, 
        marker: m, 
        position: [m.latitude, m.longitude] as [number, number] 
      }))
    }
    return clusterMarkers(filteredMarkers, currentZoom)
  }, [filteredMarkers, currentZoom, enableClustering])

  // Count by status
  const statusCounts = useMemo(() => ({
    aberta: markers.filter(m => m.status === 'aberta').length,
    em_andamento: markers.filter(m => m.status === 'em_andamento').length,
    resolvida: markers.filter(m => m.status === 'resolvida').length,
  }), [markers])

  // Count by type
  const typeCounts = useMemo(() => ({
    infraestrutura: markers.filter(m => m.type === 'infraestrutura').length,
    iluminacao: markers.filter(m => m.type === 'iluminacao').length,
    drenagem: markers.filter(m => m.type === 'drenagem').length,
    limpeza: markers.filter(m => m.type === 'limpeza').length,
    pracas: markers.filter(m => m.type === 'pracas').length,
    servicos: markers.filter(m => m.type === 'servicos').length,
  }), [markers])

  const getMarkerIcon = useCallback((marker: MapMarker) => {
    if (marker.priority === 'urgente') return markerIcons.urgente
    const type = marker.type as keyof typeof markerIcons
    return markerIcons[type] || markerIcons.default
  }, [])

  const activeFiltersCount = [selectedStatus, selectedType, selectedPriority]
    .filter(v => v !== 'all').length + (searchQuery ? 1 : 0)

  return (
    <Card className={cn('overflow-hidden relative h-full', className)} ref={containerRef}>
      <CardContent className="p-0 relative h-full">
        {/* Top Control Bar */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center gap-2">
          {/* Search Box */}
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar demanda ou endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 bg-background/95 backdrop-blur-sm border-muted shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Toggle */}
          {showFilters && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showFiltersPanel ? "default" : "outline"}
                    size="sm"
                    className="h-9 gap-1 bg-background/95 backdrop-blur-sm shadow-lg"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                  >
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                    {showFiltersPanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filtros</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Marker count badge */}
            <Badge 
              variant="secondary" 
              className="h-9 px-3 bg-background/95 backdrop-blur-sm shadow-lg font-medium"
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {filteredMarkers.length} demanda{filteredMarkers.length !== 1 ? 's' : ''}
            </Badge>

            {/* Heatmap toggle */}
            {showHeatmap && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={heatmapEnabled ? "default" : "outline"}
                      size="icon"
                      className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                      onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                    >
                      <Thermometer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mapa de calor</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Refresh */}
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                      onClick={onRefresh}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Fullscreen */}
            {showControls && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFiltersPanel && (
          <div className="absolute top-14 left-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-xl w-[300px] animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold">Filtros</h5>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setSelectedStatus('all')
                    setSelectedType('all')
                    setSelectedPriority('all')
                    setSearchQuery('')
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {/* Status Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                <div className="flex flex-wrap gap-1">
                  {['all', 'aberta', 'em_andamento', 'resolvida'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status === 'all' && 'Todos'}
                      {status === 'aberta' && `Abertas (${statusCounts.aberta})`}
                      {status === 'em_andamento' && `Em and. (${statusCounts.em_andamento})`}
                      {status === 'resolvida' && `Resolv. (${statusCounts.resolvida})`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'all', label: 'Todas' },
                    { value: 'infraestrutura', label: 'Infra', color: '#1E40AF' },
                    { value: 'iluminacao', label: 'Iluminação', color: '#F59E0B' },
                    { value: 'drenagem', label: 'Drenagem', color: '#0EA5E9' },
                    { value: 'limpeza', label: 'Limpeza', color: '#10B981' },
                    { value: 'pracas', label: 'Praças', color: '#22C55E' },
                    { value: 'servicos', label: 'Outros', color: '#8B5CF6' },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setSelectedType(type.value)}
                    >
                      {type.color && (
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                      )}
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Prioridade</label>
                <div className="flex flex-wrap gap-1">
                  {['all', 'urgente', 'alta', 'media', 'baixa'].map((priority) => (
                    <Button
                      key={priority}
                      variant={selectedPriority === priority ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedPriority(priority)}
                    >
                      {priority === 'all' ? 'Todas' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div style={{ height: height || '500px', minHeight: '400px' }} className="relative">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={(map) => { if (map) mapRef.current = map }}
            whenReady={() => {
              mapRef.current?.on('zoomend', () => {
                setCurrentZoom(mapRef.current?.getZoom() || zoom)
              })
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url={mapStyles[mapStyle]}
            />
            <ZoomControl position="bottomright" />
            <MapController center={center} zoom={zoom} />
            <LocationMarker />
            
            {/* Render markers or clusters */}
            {clusteredMarkers.map((item, index) => {
              if (item.type === 'cluster') {
                // Render cluster
                const mainType = item.markers[0].type || 'default'
                return (
                  <Marker
                    key={`cluster-${index}`}
                    position={item.position}
                    icon={createClusterIcon(item.markers.length, typeColors[mainType] || typeColors.default)}
                    eventHandlers={{
                      click: () => {
                        mapRef.current?.setView(item.position, currentZoom + 2)
                      },
                    }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <h4 className="font-semibold text-sm mb-2">{item.markers.length} demandas nesta área</h4>
                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                          {item.markers.slice(0, 5).map((m: MapMarker) => (
                            <div 
                              key={m.id} 
                              className="text-xs p-1.5 bg-muted rounded cursor-pointer hover:bg-muted/80"
                              onClick={() => onMarkerClick?.(m)}
                            >
                              {m.title}
                            </div>
                          ))}
                          {item.markers.length > 5 && (
                            <div className="text-xs text-muted-foreground text-center pt-1">
                              +{item.markers.length - 5} mais
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs mt-2"
                          onClick={() => mapRef.current?.setView(item.position, currentZoom + 2)}
                        >
                          Aproximar
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                )
              } else {
                // Render single marker
                const marker = item.marker
                return (
                  <Marker
                    key={marker.id}
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerIcon(marker)}
                    eventHandlers={{
                      click: () => onMarkerClick?.(marker),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px]">
                        <h4 className="font-semibold text-sm mb-1">{marker.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{marker.address}</p>
                        <div className="flex gap-1 mb-2">
                          <Badge className={cn('text-[10px]', getStatusColor(marker.status))}>
                            {marker.status === 'aberta' && 'Aberta'}
                            {marker.status === 'em_andamento' && 'Em andamento'}
                            {marker.status === 'resolvida' && 'Resolvida'}
                          </Badge>
                          <Badge className={cn('text-[10px]', getPriorityColor(marker.priority))}>
                            {marker.priority}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => onMarkerClick?.(marker)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                )
              }
            })}

            {/* Heatmap circles */}
            {heatmapEnabled && filteredMarkers.map((marker) => (
              <Circle
                key={`heat-${marker.id}`}
                center={[marker.latitude, marker.longitude]}
                radius={200}
                pathOptions={{
                  color: 'transparent',
                  fillColor: marker.priority === 'urgente' ? '#DC2626' : typeColors[marker.type || 'default'],
                  fillOpacity: 0.4,
                }}
              />
            ))}
          </MapContainer>

          {/* Left Side Controls */}
          <div className="absolute left-3 bottom-20 z-[1000] flex flex-col gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Aproximar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Afastar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg",
                      isLocating && "animate-pulse"
                    )}
                    onClick={handleLocateUser}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Minha localização</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg"
                    onClick={handleCenterMap}
                  >
                    <Crosshair className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Centralizar mapa</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Legend - Bottom Right */}
          {showLegend && (
            <div className="absolute bottom-3 right-14 z-[1000]">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg overflow-hidden">
                <button
                  className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold hover:bg-muted/50 transition-colors"
                  onClick={() => setShowLegendPanel(!showLegendPanel)}
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Legenda
                  </span>
                  {showLegendPanel ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                
                {showLegendPanel && (
                  <div className="px-3 pb-3 pt-1 border-t space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Por Status</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <span>Abertas ({statusCounts.aberta})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Em andamento ({statusCounts.em_andamento})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          <span>Resolvidas ({statusCounts.resolvida})</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Por Tipo</p>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(typeCounts).map(([type, count]) => (
                          <div key={type} className="flex items-center gap-1.5 text-xs">
                            <div 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: typeColors[type] }}
                            />
                            <span className="truncate capitalize">{type.replace('iluminacao', 'Ilum.')}</span>
                            <span className="text-muted-foreground">({count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Style Selector - Bottom Left */}
          <div className="absolute bottom-3 left-3 z-[1000]">
            <div className="flex gap-1 bg-background/95 backdrop-blur-sm rounded-lg border p-1 shadow-lg">
              {[
                { value: 'default', icon: '🗺️', label: 'Padrão' },
                { value: 'light', icon: '☀️', label: 'Claro' },
                { value: 'dark', icon: '🌙', label: 'Escuro' },
                { value: 'satellite', icon: '🛰️', label: 'Satélite' },
              ].map((style) => (
                <TooltipProvider key={style.value}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={mapStyle === style.value ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0 text-sm"
                        onClick={() => setMapStyle(style.value as keyof typeof mapStyles)}
                      >
                        {style.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{style.label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini map component for demand details
interface MiniMapProps {
  latitude: number
  longitude: number
  height?: string
  className?: string
  interactive?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
}

export function MiniMap({ 
  latitude, 
  longitude, 
  height = '200px', 
  className,
  interactive = false,
  onLocationSelect,
}: MiniMapProps) {
  // Use useMemo to derive position from props instead of useState + useEffect
  const position = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude])
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)
  
  const currentPosition = clickedPosition || position

  const handleClick = (e: L.LeafletMouseEvent) => {
    if (interactive && onLocationSelect) {
      const { lat, lng } = e.latlng
      setClickedPosition([lat, lng])
      onLocationSelect(lat, lng)
    }
  }

  return (
    <div className={cn('rounded-lg overflow-hidden border', className)} style={{ height }}>
      <MapContainer
        center={currentPosition}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={currentPosition} />
        {interactive && <MapClickHandler onClick={handleClick} />}
      </MapContainer>
    </div>
  )
}

// Helper component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) {
  const map = useMap()
  
  useEffect(() => {
    map.on('click', onClick)
    return () => {
      map.off('click', onClick)
    }
  }, [map, onClick])
  
  return null
}
