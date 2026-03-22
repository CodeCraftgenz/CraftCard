import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Search, User, Trash2, Check, X, Loader2, ArrowLeft, MapIcon, Calendar, Tag, Sparkles, Eye, LayoutGrid, List, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useMyConnections,
  usePendingConnections,
  useAcceptConnection,
  useRejectConnection,
  useRemoveConnection,
  useDiscoverProfiles,
  useRequestConnection,
} from '@/hooks/useConnections';
import { useProfile } from '@/hooks/useProfile';
import { resolvePhotoUrl } from '@/lib/constants';

const TimelineTab = lazy(() => import('./connections/TimelineTab'));
const MapTab = lazy(() => import('./connections/MapTab'));
const EventsTab = lazy(() => import('./connections/EventsTab'));
const TagsTab = lazy(() => import('./connections/TagsTab'));
const WrappedTab = lazy(() => import('./connections/WrappedTab'));

type Tab = 'timeline' | 'connections' | 'pending' | 'discover' | 'map' | 'events' | 'tags' | 'wrapped';

/** Spinner de carregamento para abas com lazy loading */
const TabLoader = () => (
  <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-white/20" /></div>
);

/** Pagina principal de conexoes, memorias e networking */
export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: profile } = useProfile();

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'map', label: 'Mapa', icon: MapIcon },
    { key: 'events', label: 'Eventos', icon: Calendar },
    { key: 'tags', label: 'Tags', icon: Tag },
    { key: 'wrapped', label: 'Wrapped', icon: Sparkles },
    { key: 'connections', label: 'Conexões', icon: Users },
    { key: 'pending', label: 'Pendentes', icon: Clock },
    { key: 'discover', label: 'Descobrir', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Cabecalho */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/editor" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Conexões e Memórias</h1>
            <p className="text-xs text-white/40">Sua rede de contatos</p>
          </div>
        </div>

        {/* Abas — com scroll horizontal */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 -mx-1 px-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  tab === t.key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon size={12} />
                {t.label}
                {t.key === 'pending' && <PendingBadge />}
              </button>
            );
          })}
        </div>

        {/* Conteudo da aba ativa */}
        <Suspense fallback={<TabLoader />}>
          {tab === 'timeline' && <TimelineTab />}
          {tab === 'map' && <MapTab />}
          {tab === 'events' && <EventsTab />}
          {tab === 'tags' && <TagsTab />}
          {tab === 'wrapped' && <WrappedTab />}
        </Suspense>
        {tab === 'connections' && <MyConnectionsTab onDiscoverClick={() => setTab('discover')} />}
        {tab === 'pending' && <PendingTab />}
        {tab === 'discover' && (
          <DiscoverTab
            query={searchQuery}
            onQueryChange={setSearchQuery}
            myProfileId={profile?.id}
          />
        )}
      </div>
    </div>
  );
}

/** Badge com contador de conexoes pendentes */
function PendingBadge() {
  const { data: pending } = usePendingConnections();
  if (!pending || pending.length === 0) return null;
  return (
    <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {pending.length}
    </span>
  );
}

/**
 * Formata data de conexao em formato legivel em portugues.
 * Conexoes recentes (< 7 dias) mostram tempo relativo ("ha 2 dias").
 * Conexoes mais antigas mostram data absoluta ("15 Mar 2025").
 */
function formatConnectionDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Conexoes recentes: tempo relativo em portugues
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 7) return `há ${diffDays} dias`;

  // Conexoes mais antigas: data absoluta formatada
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/** Aba principal de conexoes — design moderno com glass cards e animacoes */
function MyConnectionsTab({ onDiscoverClick }: { onDiscoverClick: () => void }) {
  const { data: connections, isLoading } = useMyConnections();
  const removeMutation = useRemoveConnection();

  // Estado local: busca por nome e modo de visualizacao (grid ou lista)
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtra conexoes pelo nome digitado na busca
  const filtered = (connections ?? []).filter((conn) =>
    conn.profile.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="text-center py-12 text-white/30">
        <Loader2 size={24} className="animate-spin mx-auto" />
      </div>
    );
  }

  // Estado vazio — nenhuma conexao encontrada
  if (!connections || connections.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-6"
      >
        {/* Icone decorativo com anel gradiente */}
        <div className="relative mx-auto w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 blur-xl" />
          <div className="relative w-full h-full rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <Users size={32} className="text-white/25" />
          </div>
        </div>
        <p className="text-white/50 text-sm font-medium mb-1">Nenhuma conexão ainda</p>
        <p className="text-white/25 text-xs mb-6 max-w-[260px] mx-auto">
          Descubra pessoas incríveis e construa sua rede de contatos
        </p>
        <button
          type="button"
          onClick={onDiscoverClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cyan/20 text-brand-cyan text-sm font-medium hover:bg-brand-cyan/30 transition-all"
        >
          <UserPlus size={16} />
          Descobrir perfis
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca e controles */}
      <div className="flex items-center gap-3">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conexões..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:border-brand-cyan/40 focus:outline-none focus:ring-1 focus:ring-brand-cyan/20 transition-all"
          />
        </div>

        {/* Botoes de alternancia grid/lista */}
        <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
            }`}
            title="Visualização em grade"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
            }`}
            title="Visualização em lista"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Barra de estatisticas */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-white/40">
          <Users size={13} />
          <span className="text-xs font-medium">
            {filtered.length} {filtered.length === 1 ? 'conexão' : 'conexões'}
            {search && filtered.length !== connections.length && (
              <span className="text-white/20"> de {connections.length}</span>
            )}
          </span>
        </div>
      </div>

      {/* Lista de conexoes filtrada */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10"
        >
          <Search size={24} className="mx-auto text-white/15 mb-2" />
          <p className="text-white/30 text-sm">Nenhuma conexão encontrada para "{search}"</p>
        </motion.div>
      ) : (
        <motion.div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
              : 'flex flex-col gap-2.5'
          }
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((conn) => {
              const dateFormatted = formatConnectionDate(conn.connectedAt);

              return viewMode === 'grid' ? (
                /* ── Card modo grade: glass card com barra gradiente ── */
                <motion.div
                  key={conn.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative overflow-hidden bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-4 group hover:border-brand-cyan/30 transition-all duration-300"
                >
                  {/* Barra gradiente decorativa na lateral esquerda */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-brand-cyan/60 via-purple-500/40 to-transparent rounded-l-2xl" />

                  {/* Glow sutil no hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-brand-cyan/[0.03] to-transparent" />

                  {/* Conteudo do card */}
                  <div className="relative flex items-start gap-3.5">
                    {/* Foto de perfil com anel colorido e indicador online */}
                    <Link to={`/${conn.profile.slug}`} className="shrink-0">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-brand-cyan/50 to-purple-500/50">
                          <div className="w-full h-full rounded-full overflow-hidden bg-brand-card">
                            {conn.profile.photoUrl ? (
                              <img
                                src={resolvePhotoUrl(conn.profile.photoUrl)}
                                alt={conn.profile.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/[0.06]">
                                <User size={22} className="text-white/30" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Informacoes textuais */}
                    <div className="min-w-0 flex-1">
                      <Link to={`/${conn.profile.slug}`} className="block">
                        <p className="text-[15px] font-semibold text-white truncate leading-tight group-hover:text-brand-cyan/90 transition-colors">
                          {conn.profile.displayName}
                        </p>
                        {conn.profile.tagline && (
                          <p className="text-xs text-white/40 truncate mt-0.5 leading-snug">
                            {conn.profile.tagline}
                          </p>
                        )}
                      </Link>
                      {dateFormatted && (
                        <p className="text-[10px] text-white/25 mt-1.5 flex items-center gap-1">
                          <Clock size={10} className="shrink-0" />
                          Conectado {dateFormatted}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botoes de acao */}
                  <div className="relative flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                    <Link
                      to={`/${conn.profile.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                      title="Ver perfil"
                    >
                      <Eye size={13} />
                      <span>Perfil</span>
                    </Link>
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(conn.id)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Remover conexão"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Card modo lista: layout horizontal compacto ── */
                <motion.div
                  key={conn.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  exit={{ opacity: 0, x: -10 }}
                  className="relative flex items-center gap-3.5 px-4 py-3 bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl group hover:border-brand-cyan/30 transition-all duration-300"
                >
                  {/* Barra gradiente lateral */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-cyan/50 to-purple-500/30 rounded-l-xl" />

                  {/* Foto com anel */}
                  <Link to={`/${conn.profile.slug}`} className="shrink-0">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-brand-cyan/50 to-purple-500/50">
                        <div className="w-full h-full rounded-full overflow-hidden bg-brand-card">
                          {conn.profile.photoUrl ? (
                            <img
                              src={resolvePhotoUrl(conn.profile.photoUrl)}
                              alt={conn.profile.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/[0.06]">
                              <User size={18} className="text-white/30" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Nome e tagline */}
                  <Link to={`/${conn.profile.slug}`} className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-brand-cyan/90 transition-colors">
                      {conn.profile.displayName}
                    </p>
                    {conn.profile.tagline && (
                      <p className="text-[11px] text-white/35 truncate">{conn.profile.tagline}</p>
                    )}
                  </Link>

                  {/* Data de conexao (visivel em telas maiores) */}
                  {dateFormatted && (
                    <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/20 shrink-0">
                      <Clock size={10} />
                      {dateFormatted}
                    </span>
                  )}

                  {/* Acoes */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      to={`/${conn.profile.slug}`}
                      className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-all"
                      title="Ver perfil"
                    >
                      <Eye size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(conn.id)}
                      disabled={removeMutation.isPending}
                      className="p-2 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Remover conexão"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/** Aba de solicitacoes de conexao pendentes (aceitar/rejeitar) */
function PendingTab() {
  const { data: pending, isLoading } = usePendingConnections();
  const acceptMutation = useAcceptConnection();
  const rejectMutation = useRejectConnection();

  if (isLoading) {
    return <div className="text-center py-12 text-white/30"><Loader2 size={24} className="animate-spin mx-auto" /></div>;
  }

  if (!pending || pending.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={32} className="mx-auto text-white/20 mb-3" />
        <p className="text-white/40 text-sm">Nenhum pedido pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((conn) => (
        <motion.div
          key={conn.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <Link to={`/${conn.requester.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/10">
              {conn.requester.photoUrl ? (
                <img src={resolvePhotoUrl(conn.requester.photoUrl)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-white/40" /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{conn.requester.displayName}</p>
              {conn.requester.tagline && <p className="text-[11px] text-white/40 truncate">{conn.requester.tagline}</p>}
            </div>
          </Link>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => acceptMutation.mutate(conn.id)}
              disabled={acceptMutation.isPending}
              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
              title="Aceitar"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={() => rejectMutation.mutate(conn.id)}
              disabled={rejectMutation.isPending}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              title="Rejeitar"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Aba de descoberta de perfis — busca e envia solicitacoes de conexao */
function DiscoverTab({ query, onQueryChange, myProfileId }: { query: string; onQueryChange: (q: string) => void; myProfileId?: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDiscoverProfiles(query, page);
  const requestMutation = useRequestConnection();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleConnect = (profileId: string) => {
    if (!myProfileId) return;
    requestMutation.mutate(
      { fromProfileId: myProfileId, toProfileId: profileId },
      { onSuccess: () => setSentIds((prev) => new Set(prev).add(profileId)) },
    );
  };

  return (
    <div>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); setPage(1); }}
          placeholder="Buscar por nome, tagline ou localização..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-brand-cyan/50 focus:outline-none transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/30"><Loader2 size={24} className="animate-spin mx-auto" /></div>
      ) : !data || data.profiles.length === 0 ? (
        <div className="text-center py-12">
          <Search size={32} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40 text-sm">{query ? 'Nenhum perfil encontrado' : 'Digite para buscar perfis'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.profiles.map((p) => {
              const isSent = sentIds.has(p.id);
              const isOwn = p.id === myProfileId;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <Link to={`/${p.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/10">
                      {p.photoUrl ? (
                        <img src={resolvePhotoUrl(p.photoUrl)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-white/40" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.displayName}</p>
                      {p.tagline && <p className="text-[11px] text-white/40 truncate">{p.tagline}</p>}
                      {p.location && <p className="text-[10px] text-white/25 truncate">{p.location}</p>}
                    </div>
                  </Link>
                  {!isOwn && (
                    <button
                      type="button"
                      onClick={() => handleConnect(p.id)}
                      disabled={isSent || requestMutation.isPending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        isSent
                          ? 'bg-white/5 text-white/30'
                          : 'bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30'
                      }`}
                    >
                      {isSent ? 'Enviado' : 'Conectar'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Paginacao */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                Anterior
              </button>
              <span className="text-xs text-white/30">{page} / {data.totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                Proximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
