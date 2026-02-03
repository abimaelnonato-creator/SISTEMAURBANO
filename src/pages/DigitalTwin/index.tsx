import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Html, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { io } from 'socket.io-client'
import {
	Eye,
	EyeOff,
	ZoomIn,
	ZoomOut,
	RotateCcw,
	Maximize2,
	Pause,
	Play,
	AlertTriangle,
	Car,
	Lightbulb,
	Droplets,
	Wind,
	Thermometer,
	Activity,
	Building2,
	Shield,
	ChevronRight,
	X,
	Clock,
	PanelRight,
	PanelRightOpen,
	Expand,
	Minimize2,
	Footprints,
} from 'lucide-react'
import {
	BAIRROS_PARNAMIRIM,
	PONTOS_INTERESSE,
	VIAS_PRINCIPAIS,
	TRAFEGO_CORES,
	coordsTo3D,
} from '@/config/parnamirim'
import type { Bairro, TipoSensor, TipoAlerta } from '@/config/parnamirim'

type SensorData = {
	id: string
	tipo: TipoSensor
	coords: [number, number]
	status: 'online' | 'offline' | 'alerta'
	valor?: number
	ultimaAtualizacao: Date
}

type Alerta = {
	id: string
	tipo: TipoAlerta
	titulo: string
	descricao: string
	coords: [number, number]
	prioridade: 'baixa' | 'media' | 'alta' | 'critica'
	timestamp: Date
	bairro: string
	status: 'ativo' | 'em_atendimento' | 'resolvido'
}

type Viatura = {
	id: string
	tipo: 'policia' | 'ambulancia' | 'bombeiro' | 'fiscalizacao'
	placa: string
	coords: [number, number]
	status: 'disponivel' | 'em_ocorrencia' | 'retornando'
	destino?: [number, number]
}

type TrafegoData = {
	segmento: string
	nivel: 'livre' | 'moderado' | 'lento' | 'congestionado'
	velocidadeMedia: number
	coords: [number, number][]
}

type MetricasCidade = {
	energiaMedia: number
	aguaMedia: number
	qualidadeAr: 'boa' | 'moderada' | 'ruim' | 'pessima'
	temperatura: number
	umidade: number
	trafego: 'livre' | 'moderado' | 'intenso'
	sensoresOnline: number
	sensoresTotal: number
	alertasAtivos: number
	demandasAbertas: number
	viaturasDisponiveis: number
}

type BuildingData = {
	id: string
	position: [number, number, number]
	height: number
	width: number
	depth: number
	tipo: string
	nome?: string
	bairro?: string
	isPOI?: boolean
}

type VehicleData = {
	id: string
	position: [number, number, number]
	heading: number
	cor: string
	label: string
	categoria: 'patrulha' | 'manutencao' | 'onibus' | 'ambulancia'
}

type PersonData = {
	id: string
	position: [number, number, number]
	cor: string
	label: string
}

type MarkerPayload = {
	titulo?: string
	status?: 'ativo' | 'em_atendimento' | 'resolvido'
	prioridade?: Alerta['prioridade']
}

function seededRandom(seed: string, idx: number) {
	let h = 2166136261 >>> 0
	const str = `${seed}-${idx}`
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i)
		h = Math.imul(h, 16777619)
	}
	h ^= h << 13
	h ^= h >>> 7
	h ^= h << 3
	h ^= h >>> 17
	h ^= h << 5
	return (h >>> 0) / 4294967296
}

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t
}

