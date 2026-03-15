import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Trophy, Eye, BarChart3, Search, X, Download,
  GraduationCap, ChevronRight, Crown, Power, Link2, UserCheck, UserX,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  useHackathonAnalytics,
  useHackathonParticipants,
  useHackathonTeams,
  useHackathonTeamDetail,
  useAdminSetting,
  useUpdateAdminSetting,
} from '@/hooks/useAdmin';
import { api } from '@/lib/api';
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

      {subTab === 'overview' && <AnalyticsBIPanel />}
      {subTab === 'participants' && <ParticipantsPanel />}
      {subTab === 'teams' && <TeamsPanel />}
    </div>
  );
}

// ── Recharts colors ────────────────────────────────────────

const PIE_COLORS = ['#E91E63', '#4CAF50', '#FF9800', '#9C27B0', '#FF5722', '#2196F3', '#F44336', '#607D8B', '#00BCD4', '#8BC34A', '#E040FB', '#00897B', '#3F51B5', '#FF7043'];

// ── BI Analytics Panel (Executive Dashboard) ──────────────

function AnalyticsBIPanel() {
  const { data: analytics, isLoading } = useHackathonAnalytics();
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const response = await api.get('/admin/hackathon/export-csv', { responseType: 'blob' });
      const blob = new Blob([response as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hackathon-senac-participantes.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !analytics) {
    return <div className="text-white/50 text-center py-12">Carregando analytics...</div>;
  }

  const { kpis, topAreas, topSkills, topParticipants } = analytics;

  // Prepare chart data
  const areaChartData = topAreas.map((a) => {
    const area = getAreaById(a.area);
    return { name: area?.name || a.area, value: a.count, color: area?.color || '#888' };
  });

  const skillChartData = topSkills.slice(0, 8).map((s) => {
    const skill = getSkillById(s.skill);
    return { name: skill?.label || s.skill, count: s.count, emoji: skill?.emoji || '' };
  });

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? 'Exportando...' : 'Exportar Relatorio CSV'}
        </button>
      </div>

      {/* KPI Cards — 2 rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Participantes" value={kpis.totalParticipants} icon={Users} color={HACKATHON_CONFIG.senacBlue} />
        <KpiCard label="Scans de QR Code" value={kpis.totalViews} icon={Eye} color="#8b5cf6" />
        <KpiCard label="Conexoes Geradas" value={kpis.totalConnections} icon={Link2} color="#22c55e" />
        <KpiCard label="Equipes Formadas" value={kpis.teamsFormed} icon={Trophy} color={HACKATHON_CONFIG.senacOrange} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Media por Equipe" value={kpis.avgPerTeam} icon={BarChart3} color="#06b6d4" />
        <KpiCard label="Conexoes/Participante" value={kpis.avgConnectionsPerParticipant} icon={UserCheck} color="#f97316" />
        <KpiCard label="Em Equipe" value={`${kpis.teamCoverage}%`} icon={Users} color="#22c55e" />
        <KpiCard label="Sem Equipe" value={kpis.orphanCount} icon={UserX} color="#ef4444" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart — Area distribution */}
        {areaChartData.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <h3 className="text-white font-semibold text-sm mb-4">Distribuicao por Area de Formacao</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={areaChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${(name ?? '').toString().split(' ')[0]} (${value})`}
                  labelLine={false}
                >
                  {areaChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart — Top Soft Skills */}
        {skillChartData.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <h3 className="text-white font-semibold text-sm mb-4">Top Soft Skills do Evento</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={skillChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                  width={100}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  formatter={(value: unknown) => [`${value} alunos`, 'Total']}
                />
                <Bar dataKey="count" fill={HACKATHON_CONFIG.senacOrange} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Participants (most scanned) */}
      {topParticipants.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Participantes Mais Populares (Scans de QR Code)</h3>
          <div className="space-y-2">
            {topParticipants.map((p, i) => (
              <div key={p.slug} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition">
                <span className="text-white/30 text-xs font-mono w-6 text-right">{i + 1}.</span>
                {p.photoUrl ? (
                  <img src={resolvePhotoUrl(p.photoUrl)} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                    {p.displayName[0]}
                  </div>
                )}
                <span className="text-white text-sm font-medium flex-1 truncate">{p.displayName}</span>
                <div className="flex items-center gap-1.5">
                  <Eye size={12} className="text-purple-400" />
                  <span className="text-purple-300 text-sm font-bold tabular-nums">{p.viewCount}</span>
                </div>
              </div>
            ))}
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
  value: number | string;
  icon: typeof Users;
  color: string;
}) {
  const display = typeof value === 'number'
    ? (Number.isInteger(value) ? value.toLocaleString('pt-BR') : value)
    : value;

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
        <p className="text-2xl font-bold text-white">{display}</p>
      </div>
      <p className="text-white/50 text-xs mt-1.5">{label}</p>
    </motion.div>
  );
}
