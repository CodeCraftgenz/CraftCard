import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, CreditCard, Building2, ArrowLeft,
  Search, Trash2, Crown, Shield,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import {
  useAdminDashboard,
  useAdminUsers,
  useAdminPayments,
  useAdminOrgs,
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

function DashboardTab() {
  const { data: stats } = useAdminDashboard();

  if (!stats) return <div className="text-white/50 text-center py-12">Carregando...</div>;

  const maxPlanCount = Math.max(...Object.values(stats.usersByPlan), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Usuarios" value={stats.totalUsers} />
        <StatCard label="Total Perfis" value={stats.totalProfiles} />
        <StatCard label="Total Organizacoes" value={stats.totalOrgs} />
        <StatCard label="Receita Total" value={`R$ ${stats.revenue.total.toFixed(2)}`} />
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

      {/* Revenue last 30 days */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-2">Receita ultimos 30 dias</h3>
        <p className="text-2xl font-bold text-brand-cyan">R$ {stats.revenue.last30Days.toFixed(2)}</p>
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

  const { data: users } = useAdminUsers(search, planFilter, roleFilter);
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos planos</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos roles</option>
          <option value="USER">USER</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </div>

      {/* User count */}
      <p className="text-white/40 text-xs">{users?.length ?? 0} usuarios</p>

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
    </div>
  );
}

// --- Payments Tab ---

function PaymentsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data: payments } = useAdminPayments(statusFilter, planFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
        >
          <option value="">Todos planos</option>
          <option value="PRO">PRO</option>
          <option value="BUSINESS">BUSINESS</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
        </select>
      </div>

      <p className="text-white/40 text-xs">{payments?.length ?? 0} pagamentos</p>

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
    </div>
  );
}

// --- Organizations Tab ---

function OrganizationsTab() {
  const [search, setSearch] = useState('');
  const { data: orgs } = useAdminOrgs(search);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou slug..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
        />
      </div>

      <p className="text-white/40 text-xs">{orgs?.length ?? 0} organizacoes</p>

      <div className="bg-white/5 rounded-2xl border border-white/10 divide-y divide-white/5">
        {orgs?.map((org) => (
          <div key={org.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-brand-cyan" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium">{org.name}</span>
              <p className="text-white/40 text-xs">/{org.slug}</p>
            </div>

            <span className="text-white/50 text-xs">{org._count.members} membros</span>
            <span className="text-white/50 text-xs">{org._count.profiles} perfis</span>
            <span className="text-white/30 text-xs hidden md:block">{new Date(org.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        ))}

        {orgs?.length === 0 && (
          <div className="py-8 text-center text-white/30 text-sm">Nenhuma organizacao encontrada</div>
        )}
      </div>
    </div>
  );
}

// --- Shared ---

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-4 border border-white/10"
    >
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
      <p className="text-white/50 text-xs mt-1">{label}</p>
    </motion.div>
  );
}
