import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary para capturar erros de renderização e exibir UI de fallback.
 * Previne que erros em componentes filhos quebrem toda a aplicação.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro para debugging
    console.error('🚨 ErrorBoundary capturou um erro:', error)
    console.error('📍 Component Stack:', errorInfo.componentStack)
    
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    this.props.onReset?.()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, use-o
      if (this.props.fallback) {
        return this.props.fallback
      }

      // UI de erro padrão
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente ou volte para a página inicial.
              </p>
              
              {/* Mostrar detalhes do erro apenas em desenvolvimento */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <summary className="cursor-pointer font-medium text-destructive">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                <Button variant="outline" onClick={this.handleGoHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Página Inicial
                </Button>
                <Button onClick={this.handleReload}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Componente de fallback simples para erros em rotas específicas
 */
export function RouteErrorFallback({ 
  message = 'Erro ao carregar esta página',
  onRetry,
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <p className="text-destructive font-medium">{message}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  )
}
