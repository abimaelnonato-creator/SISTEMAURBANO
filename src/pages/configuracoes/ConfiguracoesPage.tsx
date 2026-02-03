import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Bell,
  Shield,
  Palette,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Database,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Globe,
  Sparkles,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConfiguracoesPage() {
  // Usar seletores individuais para evitar re-renders desnecessários
  const user = useAuthStore((state) => state.user)
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Enterprise */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary-500/20 blur-3xl" />
        
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 p-1 shadow-2xl ring-4 ring-white/20">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/10 text-3xl font-bold backdrop-blur">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-500 text-primary-900 shadow-lg transition-transform hover:scale-110">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name || 'Administrador do Sistema'}</h1>
              <p className="mt-1 flex items-center gap-2 text-primary-100">
                <Mail className="h-4 w-4" />
                {user?.email || 'admin@parnamirim.rn.gov.br'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/30">
                  <Shield className="mr-1 h-3 w-3" />
                  {user?.role === 'admin' ? 'Administrador' : user?.role || 'Administrador'}
                </Badge>
                <Badge className="border-0 bg-accent-green-500/80 text-white hover:bg-accent-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 text-sm text-primary-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Prefeitura de Parnamirim</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Parnamirim, RN - Brasil</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Membro desde Jan 2024</span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 shadow-sm dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Configurações salvas!</p>
            <p className="text-sm opacity-80">Suas alterações foram aplicadas com sucesso.</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="inline-flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-500 dark:bg-slate-800">
          <TabsTrigger value="profile" className="gap-2 rounded-xl px-4 py-2.5 text-slate-600 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md dark:text-white dark:data-[state=active]:bg-primary-600">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-xl px-4 py-2.5 text-slate-600 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md dark:text-white dark:data-[state=active]:bg-primary-600">
            <Bell className="h-4 w-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 rounded-xl px-4 py-2.5 text-slate-600 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md dark:text-white dark:data-[state=active]:bg-primary-600">
            <Palette className="h-4 w-4" />
            <span>Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-xl px-4 py-2.5 text-slate-600 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md dark:text-white dark:data-[state=active]:bg-primary-600">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 rounded-xl px-4 py-2.5 text-slate-600 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md dark:text-white dark:data-[state=active]:bg-primary-600">
            <Database className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-500 dark:bg-slate-800">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">Informações Pessoais</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-200">Gerencie seus dados de perfil</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-white">Nome completo</Label>
                      <Input
                        id="name"
                        defaultValue={user?.name}
                        className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-white">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email}
                        className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-white">Telefone</Label>
                      <Input
                        id="phone"
                        defaultValue="(84) 99999-9999"
                        className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-white">Cargo</Label>
                      <Input
                        id="role"
                        defaultValue="Coordenador"
                        className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-white">Biografia</Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre você e sua função..."
                      className="min-h-[100px] rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">Localização e Idioma</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-200">Configure suas preferências regionais</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-white">Fuso horário</Label>
                      <Select defaultValue="brt">
                        <SelectTrigger className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brt">Brasília (BRT) -03:00</SelectItem>
                          <SelectItem value="utc">UTC +00:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-white">Idioma</Label>
                      <Select defaultValue="pt-BR">
                        <SelectTrigger className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                  <CardTitle className="text-base text-slate-900 dark:text-white">Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-1 shadow-lg">
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-white text-4xl font-bold text-primary-600 dark:bg-slate-700 dark:text-primary-400">
                          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AD'}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Button variant="outline" size="sm" className="gap-2 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:text-white dark:hover:bg-slate-700">
                        <Upload className="h-4 w-4" />
                        Enviar foto
                      </Button>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG ou GIF. Máximo 2MB.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                  <CardTitle className="text-base text-slate-900 dark:text-white">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 p-3 dark:border-primary-700 dark:bg-primary-900/40">
                      <span className="text-sm font-medium text-slate-700 dark:text-white">Demandas criadas</span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-300">127</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/40">
                      <span className="text-sm font-medium text-slate-700 dark:text-white">Resolvidas</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-300">98</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-700 dark:bg-cyan-900/40">
                      <span className="text-sm font-medium text-slate-700 dark:text-white">Taxa de resolução</span>
                      <span className="text-lg font-bold text-cyan-600 dark:text-cyan-300">77%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30">
              {isSaving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">Preferências de Notificação</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-200">Configure como deseja receber notificações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-700">
              {[
                { title: 'Novas demandas', desc: 'Receba notificações quando novas demandas forem criadas', checked: true },
                { title: 'Demandas urgentes', desc: 'Alertas para demandas com prioridade urgente', checked: true },
                { title: 'Prazo SLA', desc: 'Avisos quando demandas estiverem próximas do prazo', checked: true },
                { title: 'Comentários', desc: 'Notificações de novos comentários em suas demandas', checked: true },
                { title: 'E-mail diário', desc: 'Resumo diário das atividades enviado por e-mail', checked: false },
                { title: 'Relatórios semanais', desc: 'Relatório semanal de desempenho enviado por e-mail', checked: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked={item.checked} className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary-300 dark:bg-slate-700 dark:peer-focus:ring-primary-800"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary/25">
              <Save className="h-4 w-4" />
              Salvar preferências
            </Button>
          </div>
        </TabsContent>
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Tema da Interface</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Escolha o tema de sua preferência</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all hover:shadow-lg',
                      theme === 'light' 
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary/10 dark:border-primary-400 dark:bg-primary-900/40' 
                        : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-600 dark:bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                      theme === 'light' ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-slate-100 dark:bg-slate-600'
                    )}>
                      <Sun className="h-7 w-7 text-amber-500" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">Claro</span>
                    {theme === 'light' && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all hover:shadow-lg',
                      theme === 'dark' 
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary/10 dark:border-primary-400 dark:bg-primary-900/40' 
                        : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-600 dark:bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                      theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-slate-100 dark:bg-slate-600'
                    )}>
                      <Moon className="h-7 w-7 text-indigo-400" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">Escuro</span>
                    {theme === 'dark' && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all hover:shadow-lg',
                      theme === 'system' 
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary/10 dark:border-primary-400 dark:bg-primary-900/40' 
                        : 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-600 dark:bg-slate-700'
                    )}
                  >
                    <div className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                      theme === 'system' ? 'bg-slate-200 dark:bg-slate-500' : 'bg-slate-100 dark:bg-slate-600'
                    )}>
                      <Monitor className="h-7 w-7 text-slate-500 dark:text-slate-200" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">Sistema</span>
                    {theme === 'system' && (
                      <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white shadow-md">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Densidade Visual</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Ajuste o espaçamento da interface</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Select defaultValue="normal">
                  <SelectTrigger className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compacto</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="comfortable">Confortável</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500 dark:text-slate-200">
                  Ajusta o espaçamento entre elementos da interface para melhor visualização.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-md">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Alterar Senha</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Atualize sua senha de acesso</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700 dark:text-white">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-11 rounded-xl border-slate-300 bg-white pr-10 text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-white">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-11 rounded-xl border-slate-300 bg-white pr-10 text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-200">Mínimo 8 caracteres, incluindo letras e números</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-white">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
                  />
                </div>

                <Button className="w-full gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl">
                  <Lock className="h-4 w-4" />
                  Alterar senha
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Sessões Ativas</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Gerencie seus dispositivos conectados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border-2 border-green-300 bg-green-50 p-4 dark:border-green-600 dark:bg-green-900/40">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-800">
                      <Monitor className="h-6 w-6 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-white">Este dispositivo</p>
                      <p className="text-sm text-green-700 dark:text-green-300">macOS • Chrome • Parnamirim, RN</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-green-500 text-white">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-600">
                      <Phone className="h-6 w-6 text-slate-500 dark:text-slate-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">iPhone 14</p>
                      <p className="text-sm text-slate-500 dark:text-slate-200">iOS • Safari • Natal, RN</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-500 dark:text-white dark:hover:bg-slate-600">Encerrar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Configurações Gerais</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Configurações do sistema (apenas administradores)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-white">Prazo SLA padrão (dias)</Label>
                  <Input
                    type="number"
                    defaultValue="7"
                    className="h-11 w-32 rounded-xl border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-600" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Notificações automáticas</p>
                    <p className="text-sm text-slate-500 dark:text-slate-200">Enviar notificações automáticas para cidadãos</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Modo de manutenção</p>
                    <p className="text-sm text-slate-500 dark:text-slate-200">Bloquear acesso ao sistema para manutenção</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-slate-500"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white dark:border-slate-600 dark:from-slate-700 dark:to-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Informações do Sistema</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-200">Detalhes técnicos da aplicação</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Versão', value: '1.0.0', color: 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-200' },
                    { label: 'Ambiente', value: 'Produção', color: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' },
                    { label: 'Última atualização', value: '08 Jan 2026', color: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-white' },
                    { label: 'Banco de dados', value: 'PostgreSQL 15', color: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' },
                  ].map((item, index) => (
                    <div key={index} className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-600 dark:bg-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-200">{item.label}</p>
                      <p className={cn('mt-1 inline-block rounded-lg px-2 py-1 text-sm font-semibold', item.color)}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
