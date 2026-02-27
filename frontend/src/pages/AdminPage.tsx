import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, Building2, ArrowLeft,
  Search, Trash2, Crown, Shield, ChevronRight, Save, X,
  Eye, MessageSquare, TrendingUp, Clock, Smartphone, Monitor, Tablet,
  UserPlus, DollarSign, Mail,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Pagination } from '@/components/atoms/Pagination';
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminPayments,
  useAdminOrgs,
  useAdminOrgDetail,
  useUpdateAdminOrg,
  useUpdateAdminUser,
  useDeleteAdminUser,
  type AdminUser,
} from '@/hooks/useAdmin';

type Tab = 'dashboard' | 'users' | 'payments' | 'organizations';

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-white/10 text-white/60',
  PRO: 'bg-blue-500/20 text-blue-400',
  BUSINESS: 'bg-purple-500/20 text-purple-400',
  ENTERPRISE: 'bg-amber-500/20 text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/40',
  refunded: 'bg-orange-500/20 text-orange-400',
};

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'users', label: 'Usuarios', icon: Users },
    { key: 'payments', label: 'Pagamentos', icon: CreditCard },
    { key: 'organizations', label: 'Organizacoes', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao Editor
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} className="text-brand-cyan" />
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === key
                  ? 'bg-brand-cyan/20 text-brand-cyan'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'organizations' && <OrganizationsTab />}
      </div>
    </div>
  );
}

// --- Dashboard Tab ---

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const ACTIVITY_STYLES: Record<string, { icon: typeof UserPlus; color: string }> = {
  signup: { icon: UserPlus, color: 'text-green-400' },
  payment: { icon: DollarSign, color: 'text-blue-400' },
  message: { icon: Mail, color: 'text-yellow-400' },
};

