import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Map,
  FileText,
  Users,
  ShieldCheck,
} from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError('')
    const result = await login(data.email, data.password)
    console.log('Login result:', result)
    if (result.success) {
      // Pequeno delay para garantir que o localStorage foi salvo
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } else {
      setError(result.error || 'E-mail ou senha incorretos')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700/80 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-primary-100/40 bg-white shadow-2xl md:grid-cols-[1.05fr,0.95fr]">
        {/* Form side */}
        <div className="relative flex flex-col justify-between bg-white px-8 py-10 md:px-12">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-parnamirim" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-parnamirim text-white shadow-lg shadow-primary-400/30">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-primary-700">SEMSUR</p>
                <p className="text-lg font-bold text-primary-900">Serviços Urbanos</p>
              </div>
            </div>
            <div className="rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700 shadow-inner">
              Acesso Restrito
            </div>
          </div>

          <div className="mt-12 space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary-600">Secretaria de Serviços Urbanos</p>
              <h1 className="text-3xl font-bold leading-tight text-slate-900">Bem-vindo ao SEMSUR</h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Entre com suas credenciais para acessar o painel de demandas de iluminação, limpeza, praças, mercados e drenagem.
              </p>
            </div>

            <Card className="border border-primary-100/60 shadow-lg shadow-primary-500/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Acesso ao sistema</CardTitle>
                <CardDescription>Use seu e-mail institucional e senha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail institucional</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@parnamirim.rn.gov.br"
                      {...register('email')}
                      error={errors.email?.message}
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={isLoading}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-input" />
                      <span className="text-muted-foreground">Lembrar-me</span>
                    </label>
                    <button
                      type="button"
                      className="font-semibold text-primary-700 hover:underline"
                      onClick={() => navigate('/recuperar-senha')}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <Button type="submit" className="w-full h-11" loading={isLoading}>
                    Entrar no painel
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-800">Credenciais de demonstração</p>
              <div className="mt-3 grid gap-2 text-xs text-primary-900">
                <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <span className="text-primary-700">Admin</span>
                  <span className="font-mono font-medium">admin@semsur.parnamirim.rn.gov.br / admin123</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <span className="text-primary-700">Coordenador</span>
                  <span className="font-mono font-medium">coordenador@semsur.parnamirim.rn.gov.br / coord123</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <span className="text-primary-700">Operador</span>
                  <span className="font-mono font-medium">iluminacao@semsur.parnamirim.rn.gov.br / semsur123</span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">© 2026 SEMSUR - Parnamirim/RN. Todos os direitos reservados.</p>
        </div>

        {/* Brand / hero side */}
        <div className="relative hidden items-stretch bg-gradient-parnamirim text-white md:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.2),transparent_40%)]" />
          <div className="relative flex flex-1 flex-col justify-between px-12 py-12">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary-50/80">
              <ShieldCheck className="h-4 w-4" />
              SEMSUR - Serviços Urbanos
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-snug">SEMSUR: cuidando da cidade para você</h2>
              <p className="max-w-xl text-primary-50/90">
                Iluminação pública, limpeza urbana, praças, jardins, mercados e drenagem. Gestão moderna e transparente dos serviços urbanos de Parnamirim.
              </p>

              <div className="grid grid-cols-1 gap-4 text-sm">
                {[{ icon: <Map className="h-5 w-5" />, title: 'Mapa de demandas', desc: 'Iluminação, limpeza e drenagem em tempo real' },
                  { icon: <FileText className="h-5 w-5" />, title: 'Serviços SEMSUR', desc: 'Praças, mercados, capinação e poda de árvores' },
                  { icon: <Users className="h-5 w-5" />, title: 'WhatsApp Cidadão', desc: 'Receba e acompanhe demandas via WhatsApp' }].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-primary-50/80">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary-50/80">Call Center SEMSUR</p>
                <p className="text-lg font-bold">0800-281-6400 • 24h</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
