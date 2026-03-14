import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Trophy, Eye, BarChart3, Search, X,
  GraduationCap, ChevronRight, Crown, Power,
} from 'lucide-react';
import {
  useHackathonDashboard,
  useHackathonParticipants,
  useHackathonTeams,
  useHackathonTeamDetail,
  useAdminSetting,
  useUpdateAdminSetting,
} from '@/hooks/useAdmin';
import { FORMATION_AREAS, HACKATHON_CONFIG, getAreaById, getSkillById } from '../constants';
import { Pagination } from '@/components/atoms/Pagination';
import { resolvePhotoUrl } from '@/lib/constants';

// ── Sub-tab types ──────────────────────────────────────────

type SubTab = 'overview' | 'participants' | 'teams';

// ── Main Component ─────────────────────────────────────────

export function HackathonAdminDashboard() {
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const { data: settingData } = useAdminSetting('hackathon_active');
  const updateSetting = useUpdateAdminSetting();

  const isHackathonActive = settingData?.value === 'true';

  const handleToggleHackathon = () => {
    updateSetting.mutate({
      key: 'hackathon_active',
      value: isHackathonActive ? 'false' : 'true',
    });
  };

  const subTabs: { key: SubTab; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: 'Visao Geral', icon: BarChart3 },
    { key: 'participants', label: 'Participantes', icon: Users },
    { key: 'teams', label: 'Equipes', icon: Trophy },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
          >
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{HACKATHON_CONFIG.name}</h2>
            <p className="text-white/40 text-xs">Painel de monitoramento em tempo real (atualiza a cada 30s)</p>
          </div>
        </div>

        {/* Toggle Evento Ativo */}
        <button
          type="button"
          onClick={handleToggleHackathon}
          disabled={updateSetting.isPending}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            isHackathonActive
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
          }`}
        >
          <Power size={16} />
          <span>{isHackathonActive ? 'Evento Ativo' : 'Evento Inativo'}</span>
          <div className={`w-10 h-5 rounded-full relative transition-colors ${isHackathonActive ? 'bg-emerald-500' : 'bg-white/20'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isHackathonActive ? 'left-[22px]' : 'left-0.5'}`} />
          </div>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {subTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              subTab === key
                ? 'text-white'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
            style={subTab === key ? { background: `${HACKATHON_CONFIG.senacBlue}40` } : undefined}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && <OverviewPanel />}
      {subTab === 'participants' && <ParticipantsPanel />}
      {subTab === 'teams' && <TeamsPanel />}
    </div>
  );
}

// ── Overview Panel ─────────────────────────────────────────

function OverviewPanel() {
  const { data: stats, isLoading } = useHackathonDashboard();

  if (isLoading || !stats) {
    return <div className="text-white/50 text-center py-12">Carregando dados do hackathon...</div>;
  }

  const maxArea = Math.max(...Object.values(stats.areaDistribution), 1);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Participantes" value={stats.totalParticipants} icon={Users} color={HACKATHON_CONFIG.senacBlue} />
        <KpiCard label="Equipes Formadas" value={stats.teamsFormed} icon={Trophy} color={HACKATHON_CONFIG.senacOrange} />
        <KpiCard label="Media por Equipe" value={stats.avgPerTeam} icon={BarChart3} color="#22c55e" />
        <KpiCard label="Visualizacoes" value={stats.totalViews} icon={Eye} color="#8b5cf6" />
      </div>

      {/* Distribuicao por Area */}
      {Object.keys(stats.areaDistribution).length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Distribuicao por Area de Formacao</h3>
          <div className="space-y-2.5">
            {Object.entries(stats.areaDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([areaId, count]) => {
                const area = getAreaById(areaId);
                return (
                  <div key={areaId} className="flex items-center gap-3">
                    <span className="text-white/70 text-xs w-44 truncate">{area?.name || areaId}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxArea) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{ background: area?.color || HACKATHON_CONFIG.senacOrange }}
                      >
                        <span className="text-[10px] text-white font-bold">{count}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Participants Panel ─────────────────────────────────────

function ParticipantsPanel() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useHackathonParticipants(search, areaFilter, page);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <select
          aria-label="Filtrar por area"
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
        >
          <option value="">Todas areas</option>
          {FORMATION_AREAS.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <p className="text-white/40 text-xs">{data?.total ?? 0} participantes</p>

      {/* Tabela */}
      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_2fr] gap-3 px-4 py-2 text-white/40 text-xs font-medium">
          <span>Participante</span>
          <span>Email</span>
          <span>Area</span>
          <span>Soft Skills</span>
        </div>

        {data?.items.map((p) => {
          const area = p.hackathonArea ? getAreaById(p.hackathonArea) : null;
          return (
            <div key={p.id} className="flex flex-col md:grid md:grid-cols-[2fr_2fr_1.5fr_2fr] gap-2 md:gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
              {/* Nome + foto */}
              <div className="flex items-center gap-2.5">
                {p.photoUrl ? (
                  <img src={resolvePhotoUrl(p.photoUrl)} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-white/50 text-[10px] font-medium">{p.displayName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className="text-white text-sm font-medium truncate">{p.displayName}</span>
              </div>

              {/* Email */}
              <span className="text-white/50 text-xs truncate self-center">{p.email}</span>

              {/* Area badge */}
              <div className="self-center">
                {area ? (
                  <span
                    className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold"
                    style={{ background: `${area.color}20`, color: area.color }}
                  >
                    {area.name}
                  </span>
                ) : (
                  <span className="text-white/20 text-xs">—</span>
                )}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1 self-center">
                {p.hackathonSkills.map(skillId => {
                  const skill = getSkillById(skillId);
                  return skill ? (
                    <span key={skillId} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60" title={skill.description}>
                      {skill.emoji} {skill.label}
                    </span>
                  ) : null;
                })}
                {p.hackathonSkills.length === 0 && <span className="text-white/20 text-xs">—</span>}
              </div>
            </div>
          );
        })}

        {data?.items.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhum participante encontrado</div>
        )}
      </div>

      {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
    </div>
  );
}

// ── Teams Panel ────────────────────────────────────────────

function TeamsPanel() {
  const { data: teams, isLoading } = useHackathonTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (isLoading) return <div className="text-white/50 text-center py-12">Carregando equipes...</div>;

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-xs">{teams?.length ?? 0} equipes</p>

      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-3 px-4 py-2 text-white/40 text-xs font-medium">
          <span>Equipe</span>
          <span>Lider</span>
          <span>Vagas</span>
          <span></span>
        </div>

        {teams?.map(team => (
          <div key={team.id} className="flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr] gap-2 md:gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${HACKATHON_CONFIG.senacOrange}20` }}
              >
                <Trophy size={14} style={{ color: HACKATHON_CONFIG.senacOrange }} />
              </div>
              <div>
                <span className="text-white text-sm font-medium">{team.name}</span>
                <p className="text-white/30 text-[10px]">{new Date(team.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="self-center flex items-center gap-1.5">
              <Crown size={12} className="text-amber-400" />
              <span className="text-white/60 text-xs truncate">{team.leader?.name || team.leader?.email || '—'}</span>
            </div>

            <div className="self-center">
              <span className={`text-sm font-mono ${team.memberCount >= team.maxMembers ? 'text-red-400' : 'text-white/70'}`}>
                {team.memberCount}/{team.maxMembers}
              </span>
            </div>

            <div className="self-center">
              <button
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition flex items-center gap-1"
              >
                Ver Integrantes <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ))}

        {teams?.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhuma equipe formada ainda</div>
        )}
      </div>

      {/* Modal de integrantes */}
      <AnimatePresence>
        {selectedTeamId && (
          <TeamDetailModal orgId={selectedTeamId} onClose={() => setSelectedTeamId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Team Detail Modal ──────────────────────────────────────

function TeamDetailModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { data: team } = useHackathonTeamDetail(orgId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0f0f23] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">{team?.name || 'Carregando...'}</h3>
            {team && <p className="text-white/40 text-xs">{team.members.length}/{team.maxMembers} membros</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {team ? (
          <div className="space-y-3">
            {team.members.map((m, i) => {
              const area = m.hackathonArea ? getAreaById(m.hackathonArea) : null;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  {m.photoUrl ? (
                    <img src={resolvePhotoUrl(m.photoUrl)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white/50 text-sm font-medium">{(m.displayName || m.name || '?')[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{m.displayName || m.name}</span>
                      {m.role === 'OWNER' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                          <Crown size={8} /> LIDER
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">{m.email}</p>
                    {area && (
                      <span
                        className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: `${area.color}20`, color: area.color }}
                      >
                        {area.name}
                      </span>
                    )}
                    {m.hackathonSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.hackathonSkills.map(sid => {
                          const skill = getSkillById(sid);
                          return skill ? (
                            <span key={sid} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                              {skill.emoji} {skill.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-white/50">Carregando...</div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── KPI Card ───────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <p className="text-2xl font-bold text-white">
          {typeof value === 'number' && Number.isInteger(value) ? value.toLocaleString('pt-BR') : value}
        </p>
      </div>
      <p className="text-white/50 text-xs mt-1.5">{label}</p>
    </motion.div>
  );
}
