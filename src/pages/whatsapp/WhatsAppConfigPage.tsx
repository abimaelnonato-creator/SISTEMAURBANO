import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageCircle,
  Smartphone,
  QrCode,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Settings,
  Activity,
  AlertCircle,
  Wifi,
  WifiOff,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react'

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'PARNAMIRIM_KEY_2024'
const INSTANCE_NAME = 'ouvidoria_parnamirim'

interface InstanceInfo {
  instance: {
    instanceName: string
    instanceId: string
    status: string
    serverUrl: string
    apikey: string
  }
}

interface ConnectionState {
  state: string
  statusReason?: number
}

export function WhatsAppConfigPage() {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'unknown'>('unknown')
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Test message state
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do Sistema de Gestão Urbana de Parnamirim.')
  const [sendingTest, setSendingTest] = useState(false)

  // Webhook test state
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null)
  const [testingWebhook, setTestingWebhook] = useState(false)

  useEffect(() => {
    checkInstanceStatus()
  }, [])

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
        ...options.headers,
      },
    })
    return response
  }

  const checkInstanceStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if instance exists
      const response = await apiCall(`/instance/fetchInstances?instanceName=${INSTANCE_NAME}`)
      
      if (response.ok) {
        const instances = await response.json()
        
        if (instances && instances.length > 0) {
          setInstanceInfo(instances[0])
          
          // Check connection state
          const stateResponse = await apiCall(`/instance/connectionState/${INSTANCE_NAME}`)
          if (stateResponse.ok) {
            const stateData: ConnectionState = await stateResponse.json()
            
            if (stateData.state === 'open') {
              setConnectionStatus('connected')
              setQrCode(null)
            } else if (stateData.state === 'connecting') {
              setConnectionStatus('connecting')
              await fetchQrCode()
            } else {
              setConnectionStatus('disconnected')
              await fetchQrCode()
            }
          }
        } else {
          setConnectionStatus('disconnected')
          setInstanceInfo(null)
        }
      } else {
        setConnectionStatus('unknown')
        setError('Não foi possível conectar à Evolution API')
      }
    } catch (err) {
      console.error('Error checking status:', err)
      setConnectionStatus('unknown')
      setError('Evolution API não está acessível. Verifique se o container está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const createInstance = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await apiCall('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          webhook: {
            url: 'http://host.docker.internal:3000/api/v1/whatsapp/webhook',
            byEvents: false,
            base64: false,
            headers: {},
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED'
            ]
          }
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess('Instância criada com sucesso!')
        
        if (data.qrcode?.base64) {
          setQrCode(data.qrcode.base64)
          setConnectionStatus('connecting')
        }
        
        await checkInstanceStatus()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar instância')
      }
    } catch (err) {
      console.error('Error creating instance:', err)
      setError('Erro ao criar instância. Verifique se a Evolution API está rodando.')
    } finally {
      setLoading(false)
    }
  }

  const fetchQrCode = async () => {
    try {
      const response = await apiCall(`/instance/connect/${INSTANCE_NAME}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.base64) {
          setQrCode(data.base64)
          setConnectionStatus('connecting')
        }
      }
    } catch (err) {
      console.error('Error fetching QR code:', err)
    }
  }

  const restartInstance = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall(`/instance/restart/${INSTANCE_NAME}`, {
        method: 'PUT',
      })
      
      if (response.ok) {
        setSuccess('Instância reiniciada!')
        setTimeout(() => checkInstanceStatus(), 2000)
      } else {
        setError('Erro ao reiniciar instância')
      }
    } catch (err) {
      setError('Erro ao reiniciar instância')
    } finally {
      setLoading(false)
    }
  }

  const disconnectInstance = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall(`/instance/logout/${INSTANCE_NAME}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSuccess('WhatsApp desconectado!')
        setConnectionStatus('disconnected')
        setQrCode(null)
        await checkInstanceStatus()
      } else {
        setError('Erro ao desconectar')
      }
    } catch (err) {
      setError('Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  const deleteInstance = async () => {
    if (!confirm('Tem certeza que deseja excluir a instância? Você precisará criar uma nova e escanear o QR Code novamente.')) {
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall(`/instance/delete/${INSTANCE_NAME}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSuccess('Instância excluída!')
        setConnectionStatus('disconnected')
        setInstanceInfo(null)
        setQrCode(null)
      } else {
        setError('Erro ao excluir instância')
      }
    } catch (err) {
      setError('Erro ao excluir instância')
    } finally {
      setLoading(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      setError('Digite um número de telefone')
      return
    }
    
    setSendingTest(true)
    setError(null)
    
    try {
      // Format phone number
      let phone = testPhone.replace(/\D/g, '')
      if (!phone.startsWith('55')) {
        phone = '55' + phone
      }
      
      const response = await apiCall(`/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          number: phone,
          text: testMessage,
        }),
      })
      
      if (response.ok) {
        setSuccess('Mensagem enviada com sucesso!')
        setTestPhone('')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao enviar mensagem')
      }
    } catch (err) {
      setError('Erro ao enviar mensagem de teste')
    } finally {
      setSendingTest(false)
    }
  }

  const testWebhook = async () => {
    setTestingWebhook(true)
    setError(null)
    setWebhookTestResult(null)
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'messages.upsert',
          instance: INSTANCE_NAME,
          data: {
            key: {
              remoteJid: '5584999999999@s.whatsapp.net',
              fromMe: false,
              id: 'TEST_' + Date.now(),
            },
            pushName: 'Cidadão Teste',
            message: {
              conversation: 'Teste de webhook: Buraco na Rua Principal, 100, Centro. Está causando acidentes!',
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
          },
        }),
      })
      
      const data = await response.json()
      setWebhookTestResult({ status: response.status, data })
      
      if (response.ok) {
        setSuccess('Webhook testado com sucesso! Verifique as demandas.')
      } else {
        setError('Erro no teste do webhook')
      }
    } catch (err) {
      setError('Erro ao testar webhook. Verifique se o backend está rodando.')
      setWebhookTestResult({ error: String(err) })
    } finally {
      setTestingWebhook(false)
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-500"><Wifi className="w-3 h-3 mr-1" /> Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Aguardando conexão</Badge>
      case 'disconnected':
        return <Badge variant="destructive"><WifiOff className="w-3 h-3 mr-1" /> Desconectado</Badge>
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-500" />
            Configuração do WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Configure a integração com WhatsApp via Evolution API
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>×</Button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <span>{success}</span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSuccess(null)}>×</Button>
        </div>
      )}

      <Tabs defaultValue="connection">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="connection" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="h-4 w-4" />
            Testar
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Settings className="h-4 w-4" />
            Informações
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Conectar WhatsApp
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code com seu WhatsApp para conectar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {!instanceInfo && (
                  <Button onClick={createInstance} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                    Criar Instância
                  </Button>
                )}
                
                {instanceInfo && connectionStatus === 'disconnected' && (
                  <Button onClick={fetchQrCode} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                    Gerar QR Code
                  </Button>
                )}
                
                <Button variant="outline" onClick={checkInstanceStatus} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar Status
                </Button>
                
                {instanceInfo && connectionStatus === 'connected' && (
                  <Button variant="outline" onClick={disconnectInstance} disabled={loading}>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                )}
                
                {instanceInfo && (
                  <>
                    <Button variant="outline" onClick={restartInstance} disabled={loading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reiniciar
                    </Button>
                    <Button variant="destructive" onClick={deleteInstance} disabled={loading}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>

              <Separator />

              {/* QR Code Display */}
              {connectionStatus === 'connecting' && qrCode && (
                <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg border">
                  <h3 className="font-medium text-lg">Escaneie o QR Code</h3>
                  <div className="p-4 bg-white rounded-lg shadow-lg">
                    <img 
                      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                      alt="QR Code WhatsApp" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground max-w-md">
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
                    <p>3. Toque em <strong>Aparelhos conectados</strong></p>
                    <p>4. Toque em <strong>Conectar um aparelho</strong></p>
                    <p>5. Escaneie este QR Code</p>
                  </div>
                  <Button variant="outline" onClick={fetchQrCode}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar novo QR Code
                  </Button>
                </div>
              )}

              {connectionStatus === 'connected' && (
                <div className="flex flex-col items-center space-y-4 p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                  <h3 className="font-medium text-lg text-green-700 dark:text-green-400">WhatsApp Conectado!</h3>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    O sistema está pronto para receber mensagens
                  </p>
                </div>
              )}

              {connectionStatus === 'disconnected' && !qrCode && instanceInfo && (
                <div className="flex flex-col items-center space-y-4 p-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="h-16 w-16 text-yellow-500" />
                  <h3 className="font-medium text-lg text-yellow-700 dark:text-yellow-400">WhatsApp Desconectado</h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    Clique em "Gerar QR Code" para reconectar
                  </p>
                </div>
              )}

              {!instanceInfo && (
                <div className="flex flex-col items-center space-y-4 p-6 bg-muted/50 rounded-lg border">
                  <Smartphone className="h-16 w-16 text-muted-foreground" />
                  <h3 className="font-medium text-lg">Nenhuma instância configurada</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Clique em "Criar Instância" para configurar o WhatsApp
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6 mt-6">
          {/* Send Test Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Mensagem de Teste
              </CardTitle>
              <CardDescription>
                Envie uma mensagem para testar a conexão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="84999999999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: DDD + número (sem +55)
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button 
                onClick={sendTestMessage} 
                disabled={sendingTest || connectionStatus !== 'connected'}
              >
                {sendingTest ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Mensagem
              </Button>
              {connectionStatus !== 'connected' && (
                <p className="text-sm text-yellow-600">
                  ⚠️ Conecte o WhatsApp primeiro para enviar mensagens
                </p>
              )}
            </CardContent>
          </Card>

          {/* Test Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Testar Webhook (Simular Mensagem)
              </CardTitle>
              <CardDescription>
                Simula uma mensagem recebida para testar o fluxo completo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este teste simula uma mensagem de cidadão chegando ao sistema. 
                Uma nova demanda será criada automaticamente.
              </p>
              <Button 
                onClick={testWebhook} 
                disabled={testingWebhook}
                variant="outline"
              >
                {testingWebhook ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="mr-2 h-4 w-4" />
                )}
                Simular Mensagem de Cidadão
              </Button>
              
              {webhookTestResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Resultado do Teste:</p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(webhookTestResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações da API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Evolution API URL</p>
                  <p className="font-mono text-sm">{EVOLUTION_API_URL}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nome da Instância</p>
                  <p className="font-mono text-sm">{INSTANCE_NAME}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Webhook URL</p>
                  <p className="font-mono text-sm break-all">
                    http://localhost:3000/api/v1/whatsapp/webhook
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge()}
                </div>
              </div>
            </CardContent>
          </Card>

          {instanceInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações da Instância</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(instanceInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>1.</strong> O cidadão envia uma mensagem para o WhatsApp da Ouvidoria
              </p>
              <p>
                <strong>2.</strong> A Evolution API recebe a mensagem e envia para o webhook do sistema
              </p>
              <p>
                <strong>3.</strong> O sistema usa IA para classificar a demanda (secretaria, categoria, prioridade)
              </p>
              <p>
                <strong>4.</strong> A demanda é criada automaticamente e aparece no painel
              </p>
              <p>
                <strong>5.</strong> O cidadão recebe uma confirmação com o número do protocolo
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