function DashboardTab() {
  const { data: stats } = useAdminDashboard();

  if (!stats) return <div className="text-white/50 text-center py-12">Carregando...</div>;

  const maxPlanCount = Math.max(...Object.values(stats.usersByPlan), 1);

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Usuarios" value={stats.totalUsers} icon={Users} />
        <StatCard label="Total Perfis" value={stats.totalProfiles} />
        <StatCard label="Total Organizacoes" value={stats.totalOrgs} icon={Building2} />
        <StatCard label="Receita Total" value={`R$ ${stats.revenue.total.toFixed(2)}`} icon={CreditCard} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Views" value={stats.totalViews} icon={Eye} />
        <StatCard label="Total Mensagens" value={stats.totalMessages} icon={MessageSquare} />
        <StatCard label="Taxa de Conversao" value={`${stats.conversionRate}%`} icon={TrendingUp} />
        <StatCard label="Assinaturas Expirando" value={stats.expiringSubscriptions} icon={Clock} />
      </div>

      {/* Plan distribution */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Distribuicao por Plano</h3>
        <div className="space-y-3">
          {(['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const).map((plan) => (
            <div key={plan} className="flex items-center gap-3">
              <span className="text-white/70 text-sm w-24">{plan}</span>
              <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((stats.usersByPlan[plan] || 0) / maxPlanCount) * 100}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-brand-cyan/40 rounded-full flex items-center justify-end pr-2"
                >
                  <span className="text-xs text-white font-medium">{stats.usersByPlan[plan] || 0}</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue daily chart (30 days) */}
      {stats.revenueLast30Days && stats.revenueLast30Days.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Receita Diaria (30 dias)</h3>
            <span className="text-brand-cyan font-bold text-lg">R$ {stats.revenue.last30Days.toFixed(2)}</span>
          </div>
          <div className="flex items-end gap-1 h-32">
            {stats.revenueLast30Days.map((d) => {
              const max = Math.max(...stats.revenueLast30Days.map((x) => x.amount), 1);
              return (
                <div
                  key={d.date}
                  className="flex-1 bg-green-500/40 rounded-t hover:bg-green-500/60 transition-colors"
                  style={{ height: `${(d.amount / max) * 100}%`, minHeight: d.amount > 0 ? '4px' : '0' }}
                  title={`${d.date}: R$ ${d.amount.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">{stats.revenueLast30Days[0]?.date.slice(5)}</span>
            <span className="text-[10px] text-white/30">{stats.revenueLast30Days[stats.revenueLast30Days.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Top Profiles + Feature Adoption (2-col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Profiles */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Top 5 Perfis Mais Visitados</h3>
          {stats.topProfiles && stats.topProfiles.length > 0 ? (
            <div className="space-y-3">
              {stats.topProfiles.map((p, i) => (
                <div key={p.slug} className="flex items-center gap-3">
                  <span className="text-brand-cyan font-bold text-sm w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{p.displayName}</p>
                    <p className="text-white/40 text-xs truncate">/{p.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/60">
                    <Eye size={12} />
                    <span className="text-xs font-medium">{p.viewCount.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Nenhum perfil publicado</p>
          )}
        </div>

        {/* Feature Adoption */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Adocao de Recursos</h3>
          {stats.featureAdoption && (
            <div className="space-y-4">
              {([
                { key: 'published' as const, label: 'Perfis Publicados', color: 'bg-green-500/50' },
                { key: 'leadCapture' as const, label: 'Lead Capture Ativo', color: 'bg-blue-500/50' },
                { key: 'booking' as const, label: 'Agendamento Ativo', color: 'bg-purple-500/50' },
              ]).map(({ key, label, color }) => {
                const data = stats.featureAdoption[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/70 text-sm">{label}</span>
                      <span className="text-white/50 text-xs">{data.count} ({data.pct}%)</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.pct}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full ${color} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Device Distribution */}
      {stats.deviceDistribution && stats.deviceDistribution.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Distribuicao de Dispositivos</h3>
          <div className="space-y-3">
            {(() => {
              const maxDevice = Math.max(...stats.deviceDistribution.map((d) => d.count), 1);
              const totalDevices = stats.deviceDistribution.reduce((sum, d) => sum + d.count, 0);
              return stats.deviceDistribution.map((d) => {
                const DeviceIcon = DEVICE_ICONS[d.device] || Monitor;
                const pct = totalDevices > 0 ? Math.round((d.count / totalDevices) * 100) : 0;
                return (
                  <div key={d.device} className="flex items-center gap-3">
                    <DeviceIcon size={16} className="text-white/50 shrink-0" />
                    <span className="text-white/70 text-sm w-16 capitalize">{d.device}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / maxDevice) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-brand-cyan/40 rounded-full flex items-center justify-end pr-2"
                      >
                        <span className="text-[10px] text-white font-medium">{d.count}</span>
                      </motion.div>
                    </div>
                    <span className="text-white/40 text-xs w-10 text-right">{pct}%</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Recent Leads + Activity Feed (2-col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Unread Leads */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Leads Recentes (Nao Lidos)</h3>
          {stats.recentLeads && stats.recentLeads.length > 0 ? (
            <div className="space-y-3">
              {stats.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={14} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{lead.senderName}</p>
                    <p className="text-white/40 text-xs truncate">{lead.senderEmail || 'Sem email'}</p>
                    <p className="text-white/30 text-[10px] mt-0.5">→ {lead.profile.displayName}</p>
                  </div>
                  <span className="text-white/30 text-[10px] shrink-0">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Nenhum lead nao lido</p>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Atividade Recente</h3>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => {
                const style = ACTIVITY_STYLES[a.type] || ACTIVITY_STYLES.signup;
                const Icon = style.icon;
                return (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <div className={`w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={12} className={style.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-sm truncate">{a.label}</p>
                    </div>
                    <span className="text-white/30 text-[10px] shrink-0">
                      {new Date(a.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sem atividade recente</p>
          )}
        </div>
      </div>

      {/* New users chart */}
      {stats.newUsersLast30Days.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Novos Usuarios (30 dias)</h3>
          <div className="flex items-end gap-1 h-32">
            {stats.newUsersLast30Days.map((d) => {
              const max = Math.max(...stats.newUsersLast30Days.map((x) => x.count), 1);
              return (
                <div
                  key={d.date}
                  className="flex-1 bg-brand-cyan/40 rounded-t hover:bg-brand-cyan/60 transition-colors group relative"
                  style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                  title={`${d.date}: ${d.count}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">{stats.newUsersLast30Days[0]?.date.slice(5)}</span>
            <span className="text-[10px] text-white/30">{stats.newUsersLast30Days[stats.newUsersLast30Days.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Users Tab ---

function UsersTab() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data } = useAdminUsers(search, planFilter, roleFilter, page);
  const users = data?.items;
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const handlePlanChange = (user: AdminUser, newPlan: string) => {
    updateUser.mutate({ userId: user.id, data: { plan: newPlan } });
    setEditingUser(null);
  };

  const handleRoleToggle = (user: AdminUser) => {
    const newRole = user.role === 'SUPER_ADMIN' ? 'USER' : 'SUPER_ADMIN';
    if (newRole === 'SUPER_ADMIN' && !confirm(`Promover ${user.email} para SUPER_ADMIN?`)) return;
    updateUser.mutate({ userId: user.id, data: { role: newRole } });
  };

  const handleDelete = (user: AdminUser) => {
    if (!confirm(`Deletar usuario ${user.email}? Esta acao nao pode ser desfeita.`)) return;
    deleteUser.mutate(user.id);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
          />
        </div>
        <select
          aria-label="Filtrar por plano"
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos planos</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <select
          aria-label="Filtrar por role"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos roles</option>
          <option value="USER">USER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </div>

      {/* User count */}
      <p className="text-white/40 text-xs">{data?.total ?? 0} usuarios</p>

      {/* User list */}
      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
        {users?.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-4 py-3">
            {/* Avatar */}
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-white/50 text-xs font-medium">{(user.name || user.email)[0].toUpperCase()}</span>
              </div>
            )}

            {/* Name & email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium truncate">{user.name || '—'}</span>
                {user.role === 'SUPER_ADMIN' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-bold flex-shrink-0">
                    <Crown size={10} />
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>

            {/* Plan badge */}
            {editingUser === user.id ? (
              <select
                aria-label="Alterar plano do usuario"
                value={user.plan}
                onChange={(e) => handlePlanChange(user, e.target.value)}
                onBlur={() => setEditingUser(null)}
                autoFocus
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
              >
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
                <option value="BUSINESS">BUSINESS</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            ) : (
              <button
                onClick={() => setEditingUser(user.id)}
                className={`px-2 py-0.5 rounded-lg text-xs font-medium ${PLAN_COLORS[user.plan] || PLAN_COLORS.FREE}`}
                title="Clique para alterar plano"
              >
                {user.plan}
              </button>
            )}

            {/* Stats */}
            <span className="text-white/30 text-xs hidden md:block">{user._count.profiles}p · {user._count.orgMemberships}o</span>

            {/* Date */}
            <span className="text-white/30 text-xs hidden md:block">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>

            {/* Role toggle */}
            <button
              onClick={() => handleRoleToggle(user)}
              className={`p-1.5 rounded-lg transition-colors ${
                user.role === 'SUPER_ADMIN'
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-white/5 text-white/30 hover:text-white/50 hover:bg-white/10'
              }`}
              title={user.role === 'SUPER_ADMIN' ? 'Remover admin' : 'Tornar admin'}
            >
              <Shield size={14} />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(user)}
              className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Deletar usuario"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {users?.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhum usuario encontrado</div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

// --- Payments Tab ---

function PaymentsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data } = useAdminPayments(statusFilter, planFilter, page);
  const payments = data?.items;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          aria-label="Filtrar por status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos status</option>
          <option value="approved">Aprovado</option>
          <option value="pending">Pendente</option>
          <option value="rejected">Rejeitado</option>
          <option value="cancelled">Cancelado</option>
          <option value="refunded">Reembolsado</option>
        </select>
        <select
          aria-label="Filtrar por plano"
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos planos</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
      </div>

      <p className="text-white/40 text-xs">{data?.total ?? 0} pagamentos</p>

      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
        {payments?.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium">{p.user.name || p.user.email}</span>
              <p className="text-white/40 text-xs truncate">{p.user.email}</p>
            </div>

            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${PLAN_COLORS[p.plan || ''] || ''}`}>
              {p.plan || '—'}
            </span>

            <span className="text-white/70 text-sm font-mono">R$ {Number(p.amount).toFixed(2)}</span>

            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.pending}`}>
              {p.status}
            </span>

            <span className="text-white/30 text-xs hidden md:block">
              {p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-BR') : '—'}
            </span>

            <span className="text-white/30 text-xs hidden md:block">
              {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('pt-BR') : '—'}
            </span>
          </div>
        ))}

        {payments?.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhum pagamento encontrado</div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

// --- Organizations Tab ---

function OrganizationsTab() {
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data } = useAdminOrgs(search, page);
  const orgs = data?.items;

  if (selectedOrgId) {
    return <OrgDetailPanel orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome ou slug..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
        />
      </div>

      <p className="text-white/40 text-xs">{data?.total ?? 0} organizacoes</p>

      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
        {orgs?.map((org) => (
          <button
            key={org.id}
            onClick={() => setSelectedOrgId(org.id)}
            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-brand-cyan" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium">{org.name}</span>
              <p className="text-white/40 text-xs">/{org.slug}</p>
            </div>

            <span className="text-white/50 text-xs">{org._count.members}/{org.maxMembers + org.extraSeats}</span>
            <span className="text-white/50 text-xs">{org._count.profiles} perfis</span>
            <span className="text-white/30 text-xs hidden md:block">{new Date(org.createdAt).toLocaleDateString('pt-BR')}</span>
            <ChevronRight size={16} className="text-white/20" />
          </button>
        ))}

        {orgs?.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhuma organizacao encontrada</div>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

function OrgDetailPanel({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const { data: org } = useAdminOrgDetail(orgId);
  const updateOrg = useUpdateAdminOrg();
  const [extraSeats, setExtraSeats] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const currentExtra = extraSeats ?? org?.extraSeats ?? 0;
  const totalSeats = (org?.maxMembers ?? 0) + currentExtra;
  const usedSeats = org?._count.members ?? 0;
  const usagePercent = totalSeats > 0 ? Math.min(100, Math.round((usedSeats / totalSeats) * 100)) : 0;

  const handleSave = async () => {
    if (!org || currentExtra === org.extraSeats) return;
    await updateOrg.mutateAsync({ orgId, data: { extraSeats: currentExtra } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!org) {
    return (
      <div className="py-12 text-center text-white/50 animate-pulse">Carregando...</div>
    );
  }

  const roleLabels: Record<string, string> = { OWNER: 'Dono', ADMIN: 'Admin', MEMBER: 'Membro' };

  return (
    <div className="space-y-4">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar a lista
      </button>

      {/* Org header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">{org.name}</h3>
            <p className="text-white/40 text-xs">/{org.slug} — Criada em {new Date(org.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar detalhe" className="text-white/30 hover:text-white/60 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Seats management */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <h4 className="text-white font-semibold">Gestao de Assentos</h4>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/50">{usedSeats} de {totalSeats} assentos utilizados</span>
            <span className="text-white/30">{usagePercent}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-400' : usagePercent >= 70 ? 'bg-amber-400' : 'bg-brand-cyan'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Base seats (read-only) */}
          <div>
            <label className="text-white/40 text-xs block mb-1">Assentos base (plano)</label>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white/60 text-sm">
              {org.maxMembers}
            </div>
          </div>

          {/* Extra seats (editable) */}
          <div>
            <label className="text-white/40 text-xs block mb-1">Assentos extras</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                aria-label="Assentos extras"
                value={currentExtra}
                onChange={(e) => setExtraSeats(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
              />
              <button
                onClick={handleSave}
                disabled={updateOrg.isPending || currentExtra === org.extraSeats}
                className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-xl text-sm font-medium hover:bg-brand-cyan/30 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Save size={14} />
                {saved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs">
          Total: {totalSeats} assentos ({org.maxMembers} base + {currentExtra} extras)
        </p>
      </div>

      {/* Members list */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h4 className="text-white font-semibold mb-4">Membros ({org._count.members})</h4>
        <div className="space-y-2">
          {org.members.map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-medium">
                {m.user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{m.user.name || 'Sem nome'}</p>
                <p className="text-white/40 text-xs truncate">{m.user.email}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                {roleLabels[m.role] || m.role}
              </span>
            </div>
          ))}
          {org.members.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">Nenhum membro</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Shared ---

function StatCard({ label, value, icon: Icon }: {
  label: string;
  value: number | string;
  icon?: typeof Users;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-brand-cyan shrink-0" />}
        <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
      </div>
      <p className="text-white/50 text-xs mt-1">{label}</p>
    </motion.div>
  );
}