function buildStatic3DData() {
	const buildings: BuildingData[] = []
	const vehicles: VehicleData[] = []
	const people: PersonData[] = []

	BAIRROS_PARNAMIRIM.forEach((bairro) => {
		const baseCount = Math.max(6, Math.floor(bairro.populacao / 2500))
		for (let i = 0; i < baseCount; i++) {
			const rX = seededRandom(bairro.id, i)
			const rZ = seededRandom(bairro.id, i + 100)
			const rH = seededRandom(bairro.id, i + 200)
			const rW = seededRandom(bairro.id, i + 300)
			const rD = seededRandom(bairro.id, i + 400)
			const [baseX, , baseZ] = coordsTo3D(bairro.coords[0], bairro.coords[1])
			const offset = Math.sqrt(bairro.area) * 1.2
			const position: [number, number, number] = [
				baseX + (rX - 0.5) * offset,
				(0.3 + rH * 1.7) / 2,
				baseZ + (rZ - 0.5) * offset,
			]

			const tipos = ['residencial', 'residencial', 'comercial', 'publico'] as const
			const tipo = tipos[Math.floor(seededRandom(bairro.id, i + 500) * tipos.length)]

			buildings.push({
				id: `${bairro.id}-${i}`,
				position,
				height: 0.3 + rH * 1.7,
				width: 0.2 + rW * 0.35,
				depth: 0.2 + rD * 0.35,
				tipo,
				bairro: bairro.id,
			})
		}

		const pedestrianCount = 6
		for (let p = 0; p < pedestrianCount; p++) {
			const rX = seededRandom(`${bairro.id}-p`, p)
			const rZ = seededRandom(`${bairro.id}-p`, p + 50)
			const [baseX, , baseZ] = coordsTo3D(bairro.coords[0], bairro.coords[1])
			const offset = Math.sqrt(bairro.area) * 0.8
			people.push({
				id: `person-${bairro.id}-${p}`,
				position: [baseX + (rX - 0.5) * offset, 0.15, baseZ + (rZ - 0.5) * offset],
				cor: ['#22c55e', '#38bdf8', '#f97316'][p % 3],
				label: bairro.nome,
			})
		}
	})

	PONTOS_INTERESSE.forEach((poi, idx) => {
		const [x, , z] = coordsTo3D(poi.coords[0], poi.coords[1])
		const noise = seededRandom(poi.id, idx)
		buildings.push({
			id: poi.id,
			position: [x, 0.5, z],
			height: 0.8 + noise * 0.6,
			width: 0.4,
			depth: 0.4,
			tipo: poi.tipo,
			nome: poi.nome,
			isPOI: true,
		})
	})

	VIAS_PRINCIPAIS.forEach((via, idx) => {
		const start = via.coords[0]
		const end = via.coords[via.coords.length - 1]
		const [sx, , sz] = coordsTo3D(start[0], start[1])
		const [ex, , ez] = coordsTo3D(end[0], end[1])
		const carCount = 2 + (idx % 2)
		for (let c = 0; c < carCount; c++) {
			const t = seededRandom(via.id, c)
			const x = lerp(sx, ex, t)
			const z = lerp(sz, ez, t)
			const heading = Math.atan2(ez - sz, ex - sx)
			const cores = ['#22c55e', '#38bdf8', '#f97316', '#f43f5e'] as const
			const categorias: VehicleData['categoria'][] = ['patrulha', 'manutencao', 'onibus', 'ambulancia']
			const categoria = categorias[c % categorias.length]
			vehicles.push({
				id: `veh-${via.id}-${c}`,
				position: [x, 0.1, z],
				heading,
				cor: cores[c % cores.length],
				label: via.nome,
				categoria,
			})
		}
	})

	return { buildings, vehicles, people }
}

function Building3D({ position, height, width, depth, tipo, nome, onClick, highlighted }: BuildingData & { onClick?: () => void; highlighted?: boolean }) {
	const meshRef = useRef<THREE.Mesh>(null)
	const [hovered, setHovered] = useState(false)

	useFrame((state) => {
		if (meshRef.current && highlighted) {
			meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
		}
	})

	const buildingColor = useMemo(() => {
		const colors: Record<string, string> = {
			residencial: '#4A90D9',
			comercial: '#9B59B6',
			industrial: '#E67E22',
			publico: '#2ECC71',
			educacao: '#F1C40F',
			saude: '#E74C3C',
			default: '#607D8B',
		}
		return colors[tipo] || colors.default
	}, [tipo])

	return (
		<group position={position}>
			<mesh
				ref={meshRef}
				onClick={onClick}
				onPointerOver={() => setHovered(true)}
				onPointerOut={() => setHovered(false)}
				castShadow
				receiveShadow
			>
				<boxGeometry args={[width, height, depth]} />
				<meshStandardMaterial
					color={hovered || highlighted ? '#FFD700' : buildingColor}
					metalness={0.3}
					roughness={0.7}
					emissive={highlighted ? '#FFD700' : '#000000'}
					emissiveIntensity={highlighted ? 0.3 : 0}
				/>
			</mesh>

			{height > 0.5 && (
				<>
					{Array.from({ length: Math.floor(height / 0.3) }).map((_, floor) => (
						Array.from({ length: Math.floor(width / 0.2) }).map((_, window) => (
							<mesh
								key={`${floor}-${window}`}
								position={[
									-width / 2 + 0.15 + window * 0.25,
									-height / 2 + 0.2 + floor * 0.35,
									depth / 2 + 0.01,
								]}
							>
								<planeGeometry args={[0.12, 0.18]} />
								<meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.2} transparent opacity={0.8} />
							</mesh>
						))
					))}
				</>
			)}

			{(hovered || highlighted) && nome && (
				<Html position={[0, height / 2 + 0.3, 0]} center>
					<div className="bg-gray-900/90 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg border border-gray-700">
						<p className="font-medium">{nome}</p>
						<p className="text-xs text-gray-400 capitalize">{tipo}</p>
					</div>
				</Html>
			)}
		</group>
	)
}

