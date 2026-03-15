import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Crown, Check, X, Search,
  LogOut, Loader2, ChevronRight, GraduationCap, Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { resolvePhotoUrl } from '@/lib/constants';
import { HACKATHON_CONFIG, parseHackathonMeta, getAreaById } from './constants';

// ── Types ──────────────────────────────────────────────

interface TeamMember {
  id: string;
  role: string;
  name: string;
  displayName: string;
  photoUrl: string | null;
  slug: string | null;
  hackathonMeta: string | null;
}

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  maxMembers: number;
  myRole: string;
  members: TeamMember[];
}

interface Invite {
  id: string;
  teamName: string;
  memberCount: number;
  maxMembers: number;
}

interface Participant {
  slug: string;
  displayName: string;
  photoUrl: string | null;
  hackathonMeta: string | null;
  teamName: string | null;
}

// ── Component ──────────────────────────────────────────

interface HackathonTeamTabProps {
  accent: string;
}

export default function HackathonTeamTab({ accent }: HackathonTeamTabProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'team' | 'participants'>('team');
  const [teamName, setTeamName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingSlug, setInvitingSlug] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────

  const { data: team, isLoading: teamLoading } = useQuery<Team | null>({
    queryKey: ['hackathon-team'],
    queryFn: () => api.get('/hackathon/teams/mine'),
  });

  const { data: invites = [] } = useQuery<Invite[]>({
    queryKey: ['hackathon-invites'],
    queryFn: () => api.get('/hackathon/invites'),
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery<Participant[]>({
    queryKey: ['hackathon-participants'],
    queryFn: () => api.get('/hackathon/participants'),
    enabled: tab === 'participants',
  });

  // ── Mutations ───────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['hackathon-team'] });
    queryClient.invalidateQueries({ queryKey: ['hackathon-invites'] });
    queryClient.invalidateQueries({ queryKey: ['hackathon-participants'] });
  };

  const createTeam = useMutation({
    mutationFn: (name: string) => api.post('/hackathon/teams', { name }),
    onSuccess: invalidate,
  });

  const inviteMember = useMutation({
    mutationFn: (slug: string) => api.post('/hackathon/teams/invite', { slug }),
    onSuccess: () => { invalidate(); setInvitingSlug(null); },
  });

  const acceptInvite = useMutation({
    mutationFn: (id: string) => api.post(`/hackathon/invites/${id}/accept`),
    onSuccess: invalidate,
  });

  const declineInvite = useMutation({
    mutationFn: (id: string) => api.post(`/hackathon/invites/${id}/decline`),
    onSuccess: invalidate,
  });

  const leaveTeam = useMutation({
    mutationFn: () => api.delete('/hackathon/teams/leave'),
    onSuccess: invalidate,
  });

  const updateTeam = useMutation({
    mutationFn: (data: { name?: string }) => api.put('/hackathon/teams', data),
    onSuccess: invalidate,
  });

  // ── Filtered participants ───────────────────────────

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.displayName.toLowerCase().includes(q)
      || (p.teamName && p.teamName.toLowerCase().includes(q));
  });

  // ── Render ──────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
        <button
          type="button"
          onClick={() => setTab('team')}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          style={{
            background: tab === 'team' ? `${accent}20` : 'transparent',
            color: tab === 'team' ? 'white' : 'rgba(255,255,255,0.4)',
          }}
        >
          <Users size={14} /> Minha Equipe
          {(invites?.length ?? 0) > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {invites?.length ?? 0}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('participants')}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          style={{
            background: tab === 'participants' ? `${accent}20` : 'transparent',
            color: tab === 'participants' ? 'white' : 'rgba(255,255,255,0.4)',
          }}
        >
          <GraduationCap size={14} /> Participantes
        </button>
      </div>

      {/* ── Team Tab ──────────────────────────────────── */}
      {tab === 'team' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Pending invites */}
          {(invites?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Mail size={12} /> Convites recebidos
              </p>
              {(invites ?? []).map((inv) => (
                <div key={inv.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{inv.teamName}</p>
                    <p className="text-xs text-white/40">{inv.memberCount}/{inv.maxMembers} membros</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => acceptInvite.mutate(inv.id)}
                    disabled={acceptInvite.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:brightness-110"
                    style={{ background: accent }}
                  >
                    {acceptInvite.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    title="Recusar convite"
                    onClick={() => declineInvite.mutate(inv.id)}
                    disabled={declineInvite.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 border border-white/10 hover:bg-white/5 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {teamLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-white/30" />
            </div>
          ) : !team ? (
            /* No team — create one */
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <Users size={32} className="mx-auto mb-3 text-white/20" />
              <h3 className="text-lg font-bold text-white mb-1">Crie sua equipe</h3>
              <p className="text-sm text-white/40 mb-4">
                Monte seu time para o {HACKATHON_CONFIG.name} (max {HACKATHON_CONFIG.maxTeamSize} membros)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da equipe"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={40}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                />
                <button
                  type="button"
                  onClick={() => teamName.trim() && createTeam.mutate(teamName.trim())}
                  disabled={!teamName.trim() || createTeam.isPending}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:brightness-110 disabled:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accent})` }}
                >
                  {createTeam.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Criar'}
                </button>
              </div>
              {createTeam.isError && (
                <p className="text-red-400 text-xs mt-2">
                  {(createTeam.error as Error)?.message || 'Erro ao criar equipe'}
                </p>
              )}
            </div>
          ) : (
            /* Team exists */
            <div className="space-y-3">
              {/* Team header */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accent})` }}
                  >
                    {(team.name || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{team.name}</h3>
                    <p className="text-xs text-white/40">
                      {team.members?.length ?? 0}/{team.maxMembers ?? 5} membros
                    </p>
                  </div>
                  {team.myRole === 'OWNER' && (
                    <EditTeamName
                      currentName={team.name}
                      accent={accent}
                      onSave={(name) => updateTeam.mutate({ name })}
                      isPending={updateTeam.isPending}
                    />
                  )}
                </div>

                {/* Members */}
                <div className="space-y-2">
                  {(team.members ?? []).map((member) => {
                    const meta = parseHackathonMeta(member.hackathonMeta);
                    const area = meta.hackathonArea ? getAreaById(meta.hackathonArea) : null;
                    return (
                      <div key={member.id} className="flex items-center gap-3 py-2">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {member.photoUrl ? (
                            <img
                              src={resolvePhotoUrl(member.photoUrl)}
                              alt={member.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-bold">
                              {(member.displayName || '?').charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white truncate">{member.displayName}</span>
                            {member.role === 'OWNER' && <Crown size={12} className="text-amber-400 flex-shrink-0" />}
                          </div>
                          {area && (
                            <p className="text-[11px] truncate" style={{ color: area.color }}>
                              {area.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('participants')}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition hover:brightness-110"
                  style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${accent})` }}
                >
                  <UserPlus size={14} /> Convidar membros
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja sair da equipe?')) leaveTeam.mutate();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm text-red-400/60 border border-red-400/20 hover:bg-red-400/10 transition flex items-center gap-1.5"
                >
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Participants Tab ──────────────────────────── */}
      {tab === 'participants' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Buscar participante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
            />
          </div>

          {participantsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-white/30" />
            </div>
          ) : filteredParticipants.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">Nenhum participante encontrado</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredParticipants.map((p) => {
                const meta = parseHackathonMeta(p.hackathonMeta);
                const area = meta.hackathonArea ? getAreaById(meta.hackathonArea) : null;
                const isInMyTeam = team?.members?.some((m) => m.slug === p.slug);
                const hasTeam = !!p.teamName;

                return (
                  <div key={p.slug} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                      {p.photoUrl ? (
                        <img
                          src={resolvePhotoUrl(p.photoUrl)}
                          alt={p.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm font-bold">
                          {(p.displayName || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.displayName}</p>
                      <div className="flex items-center gap-2">
                        {area && (
                          <span className="text-[11px] truncate" style={{ color: area.color }}>{area.name}</span>
                        )}
                        {hasTeam && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/10">
                            {p.teamName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {isInMyTeam ? (
                      <span className="text-[10px] font-medium text-white/30 px-2 py-1 rounded-lg bg-white/5">
                        Na equipe
                      </span>
                    ) : hasTeam ? (
                      <span className="text-[10px] text-white/20 px-2 py-1">Em outra equipe</span>
                    ) : team ? (
                      <button
                        type="button"
                        onClick={() => {
                          setInvitingSlug(p.slug);
                          inviteMember.mutate(p.slug);
                        }}
                        disabled={inviteMember.isPending && invitingSlug === p.slug}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:brightness-110 flex items-center gap-1"
                        style={{ background: accent }}
                      >
                        {inviteMember.isPending && invitingSlug === p.slug ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <UserPlus size={12} /> Convidar
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => window.open(`/hackathon/card/${p.slug}`, '_blank')}
                        className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/10 hover:bg-white/5 transition flex items-center gap-1"
                      >
                        Ver <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Invite error feedback */}
          <AnimatePresence>
            {inviteMember.isError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-xs text-center"
              >
                {(inviteMember.error as Error)?.message || 'Erro ao convidar'}
              </motion.p>
            )}
            {inviteMember.isSuccess && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-xs text-center"
              >
                Convite enviado!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// ── Inline Edit Team Name ─────────────────────────────

function EditTeamName({
  currentName,
  accent,
  onSave,
  isPending,
}: {
  currentName: string;
  accent: string;
  onSave: (name: string) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(currentName); setEditing(true); }}
        className="text-xs text-white/30 hover:text-white/60 transition px-2 py-1"
      >
        Editar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        title="Nome da equipe"
        className="w-28 px-2 py-1 bg-white/5 border border-white/20 rounded-lg text-sm text-white focus:outline-none"
        autoFocus
      />
      <button
        type="button"
        title="Salvar"
        onClick={() => { if (value.trim()) { onSave(value.trim()); setEditing(false); } }}
        disabled={isPending || !value.trim()}
        className="p-1 rounded text-white/60 hover:text-white transition"
        style={{ color: accent }}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
      </button>
      <button
        type="button"
        title="Cancelar"
        onClick={() => setEditing(false)}
        className="p-1 rounded text-white/30 hover:text-white/60 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}
