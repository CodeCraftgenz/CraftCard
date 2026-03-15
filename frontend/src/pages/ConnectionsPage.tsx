import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Search, User, Trash2, Check, X, Loader2, ArrowLeft, MapIcon, Calendar, Tag, Sparkles } from 'lucide-react';
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

const TabLoader = () => (
  <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-white/20" /></div>
);

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
    { key: 'connections', label: 'Conexoes', icon: Users },
    { key: 'pending', label: 'Pendentes', icon: Clock },
    { key: 'discover', label: 'Descobrir', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-card to-brand-bg text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/editor" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Conexoes e Memorias</h1>
            <p className="text-xs text-white/40">Sua rede de contatos</p>
          </div>
        </div>

        {/* Tabs — scrollable */}
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

        {/* Content */}
        <Suspense fallback={<TabLoader />}>
          {tab === 'timeline' && <TimelineTab />}
          {tab === 'map' && <MapTab />}
          {tab === 'events' && <EventsTab />}
          {tab === 'tags' && <TagsTab />}
          {tab === 'wrapped' && <WrappedTab />}
        </Suspense>
        {tab === 'connections' && <MyConnectionsTab />}
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

function PendingBadge() {
  const { data: pending } = usePendingConnections();
  if (!pending || pending.length === 0) return null;
  return (
    <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {pending.length}
    </span>
  );
}

function MyConnectionsTab() {
  const { data: connections, isLoading } = useMyConnections();
  const removeMutation = useRemoveConnection();

  if (isLoading) {
    return <div className="text-center py-12 text-white/30"><Loader2 size={24} className="animate-spin mx-auto" /></div>;
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={32} className="mx-auto text-white/20 mb-3" />
        <p className="text-white/40 text-sm">Voce ainda nao tem conexoes</p>
        <p className="text-white/20 text-xs mt-1">Visite perfis e clique em "Conectar" para comecar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {connections.map((conn) => (
        <motion.div
          key={conn.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
        >
          <Link to={`/${conn.profile.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/10">
              {conn.profile.photoUrl ? (
                <img src={resolvePhotoUrl(conn.profile.photoUrl)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-white/40" /></div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{conn.profile.displayName}</p>
              {conn.profile.tagline && <p className="text-[11px] text-white/40 truncate">{conn.profile.tagline}</p>}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => removeMutation.mutate(conn.id)}
            disabled={removeMutation.isPending}
            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            title="Remover conexao"
          >
            <Trash2 size={14} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

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
          placeholder="Buscar por nome, tagline ou localizacao..."
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

          {/* Pagination */}
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