function Marker3D({ position, tipo, data, onClick }: { position: [number, number, number]; tipo: string; data: MarkerPayload; onClick?: () => void }) {
	const [hovered, setHovered] = useState(false)

	const markerConfig = useMemo(() => {
		const configs: Record<string, { color: string; icon: string; pulseColor: string }> = {
			demanda: { color: '#3B82F6', icon: '📋', pulseColor: '#60A5FA' },
			acidente: { color: '#EF4444', icon: '🚨', pulseColor: '#F87171' },
			alagamento: { color: '#06B6D4', icon: '🌊', pulseColor: '#22D3EE' },
			crime: { color: '#DC2626', icon: '⚠️', pulseColor: '#F87171' },
			obra: { color: '#F59E0B', icon: '🚧', pulseColor: '#FBBF24' },
			apagao: { color: '#6B7280', icon: '💡', pulseColor: '#9CA3AF' },
			buraco: { color: '#8B5CF6', icon: '🕳️', pulseColor: '#A78BFA' },
			camera: { color: '#10B981', icon: '📹', pulseColor: '#34D399' },
			semaforo: { color: '#22C55E', icon: '🚦', pulseColor: '#4ADE80' },
			viatura: { color: '#0EA5E9', icon: '🚔', pulseColor: '#38BDF8' },
		}
		return configs[tipo] || { color: '#6B7280', icon: '📍', pulseColor: '#9CA3AF' }
	}, [tipo])

	return (
		<group position={position}>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
				<ringGeometry args={[0.15, 0.2, 32]} />
				<meshBasicMaterial color={markerConfig.pulseColor} transparent opacity={0.5} />
			</mesh>

			<Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
				<mesh onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
					<sphereGeometry args={[0.12, 16, 16]} />
					<meshStandardMaterial color={markerConfig.color} emissive={markerConfig.color} emissiveIntensity={hovered ? 0.8 : 0.4} />
				</mesh>

				<mesh position={[0, -0.15, 0]}>
					<cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
					<meshStandardMaterial color={markerConfig.color} />
				</mesh>
			</Float>

			{hovered && (
				<Html position={[0, 0.4, 0]} center>
					<div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-gray-700 min-w-[150px]">
						<div className="flex items-center gap-2 mb-1">
							<span className="text-lg">{markerConfig.icon}</span>
							<span className="font-medium capitalize">{tipo}</span>
						</div>
						{data.titulo && <p className="text-gray-300 text-xs">{data.titulo}</p>}
						{data.status && (
							<span
								className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
									data.status === 'ativo'
										? 'bg-red-500/20 text-red-400'
										: data.status === 'em_atendimento'
											? 'bg-yellow-500/20 text-yellow-400'
											: 'bg-green-500/20 text-green-400'
								}`}
							>
								{data.status.replace('_', ' ')}
							</span>
						)}
					</div>
				</Html>
			)}
		</group>
	)
}

function Vehicle3D({ vehicle }: { vehicle: VehicleData }) {
	return (
		<group position={vehicle.position} rotation={[0, vehicle.heading, 0]}>
			<mesh>
				<boxGeometry args={[0.5, 0.18, 0.25]} />
				<meshStandardMaterial color={vehicle.cor} emissive={vehicle.cor} emissiveIntensity={0.35} metalness={0.4} roughness={0.5} />
			</mesh>
			{[-0.18, 0.18].map((z) => (
				<mesh key={`w-${z}`} position={[0.18, -0.08, z]}>
					<cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
					<meshStandardMaterial color="#0f172a" />
				</mesh>
			))}
			{[-0.18, 0.18].map((z) => (
				<mesh key={`wb-${z}`} position={[-0.18, -0.08, z]}>
					<cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
					<meshStandardMaterial color="#0f172a" />
				</mesh>
			))}
			<Html position={[0, 0.2, 0]} center>
				<div className="px-2 py-1 bg-gray-900/80 text-[10px] rounded border border-gray-700 text-white whitespace-nowrap">
					{vehicle.categoria === 'onibus' ? 'Ônibus' : vehicle.categoria === 'ambulancia' ? 'Ambulância' : 'Viatura'}
				</div>
			</Html>
		</group>
	)
}

function Person3D({ person }: { person: PersonData }) {
	return (
		<group position={person.position}>
			<mesh position={[0, 0.07, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
				<meshStandardMaterial color={person.cor} emissive={person.cor} emissiveIntensity={0.2} />
			</mesh>
			<mesh position={[0, 0.17, 0]}>
				<sphereGeometry args={[0.06, 16, 16]} />
				<meshStandardMaterial color="#e2e8f0" />
			</mesh>
		</group>
	)
}

function CityTerrain({ bairros, onBairroClick, selectedBairro }: { bairros: Bairro[]; onBairroClick: (bairro: Bairro) => void; selectedBairro: string | null }) {
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
				<planeGeometry args={[110, 110]} />
				<meshStandardMaterial color="#0f172a" />
			</mesh>

			{bairros.map((bairro) => {
				const isSelected = selectedBairro === bairro.id
				const [x, , z] = coordsTo3D(bairro.coords[0], bairro.coords[1])

				return (
					<group key={bairro.id}>
						<mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]} onClick={() => onBairroClick(bairro)}>
							<circleGeometry args={[Math.sqrt(bairro.area) * 0.8, 32]} />
							<meshStandardMaterial
								color={bairro.cor}
								transparent
								opacity={isSelected ? 0.6 : 0.28}
								emissive={bairro.cor}
								emissiveIntensity={isSelected ? 0.35 : 0.12}
							/>
						</mesh>

						<Html position={[x, 0.5, z]} center>
							<div
								className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
									isSelected ? 'bg-white text-gray-900 shadow-lg' : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
								}`}
								onClick={() => onBairroClick(bairro)}
							>
								{bairro.nome}
							</div>
						</Html>
					</group>
				)
			})}
		</group>
	)
}

