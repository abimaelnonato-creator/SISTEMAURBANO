import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState, UserRole } from '@/types'
import { api } from '@/lib/api'

// Flag global para evitar múltiplas chamadas ao checkAuth
let isCheckingAuth = false

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>
  updateUser: (user: Partial<User>) => void
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  setLoading: (loading: boolean) => void
  checkPermission: (allowedRoles: UserRole[]) => boolean
  hasRole: (role: UserRole) => boolean
  checkAuth: () => Promise<void>
  refreshAuth: () => Promise<boolean>
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
}

// Role hierarchy for permission checking
const roleHierarchy: Record<string, number> = {
  admin: 100,
  ADMIN: 100,
  coordenador: 80,
  COORDINATOR: 80,
  secretario: 60,
  operador: 40,
  OPERATOR: 40,
  visualizador: 20,
  VIEWER: 20,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })

        try {
          console.log('🔐 Iniciando login para:', email)
          const response = await api.login(email, password)
          console.log('📦 Resposta do login:', response)
          
          if (response.data) {
            // Backend returns accessToken/refreshToken (camelCase)
            const accessToken = response.data.accessToken || response.data.access_token
            const refreshTokenValue = response.data.refreshToken || response.data.refresh_token
            const user = response.data.user
            
            console.log('✅ Token recebido:', accessToken ? 'Sim' : 'Não')
            console.log('👤 User recebido:', user)
            
            api.setToken(accessToken || null)
            
            // Map backend user to frontend user format
            const mappedUser: User = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role?.toLowerCase() as UserRole || 'operador',
              phone: user.phone,
              avatar: user.avatar,
              secretariaId: user.secretaryId || user.secretary?.id,
              isActive: user.isActive,
              lastLogin: user.lastLoginAt || user.lastLogin,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }
            
            console.log('🔄 User mapeado:', mappedUser)
            
            set({
              user: mappedUser,
              token: accessToken,
              refreshToken: refreshTokenValue || accessToken,
              isAuthenticated: true,
              isLoading: false,
            })
            
            console.log('✅ Login bem sucedido, isAuthenticated = true')
            return { success: true }
          }
          
          console.log('❌ Login falhou - sem data na resposta:', response)
          set({ isLoading: false })
          return { success: false, error: response.error || 'Credenciais inválidas' }
        } catch (error) {
          console.error('❌ Login error:', error)
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      logout: async () => {
        try {
          await api.logout()
        } catch {
          // Ignore logout API errors
        }
        api.setToken(null)
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await api.register(data)
          set({ isLoading: false })
          
          if (response.data) {
            return { success: true }
          }
          return { success: false, error: response.error || 'Erro ao registrar' }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true })
        try {
          const response = await api.forgotPassword(email)
          set({ isLoading: false })
          
          if (response.data) {
            return { success: true }
          }
          return { success: false, error: response.error || 'Email não encontrado' }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.resetPassword(token, password)
          set({ isLoading: false })
          
          if (response.data) {
            return { success: true }
          }
          return { success: false, error: response.error || 'Token inválido ou expirado' }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true })
        try {
          const response = await api.updateProfile(data)
          
          if (response.data) {
            get().updateUser(data)
            set({ isLoading: false })
            return { success: true }
          }
          set({ isLoading: false })
          return { success: false, error: response.error || 'Erro ao atualizar perfil' }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true })
        try {
          const response = await api.changePassword(currentPassword, newPassword)
          set({ isLoading: false })
          
          if (response.data) {
            return { success: true }
          }
          return { success: false, error: response.error || 'Senha atual incorreta' }
        } catch {
          set({ isLoading: false })
          return { success: false, error: 'Erro ao conectar com o servidor' }
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      checkPermission: (allowedRoles) => {
        const user = get().user
        if (!user) return false
        return allowedRoles.includes(user.role)
      },

      hasRole: (role: UserRole) => {
        const user = get().user
        if (!user) return false
        // Check if user's role level is >= required role level
        return roleHierarchy[user.role] >= roleHierarchy[role]
      },

      checkAuth: async () => {
        // Proteção contra múltiplas chamadas simultâneas
        if (isCheckingAuth) {
          console.log('⏩ checkAuth já em execução, ignorando...')
          return
        }

        const token = get().token
        
        if (!token) {
          set({ isAuthenticated: false, isLoading: false, user: null })
          return
        }

        // Se já está autenticado com user, não precisa verificar novamente
        if (get().isAuthenticated && get().user) {
          console.log('✅ Já autenticado, pulando checkAuth')
          return
        }

        isCheckingAuth = true
        console.log('🔐 checkAuth iniciando...')
        api.setToken(token)
        
        try {
          const response = await api.getMe()
          
          if (response.data) {
            const user = response.data
            set({
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role?.toLowerCase() as UserRole || 'operador',
                phone: user.phone,
                avatar: user.avatar,
                secretariaId: user.secretaryId,
                isActive: user.isActive,
                lastLogin: user.lastLoginAt || user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              },
              isAuthenticated: true,
              isLoading: false,
            })
            console.log('✅ checkAuth concluído com sucesso')
          } else {
            // Token invalid, try refresh
            const refreshed = await get().refreshAuth()
            if (!refreshed) {
              await get().logout()
            }
          }
        } catch (error) {
          console.error('Check auth error:', error)
          set({ isAuthenticated: false, isLoading: false })
        } finally {
          isCheckingAuth = false
        }
      },

      refreshAuth: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) {
          return false
        }

        try {
          const response = await api.refreshToken(refreshToken)
          
          if (response.data) {
            const { access_token, refresh_token } = response.data
            api.setToken(access_token)
            set({ 
              token: access_token,
              refreshToken: refresh_token || refreshToken,
            })
            return true
          }
          return false
        } catch (error) {
          console.error('Refresh auth error:', error)
          return false
        }
      },
    }),
    {
      name: 'parnamirim-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Quando a store for restaurada do localStorage, configurar o token na API
        if (state?.token) {
          console.log('🔄 Restaurando token da sessão anterior')
          api.setToken(state.token)
        }
      },
    }
  )
)
