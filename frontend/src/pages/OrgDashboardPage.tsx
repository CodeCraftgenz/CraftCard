import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Mail, Settings, Plus, Trash2, Copy, Check,
  UserPlus, Shield, Crown, Download, Eye, MessageSquare, Calendar, ArrowLeft, Loader2, AlertTriangle,
  ExternalLink, Globe, Search, ChevronLeft, ChevronRight, CheckCheck, MailOpen,
  MousePointerClick, Smartphone, Monitor, Tablet, Link2,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { FeatureLock } from '@/components/organisms/FeatureLock';
import { useAuth } from '@/providers/AuthProvider';
import {
  useOrganization,
  useOrgMembers,
  useOrgInvites,
  useOrgAnalytics,
  useOrgLeads,
  useMarkLeadRead,
  useMarkAllLeadsRead,
  useUpdateOrganization,
  useDeleteOrganization,
  useBulkApplyBranding,
  useInviteMember,
  useRevokeInvite,
  useRemoveMember,
  useUpdateMemberRole,
  type Organization,
} from '@/hooks/useOrganization';
import { AVAILABLE_FONTS } from '@/lib/google-fonts';
import { API_URL } from '@/lib/constants';

type Tab = 'overview' | 'members' | 'branding' | 'domain' | 'analytics' | 'leads';

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [tab, setTab] = useState<Tab>('overview');
  const { organizations } = useAuth();

  const { data: org } = useOrganization(orgId);
  const myRole = organizations.find((o) => o.id === orgId)?.role || 'MEMBER';

  if (!org) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Header />
        <div className="flex items-center justify-center h-[60vh] pt-20">
          <div className="animate-pulse text-white/50">Carregando...</div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'overview', label: 'Visao Geral', icon: BarChart3 },
    { key: 'members', label: 'Membros', icon: Users },
    { key: 'branding', label: 'Branding', icon: Settings },
    { key: 'domain', label: 'Dominio', icon: Globe },
    { key: 'analytics', label: 'Analytics', icon: Eye },
    { key: 'leads', label: 'Leads', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        {/* Back to editor */}
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Voltar ao Editor
        </Link>

        {/* Org header */}
        <div className="flex items-center gap-4 mb-8">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: org.primaryColor }}>
              {org.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white/50 text-sm">{org.memberCount}/{org.maxMembers} membros</span>
              <div className="flex-1 max-w-[120px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((org.memberCount / org.maxMembers) * 100, 100)}%`,
                    background: org.memberCount >= org.maxMembers ? '#ef4444' : 'linear-gradient(90deg, #00E4F2, #8B5CF6)',
                  }}
                />
              </div>
              <span className="text-white/30 text-xs">·</span>
              <span className="text-white/50 text-sm">{org.profileCount} cartoes</span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
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

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab orgId={orgId!} myRole={myRole} />}
        {tab === 'members' && <MembersTab orgId={orgId!} myRole={myRole} org={org} />}
        {tab === 'branding' && <BrandingTab orgId={orgId!} org={org} />}
        {tab === 'domain' && <DomainTab orgId={orgId!} org={org} />}
        {tab === 'analytics' && <AnalyticsTab orgId={orgId!} />}
        {tab === 'leads' && <LeadsTab orgId={orgId!} />}
      </div>
    </div>
  );
}

