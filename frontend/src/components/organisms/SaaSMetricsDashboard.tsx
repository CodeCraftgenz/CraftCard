import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Eye, Link2, MessageSquare, TrendingUp, TrendingDown,
  CreditCard, Zap, Crown, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useSaaSAnalytics } from '@/hooks/useAdmin';
import { resolvePhotoUrl } from '@/lib/constants';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6B7280',
  PRO: '#00E4F2',
  BUSINESS: '#8B5CF6',
  ENTERPRISE: '#F59E0B',
};

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export function SaaSMetricsDashboard() {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading } = useSaaSAnalytics(days);

  if (isLoading || !analytics) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  const { kpis, planDistribution, timeSeries, topProfiles, recentUpgrades, spikeProfiles } = analytics;

  // Plan chart data
  const planData = Object.entries(planDistribution)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({ name: plan, value: count, color: PLAN_COLORS[plan] || '#888' }));
  const totalPlanUsers = planData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Business Intelligence</h2>
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                days === p.value ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiStat label="Usuários" value={kpis.totalUsers} delta={kpis.userGrowth} icon={Users} color="#00E4F2" subValue={`+${kpis.usersInPeriod} no período`} />
        <KpiStat label="Cartões Ativos" value={kpis.totalProfiles} icon={CreditCard} color="#8B5CF6" />
        <KpiStat label="Pageviews" value={kpis.totalViews} icon={Eye} color="#F59E0B" />
        <KpiStat label="Conexões" value={kpis.totalConnections} delta={kpis.connectionsInPeriod > 0 ? Math.round((kpis.connectionsInPeriod / Math.max(kpis.totalConnections - kpis.connectionsInPeriod, 1)) * 100) : 0} icon={Link2} color="#22C55E" subValue={`+${kpis.connectionsInPeriod} no período`} />
        <KpiStat label="Leads" value={kpis.totalLeads} icon={MessageSquare} color="#EF4444" subValue={`+${kpis.leadsInPeriod} no período`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart — Users vs Connections over time */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Crescimento: Usuários vs Conexões</h3>
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E4F2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E4F2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  labelFormatter={(d) => `Data: ${d}`}
                />
                <Area type="monotone" dataKey="users" name="Novos Usuários" stroke="#00E4F2" fill="url(#gradUsers)" strokeWidth={2} />
                <Area type="monotone" dataKey="connections" name="Conexões" stroke="#22C55E" fill="url(#gradConns)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/30 text-sm text-center py-12">Sem dados no período</p>
          )}
        </div>

        {/* Donut Chart — Plan Distribution */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Distribuicao por Plano</h3>
          {planData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {planData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                    formatter={(value: unknown) => [`${value} usuários`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {planData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-white/60">{d.name}</span>
                    </div>
                    <span className="text-white/80 font-medium tabular-nums">
                      {d.value} ({totalPlanUsers > 0 ? Math.round((d.value / totalPlanUsers) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-white/30 text-sm text-center py-12">Sem dados</p>
          )}
        </div>
      </div>

      {/* Top Profiles Bar Chart */}
      {topProfiles.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Top 5 Cartões Mais Acessados</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProfiles} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                width={120}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                formatter={(value: unknown) => [`${value} views`, 'Total']}
              />
              <Bar dataKey="viewCount" fill="#00E4F2" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom tables: Upgrades + Spike Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Upgrades */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Crown size={14} className="text-amber-400" /> Upgrades Recentes
          </h3>
          {recentUpgrades.length > 0 ? (
            <div className="space-y-2">
              {recentUpgrades.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{u.userName}</p>
                    <p className="text-white/30 text-[10px]">{new Date(u.paidAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${PLAN_COLORS[u.plan] || '#888'}20`, color: PLAN_COLORS[u.plan] || '#888' }}>
                      {u.plan}
                    </span>
                    <p className="text-white/50 text-[10px] mt-0.5">R$ {u.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Nenhum upgrade no período</p>
          )}
        </div>

        {/* Spike Profiles (Hot Leads / Viral) */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" /> Picos de Trafego (24h)
          </h3>
          {spikeProfiles.length > 0 ? (
            <div className="space-y-2">
              {spikeProfiles.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/20 text-xs font-mono w-5 text-right">{i + 1}</span>
                  {s.photoUrl ? (
                    <img src={resolvePhotoUrl(s.photoUrl)!} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/30 text-[10px] font-bold">
                      {s.displayName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.displayName}</p>
                    <p className="text-white/30 text-[10px]">@{s.slug}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="text-amber-400" />
                    <span className="text-amber-300 text-sm font-bold tabular-nums">{s.views24h}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Sem picos de trafego</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KPI Stat Card with trend ──────────────────────────────

function KpiStat({ label, value, delta, icon: Icon, color, subValue }: {
  label: string;
  value: number;
  delta?: number;
  icon: typeof Users;
  color: string;
  subValue?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {delta !== undefined && delta !== 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
            delta > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value.toLocaleString('pt-BR')}</p>
      <p className="text-white/40 text-[10px] mt-0.5">{label}</p>
      {subValue && <p className="text-white/25 text-[9px] mt-0.5">{subValue}</p>}
    </motion.div>
  );
}
