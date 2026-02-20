import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg-dark text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="text-lg text-muted-foreground">Pagina nao encontrada</p>
      <Link
        to="/"
        className="mt-4 px-6 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity"
      >
        Voltar ao inicio
      </Link>
    </div>
  );
}
