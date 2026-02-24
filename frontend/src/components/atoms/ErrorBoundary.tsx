import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-white mb-2">Algo deu errado</h1>
          <p className="text-white/50 text-sm mb-6">
            Ocorreu um erro inesperado. Tente recarregar a pagina.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm"
            >
              Inicio
            </button>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-lg bg-brand-cyan text-brand-bg-dark font-medium hover:bg-brand-cyan/90 transition-colors text-sm"
            >
              Recarregar
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 text-left text-xs text-red-400/70 bg-red-500/5 rounded-lg p-4 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
