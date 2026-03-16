import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0E1A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition mb-8">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-white/40 text-sm mb-8">Última atualização: 15 de março de 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white">1. Introdução</h2>
            <p>
              O CraftCard ("nós", "nosso") é uma plataforma de cartões digitais profissionais operada pela CodeCraftGenZ.
              Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Dados que Coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de conta:</strong> nome, email, foto de perfil (via Google OAuth ou cadastro manual)</li>
              <li><strong>Dados do cartão:</strong> bio, redes sociais, foto, links personalizados</li>
              <li><strong>Dados de uso:</strong> visualizações do cartão, cliques em links, conexões</li>
              <li><strong>Dados de agendamento:</strong> horários configurados, reservas recebidas</li>
              <li><strong>Dados de integração:</strong> token do Google Calendar (quando conectado pelo usuário)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Uso do Google Calendar</h2>
            <p>
              Quando você conecta o Google Calendar ao CraftCard, solicitamos acesso para <strong>criar e editar eventos</strong>
              na sua agenda. Utilizamos essa permissão exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Criar eventos automaticamente quando alguém agenda uma reunião pelo seu cartão digital</li>
              <li>Incluir lembretes de 30 minutos antes do agendamento</li>
            </ul>
            <p>
              <strong>Não acessamos, lemos ou modificamos</strong> seus eventos existentes no Google Calendar.
              Não compartilhamos seus dados do Google com terceiros. Você pode desconectar o Google Calendar
              a qualquer momento nas configurações do editor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Como Usamos os Dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exibir seu cartão digital público para visitantes</li>
              <li>Fornecer analytics de visualizações e cliques</li>
              <li>Processar agendamentos e enviar notificações</li>
              <li>Disparar webhooks configurados por você para integrações com CRM</li>
              <li>Melhorar a experiência do produto</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados pessoais. Compartilhamos dados apenas quando:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você configura webhooks para enviar leads ao seu CRM (Zapier, HubSpot, etc.)</li>
              <li>Necessário para processar pagamentos (Mercado Pago)</li>
              <li>Exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados em servidores seguros (Render, Cloudflare R2, Hostinger).
              Utilizamos criptografia HTTPS em todas as comunicações, senhas são hasheadas com bcrypt,
              e tokens JWT para autenticação segura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Seus Direitos</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar, corrigir ou excluir seus dados pessoais</li>
              <li>Exportar seus leads em formato CSV</li>
              <li>Desconectar integrações (Google Calendar, webhooks)</li>
              <li>Solicitar a exclusão completa da sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Contato</h2>
            <p>
              Para questões sobre privacidade, entre em contato:<br />
              Email: <a href="mailto:codecraftgenz@gmail.com" className="text-brand-cyan hover:underline">codecraftgenz@gmail.com</a><br />
              WhatsApp: <a href="https://wa.me/5535999358856" className="text-brand-cyan hover:underline">(35) 99935-8856</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} CraftCard — CodeCraftGenZ. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
