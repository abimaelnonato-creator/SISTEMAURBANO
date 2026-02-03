// API Service - Conexão com o Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' };
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: 'Erro de conexão com o servidor' };
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ 
      accessToken: string; 
      refreshToken: string; 
      access_token?: string; 
      refresh_token?: string; 
      user: any 
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request<any>('/dashboard/summary');
  }

  async getDashboardCharts() {
    return this.request<any>('/dashboard/charts');
  }

  async getRecentActivity() {
    return this.request<any>('/dashboard/recent-activity');
  }

  async getAlerts() {
    return this.request<any>('/dashboard/alerts');
  }

  // Demands
  async getDemands(params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<any>(`/demands${queryString}`);
  }

  async getDemandById(id: string) {
    return this.request<any>(`/demands/${id}`);
  }

  async getDemandByProtocol(protocol: string) {
    return this.request<any>(`/demands/protocol/${protocol}`);
  }

  async createDemand(data: any) {
    return this.request<any>('/demands', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDemand(id: string, data: any) {
    return this.request<any>(`/demands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateDemandStatus(id: string, status: string, comment?: string) {
    return this.request<any>(`/demands/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  }

  async addDemandComment(id: string, content: string, isInternal: boolean = false) {
    return this.request<any>(`/demands/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    });
  }

  async deleteDemand(id: string) {
    return this.request<{ success: boolean; message: string }>(`/demands/${id}`, {
      method: 'DELETE',
    });
  }

  async resolveDemandWithImage(
    id: string, 
    resolutionComment?: string, 
    resolutionImage?: File,
    notifyCitizen: boolean = true
  ) {
    console.log('🚀 API: resolveDemandWithImage chamado')
    console.log('📍 ID:', id)
    console.log('📝 Comentário:', resolutionComment)
    console.log('📷 Imagem:', resolutionImage?.name)
    console.log('📱 Notificar:', notifyCitizen)
    
    const formData = new FormData();
    if (resolutionComment) {
      formData.append('resolutionComment', resolutionComment);
    }
    formData.append('notifyCitizen', String(notifyCitizen));
    if (resolutionImage) {
      formData.append('resolutionImage', resolutionImage);
    }

    console.log('🔑 Token presente:', !!this.token)
    
    const url = `${API_URL}/demands/${id}/resolve`;
    console.log('🌐 URL:', url)
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: formData,
      });

      console.log('📨 Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData)
        return { data: null, error: errorData.message || 'Erro ao resolver demanda' };
      }

      const data = await response.json();
      console.log('✅ Sucesso:', data)
      return { data, error: null };
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      return { data: null, error: 'Erro de conexão' };
    }
  }

  // Secretaries
  async getSecretaries() {
    return this.request<any>('/secretaries');
  }

  async getSecretaryById(id: string) {
    return this.request<any>(`/secretaries/${id}`);
  }

  async getSecretaryByCode(code: string) {
    return this.request<any>(`/secretaries/code/${code}`);
  }

  async getSecretaryStats(id: string) {
    return this.request<any>(`/secretaries/${id}/stats`);
  }

  async getSecretaryDetailedStats(id: string) {
    return this.request<any>(`/secretaries/${id}/stats/detailed`);
  }

  async getSecretaryDemands(id: string, params?: Record<string, any>) {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<any>(`/secretaries/${id}/demands${queryString}`);
  }

  async getSecretaryTeam(id: string) {
    return this.request<any>(`/secretaries/${id}/team`);
  }

  async getSecretaryCategories(id: string) {
    return this.request<any>(`/secretaries/${id}/categories`);
  }

  async getSecretaryActivity(id: string, limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request<any>(`/secretaries/${id}/activity${queryString}`);
  }

  async getSecretaryOverdue(id: string) {
    return this.request<any>(`/secretaries/${id}/overdue`);
  }

  async getSecretaryCritical(id: string) {
    return this.request<any>(`/secretaries/${id}/critical`);
  }

  // Categories
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getCategoriesBySecretary(secretaryId: string) {
    return this.request<any>(`/categories/secretary/${secretaryId}`);
  }

  // Users
  async getUsers(params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<any>(`/users${queryString}`);
  }

  async getUserById(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async createUser(data: { name: string; email: string; password: string; role: string; phone?: string; secretariaId?: string }) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string; phone: string; role: string; secretariaId: string }>) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleUserStatus(id: string) {
    return this.request<any>(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  // Reports
  async getGeneralReport(params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<any>(`/reports/general${queryString}`);
  }

  async exportReportCSV(params?: Record<string, any>) {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<any>(`/reports/export/csv${queryString}`);
  }

  // Geo
  async getNeighborhoods() {
    return this.request<any>('/geo/neighborhoods');
  }

  async getGeoLocations() {
    return this.request<any>('/geo/locations');
  }

  async getHeatmap() {
    return this.request<any>('/geo/heatmap');
  }

  // Auth - Additional Methods
  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request<any>('/auth/logout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<any>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async updateProfile(data: Partial<{ name: string; phone: string; avatar: string }>) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<any>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Uploads
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Erro no upload' };
      }
      return { data };
    } catch (error) {
      return { error: 'Erro ao fazer upload' };
    }
  }

  async uploadMultipleFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}/uploads/multiple`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Erro no upload' };
      }
      return { data };
    } catch (error) {
      return { error: 'Erro ao fazer upload' };
    }
  }

  // Real-time subscriptions (WebSocket)
  createWebSocket(): WebSocket | null {
    try {
      const wsUrl = API_URL.replace(/^http/, 'ws').replace('/api/v1', '');
      const ws = new WebSocket(wsUrl);
      return ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return null;
    }
  }

  // WhatsApp
  async getWhatsAppSessions(page = 1, limit = 20) {
    return this.request<any>(`/whatsapp/sessions?page=${page}&limit=${limit}`);
  }

  async getWhatsAppMessages(phone: string, page = 1, limit = 50) {
    return this.request<any>(`/whatsapp/sessions/${phone}/messages?page=${page}&limit=${limit}`);
  }

  async sendWhatsAppMessage(phone: string, message: string) {
    return this.request<any>('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    });
  }
}

export const api = new ApiService();
export default api;