function Roads({ vias, trafego }: { vias: typeof VIAS_PRINCIPAIS; trafego: TrafegoData[] }) {
	const getTrafegoColor = (nivel: TrafegoData['nivel']) => TRAFEGO_CORES[nivel] || '#6B7280'

	return (
		<group>
			{vias.map((via) => {
				const trafegoVia = trafego.find((t) => t.segmento === via.id)
				const color = trafegoVia ? getTrafegoColor(trafegoVia.nivel) : '#4A5568'

				const points = via.coords.map(([lat, lng]) => {
					const [x, , z] = coordsTo3D(lat, lng)
					return new THREE.Vector3(x, 0.03, z)
				})

				const curve = new THREE.CatmullRomCurve3(points)
				const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false)

				return (
					<mesh key={via.id} geometry={tubeGeometry}>
						<meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
					</mesh>
				)
			})}
		</group>
	)
}

function CameraController({ target, autoRotate }: { target: [number, number, number]; autoRotate: boolean }) {
	const controlsRef = useRef<OrbitControlsImpl | null>(null)
	const { camera } = useThree()

	useEffect(() => {
		if (controlsRef.current) {
			controlsRef.current.target.set(...target)
			controlsRef.current.update()
		}
	}, [target])

	useEffect(() => {
		camera.position.set(30, 30, 30)
	}, [camera])

	return (
		<OrbitControls
			ref={controlsRef}
			makeDefault
			enableDamping
			dampingFactor={0.05}
			minDistance={5}
			maxDistance={120}
			maxPolarAngle={Math.PI / 2.2}
			autoRotate={autoRotate}
			autoRotateSpeed={0.3}
		/>
	)
}

type Scene3DProps = {
	bairros: Bairro[]
	alertas: Alerta[]
	sensores: SensorData[]
	viaturas: Viatura[]
	trafego: TrafegoData[]
	vehicles: VehicleData[]
	people: PersonData[]
	layers: {
		buildings: boolean
		sensors: boolean
		traffic: boolean
		alerts: boolean
		viaturas: boolean
		vehicles: boolean
		people: boolean
	}
	selectedBairro: string | null
	onBairroClick: (bairro: Bairro) => void
	onAlertaClick: (alerta: Alerta) => void
	autoRotate: boolean
	cameraTarget: [number, number, number]
}

function Scene3D({
	bairros,
	alertas,
	sensores,
	viaturas,
	trafego,
	vehicles,
	people,
	layers,
	selectedBairro,
	onBairroClick,
	onAlertaClick,
	autoRotate,
	cameraTarget,
}: Scene3DProps) {
	const staticData = useMemo(() => buildStatic3DData(), [])

	return (
		<>
			<ambientLight intensity={0.45} />
			<directionalLight
				position={[50, 50, 25]}
				intensity={1}
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-camera-far={100}
				shadow-camera-left={-50}
				shadow-camera-right={50}
				shadow-camera-top={50}
				shadow-camera-bottom={-50}
			/>
			<pointLight position={[-20, 20, -20]} intensity={0.5} color="#4A90D9" />
			<pointLight position={[20, 20, 20]} intensity={0.3} color="#FFD700" />

			<Sky distance={450000} sunPosition={[100, 20, 100]} inclination={0.6} azimuth={0.25} turbidity={8} rayleigh={0.5} />

			<CameraController target={cameraTarget} autoRotate={autoRotate} />

			<CityTerrain bairros={bairros} onBairroClick={onBairroClick} selectedBairro={selectedBairro} />

			{layers.traffic && <Roads vias={VIAS_PRINCIPAIS} trafego={trafego} />}

			{layers.buildings &&
				staticData.buildings.map((building) => (
					<Building3D
						key={building.id}
						{...building}
						highlighted={building.bairro === selectedBairro || building.isPOI}
						onClick={building.bairro ? () => onBairroClick(bairros.find((b) => b.id === building.bairro) || BAIRROS_PARNAMIRIM[0]) : undefined}
					/>
				))}

			{layers.sensors &&
				sensores.map((sensor) => {
					const [x, , z] = coordsTo3D(sensor.coords[0], sensor.coords[1])
					return <Marker3D key={sensor.id} position={[x, 0.3, z]} tipo={sensor.tipo} data={{ status: sensor.status }} />
				})}

			{layers.alerts &&
				alertas
					.filter((a) => a.status === 'ativo')
					.map((alerta) => {
						const [x, , z] = coordsTo3D(alerta.coords[0], alerta.coords[1])
						return <Marker3D key={alerta.id} position={[x, 0.4, z]} tipo={alerta.tipo} data={{ titulo: alerta.titulo, status: alerta.status }} onClick={() => onAlertaClick(alerta)} />
					})}

			{layers.viaturas &&
				viaturas.map((viatura) => {
					const [x, , z] = coordsTo3D(viatura.coords[0], viatura.coords[1])
					return <Marker3D key={viatura.id} position={[x, 0.25, z]} tipo="viatura" data={{ titulo: viatura.tipo, status: viatura.status }} />
				})}

			{layers.vehicles && vehicles.map((vehicle) => <Vehicle3D key={vehicle.id} vehicle={vehicle} />)}
			{layers.people && people.map((person) => <Person3D key={person.id} person={person} />)}

			<EffectComposer>
				<Bloom intensity={0.5} luminanceThreshold={0.8} luminanceSmoothing={0.9} />
			</EffectComposer>
		</>
	)
}

