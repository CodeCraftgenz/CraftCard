import { Logo } from '@/components/atoms/Logo';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-bg-dark/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-sm text-white/50">
              Seu cartao digital profissional
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="/termos" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="/privacidade" className="hover:text-white transition-colors">
              Privacidade
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-white/30">
          {new Date().getFullYear()} CraftCard. Produto Codecraft.
        </div>
      </div>
    </footer>
  );
}
