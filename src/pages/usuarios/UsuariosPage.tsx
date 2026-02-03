import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  Edit,
  Trash2,
  Ban,
  CheckCircle2,
  UserCog,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { User } from '@/types'

export function UsuariosPage() {
  // Usar seletores individuais para evitar re-renders desnecessários
  const secretarias = useAppStore((state) => state.secretarias)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [secretariaFilter, setSecretariaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    secretariaId: '',
  })

  // Load users from API
  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      setError(null)
      try {
        const response = await api.getUsers()
        if (response.error) {
          setError(response.error)
        } else if (response.data) {
          // Handle both array and paginated response
          const userData = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || response.data.users || []
          setUsers(userData)
        }
      } catch {
        setError('Erro ao carregar usuários')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    
    setSaving(true)
    setError(null)
    try {
      const response = await api.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone || undefined,
        secretariaId: newUser.secretariaId || undefined,
      })
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setUsers(prev => [...prev, response.data])
        setIsNewUserDialogOpen(false)
        setNewUser({ name: '', email: '', phone: '', password: '', role: '', secretariaId: '' })
      }
    } catch {
      setError('Erro ao criar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await api.toggleUserStatus(user.id)
      if (response.error) {
        setError(response.error)
      } else {
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        ))
      }
    } catch {
      setError('Erro ao alterar status do usuário')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    
    try {
      const response = await api.deleteUser(userId)
      if (response.error) {
        setError(response.error)
      } else {
        setUsers(prev => prev.filter(u => u.id !== userId))
      }
    } catch {
      setError('Erro ao excluir usuário')
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesSecretaria = secretariaFilter === 'all' || user.secretariaId === secretariaFilter
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive)
      return matchesSearch && matchesRole && matchesSecretaria && matchesStatus
    })
  }, [users, searchTerm, roleFilter, secretariaFilter, statusFilter])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'ADMIN').length,
    secretarios: users.filter(u => u.role === 'secretario' || u.role === 'COORDINATOR').length,
    operadores: users.filter(u => u.role === 'operador' || u.role === 'OPERATOR').length,
  }), [users])

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      ADMIN: 'Administrador',
      secretario: 'Secretário',
      COORDINATOR: 'Secretário',
      operador: 'Operador',
      OPERATOR: 'Operador',
      visualizador: 'Visualizador',
      VIEWER: 'Visualizador',
    }
    return labels[role] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      secretario: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      COORDINATOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      operador: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      OPERATOR: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      visualizador: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return colors[role] || ''
  }

  const getSecretariaName = (id: string | null) => {
    if (!id) return 'Todas'
    const sec = secretarias.find(s => s.id === id)
    return sec?.name || 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome do usuário" 
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@parnamirim.rn.gov.br" 
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Senha do usuário" 
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(84) 99999-9999" 
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Perfil *</Label>
                  <Select 
                    value={newUser.role} 
                    onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="COORDINATOR">Secretário</SelectItem>
                      <SelectItem value="OPERATOR">Operador</SelectItem>
                      <SelectItem value="VIEWER">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Secretaria</Label>
                  <Select
                    value={newUser.secretariaId}
                    onValueChange={(value) => setNewUser(prev => ({ ...prev, secretariaId: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a secretaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas (Admin)</SelectItem>
                      {secretarias.map(sec => (
                        <SelectItem key={sec.id} value={sec.id}>
                          {sec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <UserCog className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Secretários</p>
                <p className="text-2xl font-bold">{stats.secretarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadores</p>
                <p className="text-2xl font-bold">{stats.operadores}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="secretario">Secretário</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={secretariaFilter} onValueChange={setSecretariaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Secretaria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas secretarias</SelectItem>
                {secretarias.map(sec => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Secretaria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getRoleBadgeColor(user.role))}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getSecretariaName(user.secretariaId || null)}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="success" className="text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Permissões
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.isActive ? (
                          <DropdownMenuItem 
                            className="text-amber-600"
                            onClick={() => handleToggleStatus(user)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-green-600"
                            onClick={() => handleToggleStatus(user)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Ativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