export function DigitalTwinPage() {
	const [viewMode, setViewMode] = useState<'3D' | 'MAP' | 'DATA'>('3D')
	const [autoRotate, setAutoRotate] = useState(true)
	const [layers, setLayers] = useState({
		buildings: true,
		sensors: true,
		traffic: true,
		alerts: true,
		viaturas: true,
		vehicles: true,
		people: true,
	})
	const [selectedBairro, setSelectedBairro] = useState<string | null>(null)
	const [selectedAlerta, setSelectedAlerta] = useState<Alerta | null>(null)
	const [showRightPanel, setShowRightPanel] = useState(false)
	const [showLeftPanel, setShowLeftPanel] = useState(true)
	const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0, 0])
	const [currentTime, setCurrentTime] = useState(new Date())
	const [isFullscreen, setIsFullscreen] = useState(false)

	const static3D = useMemo(() => buildStatic3DData(), [])

	const prioridades: Alerta['prioridade'][] = ['baixa', 'media', 'alta', 'critica']
	const niveisTrafego: TrafegoData['nivel'][] = ['livre', 'moderado', 'lento', 'congestionado']

	const [metricas, setMetricas] = useState<MetricasCidade>({
		energiaMedia: 67,
		aguaMedia: 72,
		qualidadeAr: 'boa',
		temperatura: 28,
		umidade: 75,
		trafego: 'moderado',
		sensoresOnline: 47,
		sensoresTotal: 52,
		alertasAtivos: 8,
		demandasAbertas: 124,
		viaturasDisponiveis: 12,
	})

	const [sensores, setSensores] = useState<SensorData[]>(() => {
		const data: SensorData[] = []
		BAIRROS_PARNAMIRIM.forEach((bairro) => {
			for (let i = 0; i < 3; i++) {
				const offset = i * 10
				data.push({
					id: `semaforo-${bairro.id}-${i}`,
					tipo: 'semaforo',
					coords: [
						bairro.coords[0] + (seededRandom(bairro.id, offset) - 0.5) * 0.01,
						bairro.coords[1] + (seededRandom(bairro.id, offset + 1) - 0.5) * 0.01,
					],
					status: seededRandom(bairro.id, offset + 2) > 0.1 ? 'online' : 'offline',
					ultimaAtualizacao: new Date(),
				})
			}
			for (let i = 0; i < 2; i++) {
				const offset = i * 20
				data.push({
					id: `camera-${bairro.id}-${i}`,
					tipo: 'camera',
					coords: [
						bairro.coords[0] + (seededRandom(bairro.id, offset + 3) - 0.5) * 0.01,
						bairro.coords[1] + (seededRandom(bairro.id, offset + 4) - 0.5) * 0.01,
					],
					status: seededRandom(bairro.id, offset + 5) > 0.15 ? 'online' : 'offline',
					ultimaAtualizacao: new Date(),
				})
			}
		})
		return data
	})

	const [alertas, setAlertas] = useState<Alerta[]>(() => {
		return BAIRROS_PARNAMIRIM.slice(0, 6).map((bairro, i) => {
			const prio = prioridades[Math.floor(seededRandom(bairro.id, i + 1) * prioridades.length)]
			const tipo = (['demanda', 'buraco', 'alagamento', 'obra', 'apagao', 'acidente'] as TipoAlerta[])[i % 6]
			return {
				id: `alerta-${i}`,
				tipo,
				titulo: `${tipo} em ${bairro.nome}`,
				descricao: 'Ocorrência registrada pelo CCO',
				coords: bairro.coords,
				prioridade: prio,
				timestamp: new Date(),
				bairro: bairro.nome,
				status: 'ativo',
			}
		})
	})

	const [viaturas, setViaturas] = useState<Viatura[]>([
		{ id: 'v1', tipo: 'policia', placa: 'ABC-1234', coords: [-5.9100, -35.2580], status: 'disponivel' },
		{ id: 'v2', tipo: 'ambulancia', placa: 'DEF-5678', coords: [-5.8950, -35.2420], status: 'em_ocorrencia' },
		{ id: 'v3', tipo: 'bombeiro', placa: 'GHI-9012', coords: [-5.9200, -35.2700], status: 'disponivel' },
		{ id: 'v4', tipo: 'fiscalizacao', placa: 'JKL-3456', coords: [-5.8880, -35.2350], status: 'disponivel' },
	])

	const [trafego, setTrafego] = useState<TrafegoData[]>(() =>
		VIAS_PRINCIPAIS.map((via, idx) => ({
			segmento: via.id,
			nivel: niveisTrafego[Math.floor(seededRandom(via.id, idx) * niveisTrafego.length)],
			velocidadeMedia: 20 + seededRandom(via.id, idx + 20) * 60,
			coords: via.coords,
		}))
	)

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000)
		return () => clearInterval(timer)
	}, [])

	useEffect(() => {
		const socket = io('http://localhost:3000/digital-twin', {
			transports: ['websocket'],
			reconnection: true,
		})

		socket.on('sensores:update', (data: SensorData[]) => setSensores(data))
		socket.on('alertas:update', (data: Alerta[]) => setAlertas(data))
		socket.on('alertas:novo', (alerta: Alerta) => setAlertas((prev) => [alerta, ...prev]))
		socket.on('viaturas:update', (data: Viatura[]) => setViaturas(data))
		socket.on('trafego:update', (data: TrafegoData[]) => setTrafego(data))
		socket.on('metricas:update', (data: MetricasCidade) => setMetricas(data))

		return () => {
			socket.disconnect()
		}
	}, [])

	const handleBairroClick = useCallback(
		(bairro: Bairro) => {
			setSelectedBairro(bairro.id === selectedBairro ? null : bairro.id)
			if (bairro.id !== selectedBairro) {
				const [x, , z] = coordsTo3D(bairro.coords[0], bairro.coords[1])
				setCameraTarget([x, 0, z])
			} else {
				setCameraTarget([0, 0, 0])
			}
		},
		[selectedBairro]
	)

	const handleAlertaClick = (alerta: Alerta) => {
		setSelectedAlerta(alerta)
		const [x, , z] = coordsTo3D(alerta.coords[0], alerta.coords[1])
		setCameraTarget([x, 0, z])
	}

	const toggleLayer = (layer: keyof typeof layers) => {
		setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
	}

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
			setIsFullscreen(true)
		} else {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
	}

	const resetCamera = () => {
		setCameraTarget([0, 0, 0])
		setSelectedBairro(null)
	}

	const bairroSelecionado = BAIRROS_PARNAMIRIM.find((b) => b.id === selectedBairro)

	return (
		<div className="h-[calc(100vh-4rem)] w-full bg-gray-950 text-white flex flex-col overflow-hidden rounded-xl">
			<header className="h-14 flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3 lg:px-4 z-50 rounded-t-xl">
				<div className="flex items-center gap-2 lg:gap-3">
					<button
						onClick={() => setShowLeftPanel((prev) => !prev)}
						className="p-1.5 lg:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm"
						aria-label="Alternar menu"
					>
						{showLeftPanel ? <Minimize2 size={16} /> : <Expand size={16} />}
					</button>
					<div className="flex items-center gap-2 lg:gap-3">
						<div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
							<Building2 size={20} className="lg:hidden" />
							<Building2 size={24} className="hidden lg:block" />
						</div>
						<div className="hidden sm:block">
							<h1 className="font-bold text-base lg:text-lg leading-tight">Cidade Digital 3D</h1>
							<p className="text-xs text-gray-400">Parnamirim • Gêmeo Digital</p>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 lg:gap-3">
					<button
						onClick={() => setShowRightPanel((prev) => !prev)}
						className="inline-flex items-center gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs lg:text-sm transition-colors"
					>
						{showRightPanel ? <PanelRightOpen size={14} /> : <PanelRight size={14} />}
						<span className="hidden md:inline">{showRightPanel ? 'Ocultar painel' : 'Mostrar painel'}</span>
					</button>

					<div className="hidden xl:flex items-center gap-3 text-xs lg:text-sm">
						<div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-lg">
							<Activity size={14} className="text-yellow-400" />
							<span>{metricas.sensoresOnline}/{metricas.sensoresTotal} sensores</span>
						</div>
						<div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-lg">
							<AlertTriangle size={14} className="text-red-400" />
							<span>{metricas.alertasAtivos} alertas</span>
						</div>
						<div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-lg">
							<Thermometer size={14} className="text-orange-400" />
							<span>{metricas.temperatura}°C</span>
						</div>
					</div>

					<div className="flex items-center gap-1.5 text-sm lg:text-base font-mono px-2 py-1 bg-gray-800/50 rounded-lg">
						<Clock size={14} className="text-gray-400" />
						<span className="tabular-nums">{currentTime.toLocaleTimeString('pt-BR')}</span>
					</div>
				</div>
			</header>

			<div className="flex-1 flex overflow-hidden min-h-0">
				{showLeftPanel && (
					<aside className="w-48 lg:w-56 xl:w-64 flex-shrink-0 bg-gray-900/95 border-r border-gray-800 flex flex-col overflow-hidden">
						<div className="p-3 lg:p-4 border-b border-gray-800">
							<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 lg:mb-3">Visualização</h3>
							<div className="flex rounded-lg overflow-hidden bg-gray-800">
								{(['3D', 'MAP', 'DATA'] as const).map((mode) => (
									<button
										key={mode}
										onClick={() => setViewMode(mode)}
										className={`flex-1 py-1.5 lg:py-2 text-xs lg:text-sm font-medium transition-colors ${
											viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
										}`}
									>
										{mode}
									</button>
								))}
							</div>
						</div>

						<div className="p-3 lg:p-4 border-b border-gray-800 space-y-2 lg:space-y-3">
							<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">Câmera</h3>
							<div className="flex items-center gap-1.5 lg:gap-2">
								<button className="p-1.5 lg:p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors" onClick={resetCamera}>
									<ZoomIn size={16} />
								</button>
								<button className="p-1.5 lg:p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
									<ZoomOut size={16} />
								</button>
								<button className="p-1.5 lg:p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
									<RotateCcw size={16} />
								</button>
							</div>
							<button
								onClick={() => setAutoRotate((prev) => !prev)}
								className={`w-full flex items-center gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors text-xs lg:text-sm ${
									autoRotate ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-400'
								}`}
							>
								{autoRotate ? <Pause size={14} /> : <Play size={14} />}
								<span>{autoRotate ? 'Pausar' : 'Iniciar'} rotação</span>
							</button>
						</div>

						<div className="p-3 lg:p-4 border-b border-gray-800">
							<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 lg:mb-3">Camadas</h3>
							<div className="space-y-1">
								{[
									{ key: 'buildings', label: 'Edificações', icon: Building2 },
									{ key: 'sensors', label: 'Sensores', icon: Activity },
									{ key: 'traffic', label: 'Trânsito', icon: Car },
									{ key: 'alerts', label: 'Alertas', icon: AlertTriangle },
								].map(({ key, label, icon: Icon }) => (
									<button
										key={key}
										onClick={() => toggleLayer(key as keyof typeof layers)}
										className="w-full flex items-center justify-between px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-gray-800 transition-colors"
									>
										<div className="flex items-center gap-1.5 lg:gap-2">
											<Icon size={14} className="text-gray-400" />
											<span className="text-xs lg:text-sm">{label}</span>
										</div>
										{layers[key as keyof typeof layers] ? <Eye size={14} className="text-blue-400" /> : <EyeOff size={14} className="text-gray-400" />}
									</button>
								))}
							</div>
						</div>

						<div className="p-3 lg:p-4 flex-1 overflow-y-auto space-y-2 lg:space-y-3">
							<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipos de Edificação</h3>
							<div className="grid grid-cols-1 gap-1.5 text-xs lg:text-sm text-gray-300">
								{[{ t: 'Residencial', c: '#4A90D9' }, { t: 'Comercial', c: '#9B59B6' }, { t: 'Industrial', c: '#E67E22' }, { t: 'Público', c: '#2ECC71' }].map((item) => (
									<div key={item.t} className="flex items-center gap-2">
										<div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.c }} />
										<span>{item.t}</span>
									</div>
								))}
							</div>
						</div>
					</aside>
				)}

				<main className="flex-1 relative min-h-0 min-w-0">
					<div className="absolute inset-0">
						<Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }} camera={{ position: [30, 30, 30], fov: 50 }} style={{ width: '100%', height: '100%' }}>
						<Scene3D
							bairros={BAIRROS_PARNAMIRIM}
							alertas={alertas}
							sensores={sensores}
							viaturas={viaturas}
							trafego={trafego}
							vehicles={static3D.vehicles}
							people={static3D.people}
							layers={layers}
							selectedBairro={selectedBairro}
							onBairroClick={handleBairroClick}
							onAlertaClick={handleAlertaClick}
							autoRotate={autoRotate}
							cameraTarget={cameraTarget}
						/>
						</Canvas>
					</div>

					<div className="absolute bottom-4 left-4 flex items-center gap-4 text-sm text-gray-400 bg-gray-900/80 px-3 py-2 rounded-lg shadow-lg z-10">
						<span>Zoom: 100%</span>
						<span>Rotação: {autoRotate ? 'Auto' : 'Manual'}</span>
						<button onClick={toggleFullscreen} className="p-1 hover:text-white transition-colors" aria-label="Tela cheia">
							<Maximize2 size={16} />
						</button>
					</div>
				</main>

				{showRightPanel && (
					<aside className="w-64 lg:w-72 xl:w-80 flex-shrink-0 bg-gray-900/95 border-l border-gray-800 flex flex-col overflow-hidden">
						<div className="flex border-b border-gray-800">
							<button className="flex-1 py-2.5 text-xs lg:text-sm font-medium border-b-2 border-blue-500 text-blue-400">Visão Geral</button>
							<button className="flex-1 py-2.5 text-xs lg:text-sm font-medium text-gray-400 hover:text-white">Detalhes</button>
						</div>

						<div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3">
							{/* Informação de contexto */}
							<div className="bg-gray-800/50 rounded-lg p-3 text-center">
								<Activity size={24} className="mx-auto text-gray-500 mb-2" />
								<p className="text-xs text-gray-400">Clique em um prédio ou sensor para ver detalhes</p>
							</div>

							{/* Bairro Selecionado */}
							{bairroSelecionado && (
								<div className="bg-gray-800 rounded-lg p-3">
									<div className="flex items-center justify-between mb-2">
										<h3 className="font-semibold text-sm">{bairroSelecionado.nome}</h3>
										<button onClick={() => setSelectedBairro(null)} className="p-1 hover:bg-gray-700 rounded">
											<X size={14} />
										</button>
									</div>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div>
											<p className="text-gray-400">População</p>
											<p className="font-medium">{bairroSelecionado.populacao.toLocaleString()}</p>
										</div>
										<div>
											<p className="text-gray-400">Área</p>
											<p className="font-medium">{bairroSelecionado.area} km²</p>
										</div>
									</div>
								</div>
							)}

							{/* Métricas da Cidade */}
							<div>
								<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Métricas da Cidade</h3>
								<div className="grid grid-cols-2 gap-2">
									<div className="bg-gray-800 rounded-lg p-2.5">
										<div className="flex items-center gap-1.5 text-gray-400 mb-1">
											<Lightbulb size={12} />
											<span className="text-[10px] lg:text-xs">Energia Média</span>
										</div>
										<p className="text-lg font-bold text-yellow-400">{metricas.energiaMedia}%</p>
									</div>
									<div className="bg-gray-800 rounded-lg p-2.5">
										<div className="flex items-center gap-1.5 text-gray-400 mb-1">
											<Droplets size={12} />
											<span className="text-[10px] lg:text-xs">Água Média</span>
										</div>
										<p className="text-lg font-bold text-blue-400">{metricas.aguaMedia}%</p>
									</div>
									<div className="bg-gray-800 rounded-lg p-2.5">
										<div className="flex items-center gap-1.5 text-gray-400 mb-1">
											<Wind size={12} />
											<span className="text-[10px] lg:text-xs">Qualidade do Ar</span>
										</div>
										<p className="text-lg font-bold text-green-400 capitalize">{metricas.qualidadeAr}</p>
									</div>
									<div className="bg-gray-800 rounded-lg p-2.5">
										<div className="flex items-center gap-1.5 text-gray-400 mb-1">
											<Car size={12} />
											<span className="text-[10px] lg:text-xs">Trânsito</span>
										</div>
										<p className="text-lg font-bold text-orange-400 capitalize">{metricas.trafego}</p>
									</div>
								</div>
							</div>

							{/* Alertas Ativos */}
							{alertas.filter((a) => a.status === 'ativo').length > 0 && (
								<div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
									<div className="flex items-center gap-1.5 text-red-400 mb-2">
										<AlertTriangle size={14} />
										<span className="font-medium text-xs">{alertas.filter((a) => a.status === 'ativo').length} alertas ativos</span>
									</div>
									<button
										onClick={() => setSelectedAlerta(alertas.find((a) => a.status === 'ativo') || null)}
										className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition-colors"
									>
										<ChevronRight size={12} />
										Ver detalhes
									</button>
								</div>
							)}

							{/* Alertas Recentes */}
							<div>
								<h3 className="text-[10px] lg:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alertas Recentes</h3>
								<div className="space-y-1.5">
									{alertas.slice(0, 3).map((alerta) => (
										<button
											key={alerta.id}
											onClick={() => handleAlertaClick(alerta)}
											className="w-full flex items-start gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
										>
											<div
												className={`p-1 rounded flex-shrink-0 ${
													alerta.prioridade === 'critica'
														? 'bg-red-500/20 text-red-400'
														: alerta.prioridade === 'alta'
															? 'bg-orange-500/20 text-orange-400'
															: alerta.prioridade === 'media'
																? 'bg-yellow-500/20 text-yellow-400'
																: 'bg-blue-500/20 text-blue-400'
												}`}
											>
												<AlertTriangle size={12} />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium truncate">{alerta.titulo}</p>
												<p className="text-[10px] text-gray-400">{alerta.bairro} • há 15 min</p>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>
					</aside>
				)}
			</div>

			{selectedAlerta && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
					<div className="bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700">
						<div className="flex items-center justify-between p-4 border-b border-gray-700">
							<div className="flex items-center gap-3">
								<div
									className={`p-2 rounded-lg ${
										selectedAlerta.prioridade === 'critica'
											? 'bg-red-500/20 text-red-400'
											: selectedAlerta.prioridade === 'alta'
												? 'bg-orange-500/20 text-orange-400'
												: 'bg-yellow-500/20 text-yellow-400'
									}`}
								>
									<AlertTriangle size={20} />
								</div>
								<div>
									<h2 className="font-semibold">{selectedAlerta.titulo}</h2>
									<p className="text-sm text-gray-400">{selectedAlerta.bairro}</p>
								</div>
							</div>
							<button onClick={() => setSelectedAlerta(null)} className="p-2 hover:bg-gray-800 rounded-lg">
								<X size={20} />
							</button>
						</div>
						<div className="p-4 space-y-4">
							<div>
								<p className="text-sm text-gray-400 mb-1">Descrição</p>
								<p>{selectedAlerta.descricao}</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-400 mb-1">Tipo</p>
									<p className="capitalize">{selectedAlerta.tipo}</p>
								</div>
								<div>
									<p className="text-sm text-gray-400 mb-1">Prioridade</p>
									<span
										className={`inline-flex px-2 py-1 rounded text-sm ${
											selectedAlerta.prioridade === 'critica'
												? 'bg-red-500/20 text-red-400'
												: selectedAlerta.prioridade === 'alta'
													? 'bg-orange-500/20 text-orange-400'
													: selectedAlerta.prioridade === 'media'
														? 'bg-yellow-500/20 text-yellow-400'
														: 'bg-blue-500/20 text-blue-400'
										}`}
									>
										{selectedAlerta.prioridade}
									</span>
								</div>
								<div>
									<p className="text-sm text-gray-400 mb-1">Status</p>
									<span
										className={`inline-flex px-2 py-1 rounded text-sm ${
											selectedAlerta.status === 'ativo'
												? 'bg-red-500/20 text-red-400'
												: selectedAlerta.status === 'em_atendimento'
													? 'bg-yellow-500/20 text-yellow-400'
													: 'bg-green-500/20 text-green-400'
										}`}
									>
										{selectedAlerta.status.replace('_', ' ')}
									</span>
								</div>
								<div>
									<p className="text-sm text-gray-400 mb-1">Horário</p>
									<p>{new Date(selectedAlerta.timestamp).toLocaleString('pt-BR')}</p>
								</div>
							</div>
							<div className="flex gap-3 pt-4">
								<button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">Atender Ocorrência</button>
								<button className="py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Despachar Viatura</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default DigitalTwinPage
