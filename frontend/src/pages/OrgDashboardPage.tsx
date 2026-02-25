import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Mail, Settings, Plus, Trash2, Copy, Check,
  UserPlus, Shield, Crown, Download, Eye, MessageSquare, Calendar, ArrowLeft, Loader2, AlertTriangle,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import {
  useOrganization,
  useOrgMembers,
  useOrgInvites,
  useOrgAnalytics,
  useOrgLeads,
  useUpdateOrganization,
  useDeleteOrganization,
  useBulkApplyBranding,
  useInviteMember,
  useRevokeInvite,
  useRemoveMember,
} from '@/hooks/useOrganization';
import { AVAILABLE_FONTS } from '@/lib/google-fonts';
import { API_URL } from '@/lib/constants';

type Tab = 'overview' | 'members' | 'branding' | 'analytics' | 'leads';

export function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: org } = useOrganization(orgId);

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
        {tab === 'overview' && <OverviewTab orgId={orgId!} />}
        {tab === 'members' && <MembersTab orgId={orgId!} />}
        {tab === 'branding' && <BrandingTab orgId={orgId!} org={org} />}
        {tab === 'analytics' && <AnalyticsTab orgId={orgId!} />}
        {tab === 'leads' && <LeadsTab orgId={orgId!} />}
      </div>
    </div>
  );
}

// --- Overview Tab ---
function OverviewTab({ orgId }: { orgId: string }) {
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

      {/* Danger zone — Delete organization */}
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
function MembersTab({ orgId }: { orgId: string }) {
  const { data: members } = useOrgMembers(orgId);
  const { data: invites } = useOrgInvites(orgId);
  const inviteMember = useInviteMember(orgId);
  const revokeInvite = useRevokeInvite(orgId);
  const removeMember = useRemoveMember(orgId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ emailSent: boolean; token: string } | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const result = await inviteMember.mutateAsync({ email: inviteEmail.trim() });
    const res = result as { token?: string; emailSent?: boolean };
    if (res.token && !res.emailSent) {
      setInviteResult({ emailSent: false, token: res.token });
    } else {
      setInviteResult(res.emailSent ? { emailSent: true, token: res.token || '' } : null);
    }
    setInviteEmail('');
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

      {/* Members list */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Membros ({members?.length || 0})</h3>
        <div className="space-y-3">
          {members?.map((m) => {
            const RoleIcon = roleIcons[m.role] || Users;
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
                <span className="flex items-center gap-1 text-xs text-white/50 bg-white/5 px-2 py-1 rounded-lg">
                  <RoleIcon size={12} />
                  {m.role}
                </span>
                {m.role !== 'OWNER' && (
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
                  <p className="text-white/30 text-xs">Expira em {new Date(inv.expiresAt).toLocaleDateString()}</p>
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

// --- Analytics Tab ---
function AnalyticsTab({ orgId }: { orgId: string }) {
  const { data: analytics } = useOrgAnalytics(orgId);

  if (!analytics) return <div className="text-white/50 text-center py-8">Carregando...</div>;

  const maxViews = Math.max(...(analytics.dailyViews.map((v) => v.count) || [1]), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Eye} label="Total Views" value={analytics.totalViews} />
        <StatCard icon={MessageSquare} label="Mensagens" value={analytics.totalMessages} />
        <StatCard icon={Calendar} label="Agendamentos" value={analytics.totalBookings} />
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
        </div>
      )}

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
  const { data: leads } = useOrgLeads(orgId);

  const handleExport = () => {
    window.open(`${API_URL}/organizations/${orgId}/leads/export`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Leads da Equipe ({leads?.length || 0})</h3>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/70 rounded-lg text-xs hover:bg-white/10 transition-colors"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {leads && leads.length > 0 ? (
        <div className="space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="text-white text-sm font-medium">{lead.senderName}</span>
                  {lead.senderEmail && <span className="text-white/40 text-xs ml-2">{lead.senderEmail}</span>}
                </div>
                <span className="text-white/30 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-white/60 text-sm line-clamp-2">{lead.message}</p>
              <span className="text-brand-cyan/50 text-xs mt-1 inline-block">via {lead.profile.displayName}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/30">Nenhum lead recebido ainda</div>
      )}
    </div>
  );
}
