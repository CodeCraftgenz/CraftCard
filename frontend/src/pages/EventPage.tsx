/**
 * EventPage.tsx — Pagina publica de detalhes de um evento.
 *
 * Exibida quando alguem escaneia o QR Code de um evento ou acessa /events/:slug.
 * Nao requer autenticacao. Busca dados via endpoint publico GET /api/events/public/:slug.
 *
 * Funcionalidades:
 * - Imagem de capa com overlay gradiente
 * - Informacoes do evento (nome, data, local, descricao)
 * - Contador de conexoes realizadas no evento
 * - QR Code da URL do evento para compartilhamento
 * - Botao de compartilhar (Web Share API ou copiar link)
 * - CTA para criar cartao no CraftCard
 * - SEO via Helmet (title, description, og tags)
 * - Animacoes de entrada com framer-motion
 * - Design responsivo, mobile-first, tema escuro
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CalendarDays,
  MapPin,
  Users,
  Share2,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';
import { usePublicEvent } from '@/hooks/useEvents';

/** Formata uma data ISO para exibicao em portugues (ex: "15 de mar. de 2026, 19:00") */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata intervalo de datas para exibicao legivel */
function formatDateRange(start: string, end: string | null): string {
  const startStr = formatDate(start);
  if (!end) return startStr;
  const endStr = formatDate(end);
  return `${startStr} — ${endStr}`;
}

export function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, isError } = usePublicEvent(slug);
  const [copied, setCopied] = useState(false);

  const eventUrl = `${window.location.origin}/events/${slug}`;

  /** Compartilha via Web Share API ou copia o link para a area de transferencia */
  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.name ?? 'Evento CraftCard',
          text: event?.description ?? 'Confira este evento!',
          url: eventUrl,
        });
      } catch {
        // Usuario cancelou o compartilhamento — nao e erro
      }
    } else {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // --- Estado de carregamento ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // --- Estado de erro ---
  if (isError || !event) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Evento nao encontrado</h1>
          <p className="text-gray-400">
            O evento que voce esta procurando nao existe ou foi removido.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-brand-cyan text-brand-bg-dark font-semibold rounded-lg hover:bg-brand-cyan/90 transition"
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{event.name} | CraftCard</title>
        <meta name="description" content={event.description ?? `Evento ${event.name} no CraftCard`} />
        <meta property="og:title" content={`${event.name} | CraftCard`} />
        <meta property="og:description" content={event.description ?? `Evento ${event.name} no CraftCard`} />
        {event.coverUrl && <meta property="og:image" content={event.coverUrl} />}
        <meta property="og:url" content={eventUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-brand-bg-dark text-white">
        {/* --- Imagem de capa com overlay gradiente --- */}
        {event.coverUrl && (
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
            <img
              src={event.coverUrl}
              alt={`Capa do evento ${event.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/60 to-transparent" />
          </div>
        )}

        {/* --- Conteudo principal --- */}
        <div className="max-w-2xl mx-auto px-4 pb-16 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Nome do evento */}
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {event.name}
            </h1>

            {/* Data e hora */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3 text-gray-300"
            >
              <CalendarDays className="w-5 h-5 mt-0.5 text-brand-cyan shrink-0" />
              <span>{formatDateRange(event.startDate, event.endDate)}</span>
            </motion.div>

            {/* Local */}
            {event.location && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 text-gray-300"
              >
                <MapPin className="w-5 h-5 mt-0.5 text-brand-cyan shrink-0" />
                <span>{event.location}</span>
              </motion.div>
            )}

            {/* Badge de conexoes */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-brand-cyan/10 text-brand-cyan px-4 py-2 rounded-full text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              {event.connectionCount === 1
                ? '1 pessoa conectou neste evento'
                : `${event.connectionCount} pessoas conectaram neste evento`}
            </motion.div>

            {/* Descricao */}
            {event.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 rounded-xl p-5 border border-white/10"
              >
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                  {event.description}
                </p>
              </motion.div>
            )}

            {/* QR Code + compartilhamento */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10 flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <QrCode className="w-4 h-4" />
                <span>Escaneie para acessar o evento</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <QRCodeCanvas
                  value={eventUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                />
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Link copiado!
                  </>
                ) : (
                  <>
                    {'share' in navigator ? (
                      <Share2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Compartilhar evento
                  </>
                )}
              </button>
            </motion.div>

            {/* CTA para criar cartao */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center space-y-3 pt-4"
            >
              <p className="text-gray-400 text-sm">
                Crie seu cartao digital e conecte-se em eventos como este
              </p>
              <Link
                to="/register"
                className="inline-block px-8 py-3 bg-brand-cyan text-brand-bg-dark font-bold rounded-xl hover:bg-brand-cyan/90 transition text-lg"
              >
                Criar seu cartao
              </Link>
            </motion.div>

            {/* Branding CraftCard */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center pt-8 pb-4"
            >
              <p className="text-gray-500 text-xs">
                Powered by{' '}
                <Link to="/" className="text-brand-cyan hover:underline">
                  CraftCard
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export default EventPage;