// --- Overview Tab ---
function OverviewTab({ orgId, myRole }: { orgId: string; myRole: string }) {
  const navigate = useNavigate();
  const { data: analytics } = useOrgAnalytics(orgId);
  const deleteOrg = useDeleteOrganization();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    deleteOrg.mutate(orgId, {
      onSuccess: () => navigate('/editor'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Visualizacoes" value={analytics?.totalViews ?? 0} />
        <StatCard icon={MessageSquare} label="Mensagens" value={analytics?.totalMessages ?? 0} />
        <StatCard icon={Calendar} label="Agendamentos" value={analytics?.totalBookings ?? 0} />
        <StatCard icon={Users} label="Cartoes" value={analytics?.memberProfiles?.length ?? 0} />
      </div>

      {analytics?.memberProfiles && analytics.memberProfiles.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Cartoes da Equipe</h3>
          <div className="space-y-3">
            {analytics.memberProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-white text-sm font-medium">{p.displayName}</span>
                  <span className="text-white/40 text-xs ml-2">/{p.slug}</span>
                </div>
                <span className="text-brand-cyan text-sm">{p.viewCount} views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone — Delete organization (OWNER only) */}
      {myRole === 'OWNER' && (
        <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20">
          <h3 className="text-red-400 font-semibold text-sm flex items-center gap-2 mb-2">
            <AlertTriangle size={16} />
            Zona de Perigo
          </h3>
          <p className="text-white/40 text-xs mb-4">
            Excluir a organizacao remove todos os membros, convites e desvincula os cartoes. Esta acao nao pode ser desfeita.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              Excluir Organizacao
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-white/60 text-xs">
                Digite <strong className="text-red-400">excluir</strong> para confirmar:
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="excluir"
                className="w-full bg-white/5 border border-red-500/20 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'excluir' || deleteOrg.isPending}
                  className="flex-1 py-2.5 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {deleteOrg.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmar Exclusao'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                  className="px-4 py-2.5 bg-white/5 text-white/50 rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-4 border border-white/10"
    >
      <Icon size={20} className="text-brand-cyan mb-2" />
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </motion.div>
  );
}

// --- Members Tab ---
function MembersTab({ orgId, myRole, org }: { orgId: string; myRole: string; org: Organization }) {
  const { data: members } = useOrgMembers(orgId);
  const { data: invites } = useOrgInvites(orgId);
  const inviteMember = useInviteMember(orgId);
  const revokeInvite = useRevokeInvite(orgId);
  const removeMember = useRemoveMember(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ emailSent: boolean; token: string } | null>(null);
  const [seatLimitReached, setSeatLimitReached] = useState(false);

  const totalSeats = org.maxMembers + (org.extraSeats || 0);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSeatLimitReached(false);
    try {
      const result = await inviteMember.mutateAsync({ email: inviteEmail.trim(), role: inviteRole });
      const res = result as { token?: string; emailSent?: boolean };
      if (res.token && !res.emailSent) {
        setInviteResult({ emailSent: false, token: res.token });
      } else {
        setInviteResult(res.emailSent ? { emailSent: true, token: res.token || '' } : null);
      }
      setInviteEmail('');
    } catch (err: unknown) {
      const apiErr = err as Error & { details?: { code?: string } };
      if (apiErr?.details?.code === 'SEAT_LIMIT_REACHED') {
        setSeatLimitReached(true);
      }
    }
  };

  const isOwner = myRole === 'OWNER';
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyCardLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const roleIcons: Record<string, typeof Crown> = { OWNER: Crown, ADMIN: Shield, MEMBER: Users };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <UserPlus size={18} />
          Convidar Membro
        </h3>
        <div className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@empresa.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')}
            aria-label="Cargo do convidado"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-cyan/50 appearance-none cursor-pointer"
          >
            <option value="MEMBER">Membro</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviteMember.isPending}
            aria-label="Convidar membro"
            className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-xl text-sm font-medium hover:bg-brand-cyan/30 transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
        {/* Invite result feedback */}
        {inviteResult && !inviteResult.emailSent && (
          <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm font-medium mb-2">
              Convite criado, mas o email nao foi enviado.
            </p>
            <p className="text-white/50 text-xs mb-3">
              Compartilhe o link abaixo manualmente com o convidado:
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                aria-label="Link do convite"
                title="Link do convite"
                value={`${window.location.origin}/org/join/${inviteResult.token}`}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/org/join/${inviteResult.token}`);
                  setCopiedToken(inviteResult.token);
                  setTimeout(() => setCopiedToken(null), 2000);
                }}
                className="px-3 py-2 bg-brand-cyan/20 text-brand-cyan rounded-lg text-xs font-medium hover:bg-brand-cyan/30 transition-colors"
              >
                {copiedToken === inviteResult.token ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
        {inviteResult?.emailSent && (
          <p className="mt-3 text-green-400 text-sm">
            Convite enviado por email com sucesso!
          </p>
        )}
      </div>

      {/* Seat limit upsell */}
      {seatLimitReached && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 font-medium text-sm">Limite de assentos atingido</p>
              <p className="text-white/50 text-xs mt-1">
                Sua organizacao utiliza {org.memberCount}/{totalSeats} assentos.
                Entre em contato com o administrador para adquirir assentos extras.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Membros ({members?.length || 0})</h3>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Users size={14} />
            <span>{org.memberCount}/{totalSeats} assentos</span>
            {(org.extraSeats || 0) > 0 && <span className="text-brand-cyan">({org.extraSeats} extras)</span>}
          </div>
        </div>
        <div className="space-y-3">
          {members?.map((m) => {
            const RoleIcon = roleIcons[m.role] || Users;
            const canChangeRole = isOwner && m.role !== 'OWNER';
            return (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                {m.user.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan text-xs font-bold">
                    {m.user.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.user.name}</p>
                  <p className="text-white/40 text-xs truncate">{m.user.email}</p>
                </div>
                {m.user.profileSlug ? (
                  <button
                    type="button"
                    onClick={() => copyCardLink(m.user.profileSlug!)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:text-brand-cyan hover:border-brand-cyan/30 transition-colors shrink-0"
                    title={`${window.location.origin}/${m.user.profileSlug}`}
                  >
                    {copiedSlug === m.user.profileSlug ? (
                      <><Check size={12} className="text-green-400" /> Copiado</>
                    ) : (
                      <><ExternalLink size={12} /> /{m.user.profileSlug}</>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-white/20 shrink-0">Sem cartao</span>
                )}
                {canChangeRole ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value })}
                    aria-label={`Cargo de ${m.user.name}`}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 focus:outline-none focus:border-brand-cyan/50 appearance-none cursor-pointer"
                  >
                    <option value="MEMBER">Membro</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                    <RoleIcon size={12} />
                    {m.role}
                  </span>
                )}
                {m.role !== 'OWNER' && canManageMembers && (
                  <button
                    onClick={() => removeMember.mutate(m.id)}
                    aria-label="Remover membro"
                    className="text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending invites */}
      {invites && invites.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Convites Pendentes</h3>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <Mail size={16} className="text-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{inv.email}</p>
                  <p className="text-white/30 text-xs">
                    {inv.role === 'ADMIN' ? 'Admin' : 'Membro'} · Expira em {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/org/join/${inv.token}`);
                    setCopiedToken(inv.token);
                    setTimeout(() => setCopiedToken(null), 2000);
                  }}
                  className="text-white/30 hover:text-brand-cyan transition-colors"
                >
                  {copiedToken === inv.token ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => revokeInvite.mutate(inv.id)}
                  aria-label="Revogar convite"
                  className="text-red-400/50 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Branding Tab ---

const THEMES = ['default', 'gradient', 'minimal', 'bold', 'ocean', 'sunset', 'forest', 'neon', 'elegant', 'cosmic'] as const;
const THEME_COLORS: Record<string, string> = {
  default: '#1a1a2e', gradient: '#667eea', minimal: '#f5f5f5', bold: '#ef4444',
  ocean: '#0ea5e9', sunset: '#f97316', forest: '#22c55e', neon: '#a855f7',
  elegant: '#c9a84c', cosmic: '#6366f1',
};
const LINK_STYLES = ['rounded', 'pill', 'square', 'outline', 'ghost'] as const;
const LINK_ANIMATIONS = ['none', 'scale', 'slide', 'glow'] as const;

interface BrandingOrg {
  primaryColor: string; secondaryColor: string; fontFamily: string; brandingActive: boolean;
  cardTheme: string | null; linkStyle: string | null; linkAnimation: string | null;
  backgroundType: string | null; backgroundGradient: string | null;
}

function BrandingTab({ orgId, org }: { orgId: string; org: BrandingOrg }) {
  const updateOrg = useUpdateOrganization(orgId);
  const bulkApply = useBulkApplyBranding(orgId);

  const [primary, setPrimary] = useState(org.primaryColor);
  const [secondary, setSecondary] = useState(org.secondaryColor);
  const [font, setFont] = useState(org.fontFamily);
  const [active, setActive] = useState(org.brandingActive);
  const [theme, setTheme] = useState(org.cardTheme || 'default');
  const [linkStyle, setLinkStyle] = useState(org.linkStyle || 'rounded');
  const [linkAnim, setLinkAnim] = useState(org.linkAnimation || 'none');
  const [bgType, setBgType] = useState(org.backgroundType || 'theme');
  const [bgGradient, setBgGradient] = useState(org.backgroundGradient || '');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const save = () => {
    updateOrg.mutate({
      primaryColor: primary, secondaryColor: secondary, fontFamily: font, brandingActive: active,
      cardTheme: theme, linkStyle, linkAnimation: linkAnim,
      backgroundType: bgType, backgroundGradient: bgGradient || null,
    });
  };

  const handleBulkApply = () => {
    bulkApply.mutate(undefined, { onSuccess: () => setShowBulkConfirm(false) });
  };

  return (
    <div className="space-y-6">
      {/* Toggle branding */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded bg-white/10 border-white/20 text-brand-cyan focus:ring-brand-cyan"
          />
          <div>
            <span className="text-white text-sm font-medium">Ativar branding corporativo</span>
            <p className="text-white/40 text-xs mt-0.5">Quando ativo, membros nao podem alterar o visual dos cartoes</p>
          </div>
        </label>
      </div>

      {/* Colors */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <h3 className="text-white font-semibold text-sm">Cores</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-xs block mb-1">Cor Primaria</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} aria-label="Cor primaria" className="w-8 h-8 rounded cursor-pointer" />
              <input value={primary} onChange={(e) => setPrimary(e.target.value)} aria-label="Hex cor primaria" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24" />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1">Cor Secundaria</label>
            <div className="flex items-center gap-2">
              <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} aria-label="Cor secundaria" className="w-8 h-8 rounded cursor-pointer" />
              <input value={secondary} onChange={(e) => setSecondary(e.target.value)} aria-label="Hex cor secundaria" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual settings */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-5">
        <h3 className="text-white font-semibold text-sm">Visual</h3>

        {/* Font */}
        <div>
          <label className="text-white/60 text-xs block mb-1">Fonte</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            aria-label="Fonte da organizacao"
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-brand-cyan/50"
          >
            {AVAILABLE_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Card Theme */}
        <div>
          <label className="text-white/60 text-xs block mb-2">Tema do Cartao</label>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  theme === t ? 'border-brand-cyan bg-brand-cyan/10' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-full h-6 rounded-lg" style={{ backgroundColor: THEME_COLORS[t] }} />
                <span className="text-[10px] text-white/50 capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Link Style */}
        <div>
          <label className="text-white/60 text-xs block mb-2">Estilo de Link</label>
          <div className="flex gap-2">
            {LINK_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setLinkStyle(s)}
                className={`flex-1 py-2 text-xs font-medium transition-all ${
                  linkStyle === s
                    ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70'
                } border rounded-xl capitalize`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Link Animation */}
        <div>
          <label className="text-white/60 text-xs block mb-2">Animacao de Link</label>
          <div className="flex gap-2">
            {LINK_ANIMATIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setLinkAnim(a)}
                className={`flex-1 py-2 text-xs font-medium transition-all ${
                  linkAnim === a
                    ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan'
                    : 'bg-white/5 text-white/50 border-white/10 hover:text-white/70'
                } border rounded-xl capitalize`}
              >
                {a === 'none' ? 'Nenhuma' : a}
              </button>
            ))}
          </div>
        </div>

        {/* Background Type */}
        <div>
          <label className="text-white/60 text-xs block mb-2">Tipo de Fundo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBgType('theme')}
              className={`flex-1 py-2 text-xs font-medium transition-all border rounded-xl ${
                bgType === 'theme' ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan' : 'bg-white/5 text-white/50 border-white/10'
              }`}
            >
              Tema
            </button>
            <button
              type="button"
              onClick={() => setBgType('gradient')}
              className={`flex-1 py-2 text-xs font-medium transition-all border rounded-xl ${
                bgType === 'gradient' ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan' : 'bg-white/5 text-white/50 border-white/10'
              }`}
            >
              Gradiente
            </button>
          </div>
          {bgType === 'gradient' && (
            <input
              value={bgGradient}
              onChange={(e) => setBgGradient(e.target.value)}
              placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50"
            />
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <p className="text-white/40 text-xs mb-3">Preview</p>
        <div
          className="rounded-xl p-4 border border-white/10"
          style={{
            fontFamily: font,
            background: bgType === 'gradient' && bgGradient ? bgGradient : THEME_COLORS[theme] || '#1a1a2e',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full" style={{ backgroundColor: primary }} />
            <div>
              <p className="text-white text-sm font-semibold">Nome do Membro</p>
              <p className="text-white/50 text-xs">Cargo na empresa</p>
            </div>
          </div>
          <div className="space-y-2">
            <div
              className={`px-4 py-2 text-center text-xs text-white ${
                linkStyle === 'pill' ? 'rounded-full' :
                linkStyle === 'square' ? 'rounded-none' :
                linkStyle === 'outline' ? 'rounded-xl bg-transparent border border-current' :
                linkStyle === 'ghost' ? 'rounded-xl bg-transparent' :
                'rounded-xl'
              }`}
              style={{
                backgroundColor: linkStyle !== 'outline' && linkStyle !== 'ghost' ? primary : undefined,
                borderColor: linkStyle === 'outline' ? primary : undefined,
                color: linkStyle === 'outline' || linkStyle === 'ghost' ? primary : undefined,
              }}
            >
              Link de exemplo
            </div>
            <div
              className={`px-4 py-2 text-center text-xs ${
                linkStyle === 'pill' ? 'rounded-full' :
                linkStyle === 'square' ? 'rounded-none' :
                linkStyle === 'outline' ? 'rounded-xl border border-white/20 bg-transparent text-white/70' :
                linkStyle === 'ghost' ? 'rounded-xl bg-transparent text-white/70' :
                'rounded-xl'
              }`}
              style={{
                backgroundColor: linkStyle !== 'outline' && linkStyle !== 'ghost' ? `${secondary}40` : undefined,
                color: linkStyle !== 'outline' && linkStyle !== 'ghost' ? 'white' : undefined,
              }}
            >
              Outro link
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
        <button
          onClick={save}
          disabled={updateOrg.isPending}
          className="w-full py-2.5 bg-brand-cyan text-brand-dark rounded-xl text-sm font-semibold hover:bg-brand-cyan/90 transition-colors disabled:opacity-50"
        >
          {updateOrg.isPending ? 'Salvando...' : 'Salvar Branding'}
        </button>

        <div className="border-t border-white/5 pt-4">
          <p className="text-white/40 text-xs mb-3">
            Aplica as configuracoes visuais acima em todos os cartoes linkados a organizacao.
          </p>
          {!showBulkConfirm ? (
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="w-full py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Aplicar em todos os cartoes
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleBulkApply}
                disabled={bulkApply.isPending}
                className="flex-1 py-2.5 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {bulkApply.isPending ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-4 py-2.5 bg-white/5 text-white/50 rounded-xl text-sm hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
          {bulkApply.isSuccess && (
            <p className="text-green-400 text-xs mt-2">
              Branding aplicado em {(bulkApply.data as { count: number })?.count || 0} cartoes!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Domain Tab ---
function DomainTab({ orgId, org }: { orgId: string; org: { domain: string | null } }) {
  const { hasFeature } = useAuth();
  const updateOrg = useUpdateOrganization(orgId);
  const [domain, setDomain] = useState(org.domain || '');
  const [saved, setSaved] = useState(false);

  if (!hasFeature('customDomain')) {
    return (
      <div className="max-w-lg mx-auto">
        <FeatureLock feature="customDomain">
          <div />
        </FeatureLock>
      </div>
    );
  }

  const handleSave = () => {
    updateOrg.mutate({ domain: domain.trim() || null }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Domain input */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
          <Globe size={18} className="text-brand-cyan" />
          Dominio Customizado
        </h3>
        <p className="text-white/40 text-xs mb-4">
          Use o endereco da sua empresa para seus cartoes digitais (ex: cartoes.suaempresa.com.br)
        </p>
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="cartoes.suaempresa.com.br"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={updateOrg.isPending}
            className="px-5 py-2.5 bg-brand-cyan/20 text-brand-cyan rounded-xl text-sm font-medium hover:bg-brand-cyan/30 transition-colors disabled:opacity-50"
          >
            {updateOrg.isPending ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* DNS instructions */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-1">Configuracao DNS</h3>
        <p className="text-white/40 text-xs mb-4">
          Para apontar o dominio da sua empresa para a nossa plataforma, adicione o registro abaixo no painel DNS do seu provedor:
        </p>

        <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-white/30 mb-1">Tipo</p>
              <p className="text-brand-cyan font-mono font-semibold">CNAME</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">Nome / Host</p>
              <p className="text-white font-mono">{domain || 'cartoes'}</p>
            </div>
            <div>
              <p className="text-white/30 mb-1">Valor / Aponta para</p>
              <p className="text-white font-mono">craftcardgenz.com</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            Acesse o painel de DNS do seu provedor (Hostinger, GoDaddy, Cloudflare, etc.)
          </p>
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            Adicione um registro CNAME com os valores acima
          </p>
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            Aguarde ate 24h para a propagacao DNS completar
          </p>
          <p className="text-white/50 text-xs flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-cyan/10 text-brand-cyan flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
            Os cartoes da equipe ficarao acessiveis em {domain ? `https://${domain}/slug` : 'https://seudominio.com/slug'}
          </p>
        </div>
      </div>

      {/* Status */}
      {org.domain && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-3 text-sm">Status</h3>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
            <div>
              <p className="text-white text-sm font-medium">{org.domain}</p>
              <p className="text-white/40 text-xs">Aguardando verificacao de DNS</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Analytics Tab ---

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function MiniBarChart({ data, color, label }: {
  data: { date: string; count: number }[];
  color: string;
  label: string;
}) {
  if (!data || data.length === 0) return <p className="text-white/30 text-sm text-center py-4">Sem dados</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d) => (
          <div
            key={d.date}
            className={`flex-1 ${color} rounded-t hover:opacity-80 transition-opacity`}
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '2px' : '0' }}
            title={`${d.date}: ${d.count} ${label}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-white/30">{data[0]?.date.slice(5)}</span>
        <span className="text-[10px] text-white/30">{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function AnalyticsTab({ orgId }: { orgId: string }) {
  const { data: analytics } = useOrgAnalytics(orgId);

  if (!analytics) return <div className="text-white/50 text-center py-8">Carregando...</div>;

  const maxViews = Math.max(...(analytics.dailyViews.map((v) => v.count) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <StatCard icon={Eye} label="Total Views" value={analytics.totalViews} />
        <StatCard icon={MessageSquare} label="Mensagens" value={analytics.totalMessages} />
        <StatCard icon={Calendar} label="Agendamentos" value={analytics.totalBookings} />
        <StatCard icon={MousePointerClick} label="Cliques em Links" value={analytics.totalLinkClicks} />
        <StatCard icon={Mail} label="Nao Lidas" value={analytics.unreadMessages} />
      </div>

      {/* Daily views chart */}
      {analytics.dailyViews.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Visualizacoes (ultimos 30 dias)</h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.dailyViews.map((v) => (
              <div
                key={v.date}
                className="flex-1 bg-brand-cyan/40 rounded-t hover:bg-brand-cyan/60 transition-colors"
                style={{ height: `${(v.count / maxViews) * 100}%`, minHeight: '2px' }}
                title={`${v.date}: ${v.count} views`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">{analytics.dailyViews[0]?.date.slice(5)}</span>
            <span className="text-[10px] text-white/30">{analytics.dailyViews[analytics.dailyViews.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Messages + Bookings trends (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Mensagens (30 dias)</h3>
          <MiniBarChart data={analytics.dailyMessages} color="bg-yellow-500/50" label="mensagens" />
        </div>
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Agendamentos (30 dias)</h3>
          <MiniBarChart data={analytics.dailyBookings} color="bg-purple-500/50" label="agendamentos" />
        </div>
      </div>

      {/* Devices + Referrers (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Dispositivos</h3>
          {analytics.deviceDistribution && analytics.deviceDistribution.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxDevice = Math.max(...analytics.deviceDistribution.map((d) => d.count), 1);
                const totalDevices = analytics.deviceDistribution.reduce((sum, d) => sum + d.count, 0);
                return analytics.deviceDistribution.map((d) => {
                  const DeviceIcon = DEVICE_ICONS[d.device] || Monitor;
                  const pct = totalDevices > 0 ? Math.round((d.count / totalDevices) * 100) : 0;
                  return (
                    <div key={d.device} className="flex items-center gap-3">
                      <DeviceIcon size={16} className="text-white/50 shrink-0" />
                      <span className="text-white/70 text-sm w-16 capitalize">{d.device}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.count / maxDevice) * 100}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-brand-cyan/40 rounded-full flex items-center justify-end pr-1.5"
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
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sem dados de dispositivos</p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Principais Origens</h3>
          {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxRef = Math.max(...analytics.topReferrers.map((r) => r.count), 1);
                return analytics.topReferrers.map((r) => (
                  <div key={r.referrer} className="flex items-center gap-3">
                    <Globe size={14} className="text-white/40 shrink-0" />
                    <span className="text-white/70 text-sm flex-1 truncate">{r.referrer}</span>
                    <div className="w-24 bg-white/5 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(r.count / maxRef) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-indigo-500/50 rounded-full"
                      />
                    </div>
                    <span className="text-white/50 text-xs w-10 text-right">{r.count}</span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sem dados de origem</p>
          )}
        </div>
      </div>

      {/* Top Countries + Top Links (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Principais Paises</h3>
          {analytics.topCountries && analytics.topCountries.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxCountry = Math.max(...analytics.topCountries.map((c) => c.count), 1);
                return analytics.topCountries.map((c) => (
                  <div key={c.country} className="flex items-center gap-3">
                    <Globe size={14} className="text-white/40 shrink-0" />
                    <span className="text-white/70 text-sm flex-1">{c.country}</span>
                    <div className="w-24 bg-white/5 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.count / maxCountry) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-green-500/50 rounded-full"
                      />
                    </div>
                    <span className="text-white/50 text-xs w-10 text-right">{c.count}</span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sem dados de paises</p>
          )}
        </div>

        {/* Top Links */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-4">Links Mais Clicados</h3>
          {analytics.topLinks && analytics.topLinks.length > 0 ? (
            <div className="space-y-3">
              {analytics.topLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Link2 size={14} className="text-white/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{link.label}</p>
                    <p className="text-white/30 text-xs">{link.platform}</p>
                  </div>
                  <span className="text-brand-cyan text-sm font-semibold">{link.clicks.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sem cliques em links</p>
          )}
        </div>
      </div>

      {/* Per-card breakdown */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Por Cartao</h3>
        <div className="space-y-3">
          {analytics.memberProfiles
            .sort((a, b) => b.viewCount - a.viewCount)
            .map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm">{p.displayName}</span>
                </div>
                <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan/60 rounded-full"
                    style={{ width: `${(p.viewCount / (analytics.totalViews || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-white/50 text-xs w-16 text-right">{p.viewCount}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// --- Leads Tab ---
function LeadsTab({ orgId }: { orgId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search
  useState(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  });

  const isReadParam = filter === 'all' ? undefined : filter === 'read' ? 'true' : 'false';
  const { data } = useOrgLeads(orgId, { page, search: debouncedSearch || undefined, isRead: isReadParam });
  const markRead = useMarkLeadRead(orgId);
  const markAllRead = useMarkAllLeadsRead(orgId);

  const handleExport = () => {
    window.open(`${API_URL}/organizations/${orgId}/leads/export`, '_blank');
  };

  const resetPage = () => setPage(1);

  const unreadCount = data?.items.filter((l) => !l.isRead).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-white font-semibold">
          Leads da Equipe ({data?.total ?? 0})
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
              {unreadCount} {unreadCount === 1 ? 'novo' : 'novos'}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 transition-colors"
            >
              <CheckCheck size={14} />
              Marcar todos lidos
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 transition-colors"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setDebouncedSearch(e.target.value); resetPage(); }}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/30"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); resetPage(); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/20'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'unread' ? 'Nao lidos' : 'Lidos'}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List */}
      {data && data.items.length > 0 ? (
        <div className="space-y-2">
          {data.items.map((lead) => {
            const isExpanded = expandedId === lead.id;
            return (
              <div
                key={lead.id}
                className={`rounded-xl p-4 border transition-all cursor-pointer ${
                  lead.isRead
                    ? 'bg-white/[0.03] border-white/[0.06]'
                    : 'bg-white/5 border-white/10'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : lead.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {!lead.isRead && <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                    <span className={`text-sm font-medium ${lead.isRead ? 'text-white/60' : 'text-white'}`}>
                      {lead.senderName}
                    </span>
                    {lead.senderEmail && <span className="text-white/30 text-xs hidden sm:inline">{lead.senderEmail}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead.mutate({ leadId: lead.id, isRead: !lead.isRead });
                      }}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title={lead.isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                    >
                      <MailOpen size={14} className={lead.isRead ? 'text-white/20' : 'text-brand-cyan'} />
                    </button>
                  </div>
                </div>
                <p className={`text-sm text-white/60 ${isExpanded ? '' : 'line-clamp-2'}`}>{lead.message}</p>
                {lead.senderEmail && isExpanded && (
                  <p className="text-xs text-white/40 mt-1 sm:hidden">{lead.senderEmail}</p>
                )}
                <span className="text-brand-cyan/50 text-xs mt-1 inline-block">via {lead.profile.displayName}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-white/30">
          {debouncedSearch || filter !== 'all' ? 'Nenhum lead encontrado com os filtros atuais' : 'Nenhum lead recebido ainda'}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Pagina anterior"
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} className="text-white/60" />
          </button>
          <span className="text-sm text-white/50">
            Pagina {data.page} de {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            aria-label="Proxima pagina"
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} className="text-white/60" />
          </button>
        </div>
      )}
    </div>
  );
}
