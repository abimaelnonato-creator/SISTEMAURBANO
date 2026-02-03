import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useAIAssistantStore, useCrisisStore } from '@/store/smartCityStore'
import { useAppStore } from '@/store/appStore'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Badge removed - not used
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { SystemDataContext } from '@/lib/gemini'
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User,
  Loader2,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  MapPin,
  BarChart3,
  FileText,
  Clock,
  Copy,
  Check,
  Download,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Building2,
  Target,
  Calculator,
  ListOrdered,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Brain,
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import type { AIMessage, AIQuickAction } from '@/types'
import ReactMarkdown from 'react-markdown'

export function AssistentePage() {
  // Dados já inicializados pelo App.tsx
  // Usar seletores individuais para evitar re-renders desnecessários
  const demands = useAppStore((state) => state.demands)
  const secretarias = useAppStore((state) => state.secretarias)
  const { crises } = useCrisisStore()
  const { 
    conversations, 
    activeConversation, 
    quickActions,
    isTyping,
    isLoading,
    setActiveConversation, 
    createConversation, 
    deleteConversation,
    sendMessage 
  } = useAIAssistantStore()

  const [inputMessage, setInputMessage] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [inputMessage])

  // Build system data context from app state
  const buildSystemDataContext = useCallback((): SystemDataContext => {
    const totalDemandas = demands.length
    const demandasPendentes = demands.filter(d => d.status === 'aberta').length
    const demandasEmAndamento = demands.filter(d => d.status === 'em_andamento').length
    const demandasConcluidas = demands.filter(d => d.status === 'resolvida').length
    const taxaResolucao = totalDemandas > 0 ? Math.round((demandasConcluidas / totalDemandas) * 100) : 0
    const tempoMedioResolucao = 4.5
    
    const secretariasData = secretarias.map(s => ({
      nome: s.name,
      demandas: demands.filter(d => d.secretariaId === s.id).length,
      pendentes: demands.filter(d => d.secretariaId === s.id && d.status === 'aberta').length,
    }))
    
    const alertas = demands
      .filter(d => d.priority === 'urgente' && d.status !== 'resolvida')
      .slice(0, 5)
      .map(d => ({
        tipo: 'Demanda Urgente',
        descricao: d.title,
        bairro: d.neighborhood,
      }))
    
    const bairrosCounts = demands.reduce((acc, d) => {
      acc[d.neighborhood] = (acc[d.neighborhood] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const bairrosMaisDemandas = Object.entries(bairrosCounts)
      .map(([nome, demandas]) => ({ nome, demandas }))
      .sort((a, b) => b.demandas - a.demandas)
      .slice(0, 5)
    
    const categoriasCounts = demands.reduce((acc, d) => {
      const catName = d.category?.name || 'Sem Categoria'
      acc[catName] = (acc[catName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const categoriasMaisFrequentes = Object.entries(categoriasCounts)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
    
    const crisesAtivas = crises
      .filter(c => c.status === 'ativa')
      .map(c => ({
        titulo: c.name,
        nivel: String(c.severity),
        status: c.status,
      }))
    
    return {
      totalDemandas,
      demandasPendentes,
      demandasEmAndamento,
      demandasConcluidas,
      taxaResolucao,
      tempoMedioResolucao,
      secretarias: secretariasData,
      alertas,
      bairrosMaisDemandas,
      categoriasMaisFrequentes,
      crisesAtivas,
    }
  }, [demands, secretarias, crises])

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return
    
    const message = inputMessage
    setInputMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    const systemData = buildSystemDataContext()
    
    if (!activeConversation) {
      const newConv = createConversation('Nova Consulta')
      setActiveConversation(newConv)
      await sendMessage(newConv.id, message, systemData)
    } else {
      await sendMessage(activeConversation.id, message, systemData)
    }
  }

  const handleQuickAction = async (action: AIQuickAction) => {
    if (isLoading) return
    
    const systemData = buildSystemDataContext()
    
    if (!activeConversation) {
      const newConv = createConversation(action.label)
      setActiveConversation(newConv)
      await sendMessage(newConv.id, action.prompt, systemData)
    } else {
      await sendMessage(activeConversation.id, action.prompt, systemData)
    }
  }

  const handleNewConversation = () => {
    const conv = createConversation('Nova Conversa')
    setActiveConversation(conv)
  }

  const handleCopyMessage = (message: AIMessage) => {
    navigator.clipboard.writeText(message.content)
    setCopiedId(message.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getActionIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      TrendingUp: <TrendingUp className="h-4 w-4" />,
      AlertTriangle: <AlertTriangle className="h-4 w-4" />,
      BarChart3: <BarChart3 className="h-4 w-4" />,
      MapPin: <MapPin className="h-4 w-4" />,
      FileText: <FileText className="h-4 w-4" />,
      Building2: <Building2 className="h-4 w-4" />,
      Target: <Target className="h-4 w-4" />,
      Calculator: <Calculator className="h-4 w-4" />,
      ListOrdered: <ListOrdered className="h-4 w-4" />,
      LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
    }
    return icons[icon] || <Lightbulb className="h-4 w-4" />
  }

  const contextStats = useMemo(() => ({
    totalDemandas: demands.length,
    abertas: demands.filter(d => d.status === 'aberta').length,
    emAndamento: demands.filter(d => d.status === 'em_andamento').length,
    urgentes: demands.filter(d => d.priority === 'urgente').length,
    totalSecretarias: secretarias.length,
  }), [demands, secretarias])

  // Render message content with markdown support
  const renderMessageContent = (content: string) => {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className={cn(
      "h-[calc(100vh-120px)] flex gap-4 transition-all duration-300",
      isExpanded && "fixed inset-0 z-50 h-screen p-4 bg-background"
    )}>
      {/* Sidebar - Conversations */}
      {showSidebar && (
        <div className="w-72 shrink-0 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="p-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Assistente IA</CardTitle>
                    <p className="text-xs text-muted-foreground">Quimera</p>
                  </div>
                </div>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <Separator />

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma conversa</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inicie uma nova conversa ou use uma ação rápida
                    </p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={cn(
                        "group p-3 rounded-xl cursor-pointer transition-all",
                        activeConversation?.id === conv.id 
                          ? "bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          activeConversation?.id === conv.id ? "text-violet-600" : "text-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            activeConversation?.id === conv.id && "text-violet-700 dark:text-violet-300"
                          )}>{conv.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.messages.length} msgs • {formatDateTime(conv.updatedAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conv.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator />

            {/* Context Stats */}
            <div className="p-3 shrink-0 bg-gradient-to-br from-muted/50 to-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Contexto do Sistema
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 text-xs">
                  <Target className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">{contextStats.totalDemandas}</span>
                  <span className="text-muted-foreground">demandas</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 text-xs">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">{contextStats.abertas}</span>
                  <span className="text-muted-foreground">abertas</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="font-medium">{contextStats.urgentes}</span>
                  <span className="text-muted-foreground">urgentes</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-background/60 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium">{contextStats.totalSecretarias}</span>
                  <span className="text-muted-foreground">órgãos</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0 lg:hidden"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {activeConversation?.title || 'Nova Conversa'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {activeConversation 
                    ? `${activeConversation.messages.length} mensagens`
                    : 'Inicie uma conversa com o assistente'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Exportar conversa">
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Minimizar" : "Expandir"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 md:p-6 space-y-4">
                {!activeConversation || activeConversation.messages.length === 0 ? (
                  /* Welcome Screen */
                  <div className="max-w-2xl mx-auto py-8">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/25">
                        <Sparkles className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Assistente de Decisão IA</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Análise inteligente de dados urbanos, recomendações estratégicas 
                        e suporte à tomada de decisão para gestão municipal.
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quickActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action)}
                          disabled={isLoading}
                          className={cn(
                            "group p-4 rounded-xl border text-left transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700",
                            "bg-gradient-to-br from-white to-muted/30 dark:from-background dark:to-muted/10",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2.5 rounded-xl shrink-0 transition-colors",
                              action.category === 'visao_geral' && "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 group-hover:bg-blue-200",
                              action.category === 'prioridades' && "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 group-hover:bg-purple-200",
                              action.category === 'simulacao' && "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 group-hover:bg-amber-200",
                              action.category === 'relatorio' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 group-hover:bg-emerald-200",
                              action.category === 'crise' && "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 group-hover:bg-red-200",
                            )}>
                              {getActionIcon(action.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                                {action.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {action.prompt}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Suggestions */}
                    <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-100 dark:border-violet-900">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-medium text-violet-700 dark:text-violet-300">Sugestões de perguntas</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Qual bairro precisa de mais atenção?",
                          "Como está o SLA das secretarias?",
                          "Quais tendências você identifica?",
                          "Gere um relatório semanal",
                        ].map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => setInputMessage(suggestion)}
                            className="px-3 py-1.5 text-xs rounded-full border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Messages List */
                  <div className="max-w-3xl mx-auto space-y-6">
                    {activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' && "flex-row-reverse"
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                          message.role === 'assistant' 
                            ? "bg-gradient-to-br from-violet-500 to-purple-600" 
                            : "bg-gradient-to-br from-blue-500 to-cyan-500"
                        )}>
                          {message.role === 'assistant' ? (
                            <Bot className="h-5 w-5 text-white" />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div className={cn(
                          "flex-1 min-w-0",
                          message.role === 'user' && "flex flex-col items-end"
                        )}>
                          <div className={cn(
                            "rounded-2xl px-4 py-3 max-w-full overflow-hidden",
                            message.role === 'assistant' 
                              ? "bg-muted/60 rounded-tl-sm" 
                              : "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-tr-sm"
                          )}>
                            {message.role === 'assistant' ? (
                              renderMessageContent(message.content)
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                          </div>
                          
                          {/* Message Footer */}
                          <div className={cn(
                            "flex items-center gap-1 mt-1.5 text-xs text-muted-foreground",
                            message.role === 'user' && "flex-row-reverse"
                          )}>
                            <span>{formatDateTime(message.createdAt)}</span>
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-0.5 ml-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-muted"
                                  onClick={() => handleCopyMessage(message)}
                                  title="Copiar mensagem"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" title="Útil">
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" title="Não útil">
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-sm text-muted-foreground ml-1">Analisando dados...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t p-4 shrink-0 bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="max-w-3xl mx-auto">
              {/* Quick Action Pills */}
              {activeConversation && activeConversation.messages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin">
                  {quickActions.slice(0, 4).map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border bg-background hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
                    >
                      {getActionIcon(action.icon)}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Input Box */}
              <div className="relative flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua pergunta ou comando..."
                    className="min-h-[48px] max-h-[200px] pr-12 resize-none rounded-xl border-2 focus:border-violet-400 transition-colors"
                    disabled={isLoading}
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2">
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!inputMessage.trim() || isLoading}
                      className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        inputMessage.trim() 
                          ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Powered by Quimera
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
