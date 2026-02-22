import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Copy, Check, ExternalLink, CreditCard, Upload, X, Plus,
  GripVertical, Camera, FileText, Palette, Link2, Sparkles, Eye,
  QrCode, BarChart3, Calendar, Download, MessageSquare, Mail, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { CardPreview } from '@/components/organisms/CardPreview';
import { useAuth } from '@/providers/AuthProvider';
import {
  useProfile,
  useUpdateProfile,
  useUploadPhoto,
  useUploadCover,
  useUploadResume,
  useCheckSlug,
} from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useContacts, useMarkAsRead } from '@/hooks/useContacts';
import { PRESET_BUTTON_COLORS, SOCIAL_PLATFORMS, resolvePhotoUrl } from '@/lib/constants';

const CARD_THEMES = [
  { value: 'default', label: 'Classico', preview: 'bg-gradient-to-b from-brand-cyan/10 to-transparent' },
  { value: 'gradient', label: 'Gradiente', preview: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' },
  { value: 'minimal', label: 'Minimalista', preview: 'bg-white/5' },
  { value: 'bold', label: 'Vibrante', preview: 'bg-gradient-to-br from-yellow-500/20 to-red-500/20' },
  { value: 'ocean', label: 'Oceano', preview: 'bg-gradient-to-br from-blue-500/20 to-teal-500/20' },
  { value: 'sunset', label: 'Por do Sol', preview: 'bg-gradient-to-br from-orange-500/20 to-pink-500/20' },
  { value: 'forest', label: 'Floresta', preview: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' },
  { value: 'neon', label: 'Neon', preview: 'bg-black border border-pink-500/40' },
  { value: 'elegant', label: 'Elegante', preview: 'bg-gradient-to-br from-yellow-600/15 to-amber-800/15' },
  { value: 'cosmic', label: 'Cosmico', preview: 'bg-gradient-to-br from-purple-600/20 to-blue-800/20' },
];

export function EditorPage() {
  const { hasPaid, paidUntil } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const uploadCover = useUploadCover();
  const uploadResume = useUploadResume();
  const { data: analytics } = useAnalytics(hasPaid);
  const { data: contacts } = useContacts(hasPaid);
  const markAsRead = useMarkAsRead();
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    buttonColor: '#00E4F2',
    slug: '',
    isPublished: false,
    cardTheme: 'default',
    availabilityStatus: '' as string,
    availabilityMessage: '',
    socialLinks: [] as Array<{ platform: string; label: string; url: string; order: number }>,
  });

  const [slugInput, setSlugInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(Date.now());
  const [coverVersion, setCoverVersion] = useState(Date.now());
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initializedRef = useRef(false);

  // Sync profile data to form only on initial load
  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        buttonColor: profile.buttonColor || '#00E4F2',
        slug: profile.slug || '',
        isPublished: profile.isPublished,
        cardTheme: profile.cardTheme || 'default',
        availabilityStatus: profile.availabilityStatus || '',
        availabilityMessage: profile.availabilityMessage || '',
        socialLinks: profile.socialLinks.map((l) => ({
          platform: l.platform,
          label: l.label,
          url: l.url,
          order: l.order,
        })),
      });
      setSlugInput(profile.slug || '');
    }
  }, [profile]);

  // Debounce slug check
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(slugInput), 500);
    return () => clearTimeout(timer);
  }, [slugInput]);

  const { data: slugCheck } = useCheckSlug(
    debouncedSlug,
    debouncedSlug !== profile?.slug && debouncedSlug.length >= 3,
  );

  // Build a clean payload - only include valid, non-empty fields
  const buildSavePayload = useCallback(() => {
    const data: Record<string, unknown> = {};

    // Only send displayName if >= 2 chars
    const trimmedName = form.displayName.trim();
    if (trimmedName.length >= 2) {
      data.displayName = trimmedName;
    }

    // Bio can be empty (nullable)
    if (form.bio.trim()) {
      data.bio = form.bio.trim();
    } else {
      data.bio = null;
    }

    data.buttonColor = form.buttonColor;
    data.isPublished = form.isPublished;
    data.cardTheme = form.cardTheme;
    data.availabilityStatus = form.availabilityStatus || null;
    data.availabilityMessage = form.availabilityMessage.trim() || null;

    // Only send slug if >= 3 chars
    if (slugInput.length >= 3) {
      data.slug = slugInput;
    }

    // Filter social links - only include complete ones with valid URL
    const validLinks = form.socialLinks.filter((l) => {
      const hasLabel = l.label.trim().length > 0;
      const hasUrl = l.url.trim().length > 0;
      const isValidUrl = /^https?:\/\/.+/i.test(l.url.trim());
      return hasLabel && hasUrl && isValidUrl;
    });
    data.socialLinks = validLinks.map((l, i) => ({
      platform: l.platform,
      label: l.label.trim(),
      url: l.url.trim(),
      order: i,
    }));

    return data;
  }, [form, slugInput]);

  const handleSave = useCallback(async () => {
    try {
      const data = buildSavePayload();
      await updateProfile.mutateAsync(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail on auto-save validation errors
    }
  }, [buildSavePayload, updateProfile]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1500);
  }, [handleSave]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    triggerAutoSave();
  };

  const [uploadError, setUploadError] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      await uploadPhoto.mutateAsync(file);
      setPhotoVersion(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar foto';
      setUploadError(msg);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      await uploadCover.mutateAsync(file);
      setCoverVersion(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar foto de capa';
      setUploadError(msg);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      await uploadResume.mutateAsync(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar curriculo';
      setUploadError(msg);
    }
  };

  const cardUrl = `${window.location.origin}/${profile?.slug || slugInput}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSocialLink = () => {
    updateField('socialLinks', [
      ...form.socialLinks,
      { platform: 'website', label: '', url: '', order: form.socialLinks.length },
    ]);
  };

  const addCustomLink = () => {
    updateField('socialLinks', [
      ...form.socialLinks,
      { platform: 'custom', label: '', url: '', order: form.socialLinks.length },
    ]);
  };

  const removeSocialLink = (index: number) => {
    updateField(
      'socialLinks',
      form.socialLinks.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })),
    );
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const links = [...form.socialLinks];
    links[index] = { ...links[index], [field]: value };
    if (field === 'platform') {
      const platform = SOCIAL_PLATFORMS.find((p) => p.value === value);
      if (platform && !links[index].label) {
        links[index].label = platform.label;
      }
    }
    updateField('socialLinks', links);
  };

  const handleCheckout = async () => {
    const data: { url: string } = await api.post('/payments/checkout');
    window.location.href = data.url;
  };

  const handleDownloadQr = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(cardUrl)}&bgcolor=1A1A2E&color=00E4F2`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qrcode-${profile?.slug || 'cartao'}.png`;
    link.click();
  };

  // Format expiration date
  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Helper: fill in missing days with count=0 for last 30 days
  const getLast30Days = (dailyViews: Array<{ date: string; count: number }>) => {
    const map = new Map(dailyViews.map((d) => [d.date, d.count]));
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, count: map.get(key) || 0 });
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white">
      <Header />

      {/* Subtle background glow */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-brand-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-brand-magenta/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles size={22} className="text-brand-cyan" />
            Editor do Cartao
          </h1>
          <p className="text-sm text-white/40 mt-1">Personalize seu cartao digital profissional</p>
        </motion.div>

        {/* Subscription status banner (when paid) */}
        <AnimatePresence>
          {hasPaid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 relative overflow-hidden rounded-2xl border border-green-500/20"
            >
              <div className="absolute inset-0 bg-green-500/5" />
              <div className="relative p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-400">Assinatura Ativa</h3>
                    {paidUntil && (
                      <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        Valida ate {formatExpiry(paidUntil)}
                      </p>
                    )}
                    {!paidUntil && (
                      <p className="text-xs text-white/40 mt-0.5">Acesso vitalicio</p>
                    )}
                  </div>
                </div>
                {profile?.viewCount !== undefined && profile.viewCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 px-4 py-2 rounded-xl">
                    <BarChart3 size={16} className="text-brand-cyan" />
                    <span><strong className="text-white">{profile.viewCount}</strong> visualizacoes</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment banner (when NOT paid) */}
        <AnimatePresence>
          {!hasPaid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 relative overflow-hidden rounded-2xl border border-brand-cyan/20"
            >
              <div className="absolute inset-0 gradient-bg opacity-10" />
              <div className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Desbloqueie seu cartao</h3>
                    <p className="text-sm text-white/50">
                      De <span className="line-through text-white/30">R$99,90</span> por apenas R$30/ano para publicar e compartilhar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl gradient-bg font-bold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:shadow-brand-cyan/20 shrink-0"
                >
                  Assinar R$ 30,00/ano (70% OFF)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Published card link (when published) */}
        <AnimatePresence>
          {profile?.isPublished && hasPaid && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 glass-card p-5"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0">
                    <ExternalLink size={18} className="text-brand-cyan" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/40 mb-1">Seu cartao esta no ar!</p>
                    <a
                      href={cardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline text-sm font-medium truncate block"
                    >
                      {cardUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 hover:border-white/20 transition-all"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <a
                    href={cardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-bg text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    <ExternalLink size={14} />
                    Acessar
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 hover:border-white/20 transition-all"
                    title="QR Code"
                  >
                    <QrCode size={14} />
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <AnimatePresence>
                {showQrCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-3"
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}&bgcolor=1A1A2E&color=00E4F2&format=svg`}
                      alt="QR Code do cartao"
                      className="w-40 h-40 rounded-xl"
                    />
                    <p className="text-xs text-white/40">Escaneie para acessar seu cartao</p>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="flex items-center gap-2 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                    >
                      <Download size={14} />
                      Baixar QR Code
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8">
          {/* Editor Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            {/* Photo Section */}
            <div className="glass-card p-6 group hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                  <Camera size={16} className="text-brand-cyan" />
                </div>
                <h3 className="font-semibold">Foto de Perfil</h3>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl bg-brand-bg-card flex items-center justify-center overflow-hidden border-2 border-white/10 transition-all hover:border-brand-cyan/30"
                    style={
                      resolvePhotoUrl(profile?.photoUrl)
                        ? { backgroundImage: `url(${resolvePhotoUrl(profile?.photoUrl)}?v=${photoVersion})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : undefined
                    }
                  >
                    {!profile?.photoUrl && (
                      <div className="flex flex-col items-center gap-1">
                        <Upload size={20} className="text-white/20" />
                        <span className="text-[10px] text-white/20">Foto</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-5 py-2.5 rounded-xl border border-white/10 text-sm cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all font-medium inline-flex items-center gap-2">
                    <Upload size={14} />
                    {uploadPhoto.isPending ? 'Enviando...' : 'Escolher foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  <p className="text-xs text-white/30">JPG, PNG ou WebP. Max 5MB</p>
                  {uploadError && (
                    <p className="text-xs text-red-400 mt-1">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Photo Section */}
            <div className="glass-card p-6 group hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Camera size={16} className="text-purple-400" />
                </div>
                <h3 className="font-semibold">Foto de Capa</h3>
              </div>
              <div className="space-y-3">
                {profile?.coverPhotoUrl && (
                  <div
                    className="w-full h-24 rounded-xl bg-brand-bg-card overflow-hidden border border-white/10"
                    style={{
                      backgroundImage: `url(${resolvePhotoUrl(profile.coverPhotoUrl)}?v=${coverVersion})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <label className="px-5 py-2.5 rounded-xl border border-white/10 text-sm cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all font-medium inline-flex items-center gap-2">
                    <Upload size={14} />
                    {uploadCover.isPending ? 'Enviando...' : 'Escolher capa'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                  <p className="text-xs text-white/30">1200x400. JPG, PNG ou WebP. Max 5MB</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brand-magenta/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-brand-magenta" />
                </div>
                <h3 className="font-semibold">Informacoes</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Nome exibido</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 focus:bg-white/[0.07] transition-all"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 focus:bg-white/[0.07] transition-all resize-none"
                    placeholder="Conte um pouco sobre voce..."
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${form.bio.length > 450 ? 'text-yellow-400' : 'text-white/20'}`}>
                      {form.bio.length}/500
                    </span>
                  </div>
                </div>

                {/* Availability Status */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-2 block uppercase tracking-wider">Status de disponibilidade</label>
                  <div className="flex gap-2">
                    {([
                      { value: 'available', label: 'Disponivel', color: 'bg-green-500', ring: 'ring-green-500/30' },
                      { value: 'busy', label: 'Ocupado', color: 'bg-yellow-500', ring: 'ring-yellow-500/30' },
                      { value: 'unavailable', label: 'Indisponivel', color: 'bg-red-500', ring: 'ring-red-500/30' },
                    ] as const).map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => updateField('availabilityStatus', form.availabilityStatus === opt.value ? '' : opt.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                          form.availabilityStatus === opt.value
                            ? `${opt.ring} ring-2 border-transparent bg-white/10`
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {form.availabilityStatus && (
                    <input
                      type="text"
                      value={form.availabilityMessage}
                      onChange={(e) => updateField('availabilityMessage', e.target.value)}
                      placeholder="Mensagem personalizada (opcional)"
                      maxLength={100}
                      className="mt-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Link2 size={16} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Redes Sociais</h3>
                  {form.socialLinks.filter(l => l.platform !== 'custom').length > 0 && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">
                      {form.socialLinks.filter(l => l.platform !== 'custom').length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="flex items-center gap-1.5 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-brand-cyan/5"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {form.socialLinks.map((link, i) => {
                    if (link.platform === 'custom') return null;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <GripVertical size={16} className="text-white/15 mt-2.5 shrink-0 cursor-grab" />
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={link.platform}
                              onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                              title="Plataforma"
                              className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/50 transition-all"
                            >
                              {SOCIAL_PLATFORMS.filter(p => p.value !== 'custom').map((p) => (
                                <option key={p.value} value={p.value} className="bg-brand-bg-dark">
                                  {p.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateSocialLink(i, 'label', e.target.value)}
                              placeholder="Label"
                              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                            />
                          </div>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocialLink(i)}
                          title="Remover link"
                          className="mt-2 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {form.socialLinks.filter(l => l.platform !== 'custom').length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <Link2 size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum link adicionado</p>
                    <p className="text-xs text-white/15 mt-1">Clique em "Adicionar" para comecar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Links (Link-in-bio) */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                    <ExternalLink size={16} className="text-brand-cyan" />
                  </div>
                  <h3 className="font-semibold">Links Personalizados</h3>
                  {form.socialLinks.filter(l => l.platform === 'custom').length > 0 && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">
                      {form.socialLinks.filter(l => l.platform === 'custom').length}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addCustomLink}
                  className="flex items-center gap-1.5 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-brand-cyan/5"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <p className="text-xs text-white/30 mb-4">Links exibidos como botoes no seu cartao (estilo Linktree)</p>
              <div className="space-y-3">
                <AnimatePresence>
                  {form.socialLinks.map((link, i) => {
                    if (link.platform !== 'custom') return null;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <GripVertical size={16} className="text-white/15 mt-2.5 shrink-0 cursor-grab" />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateSocialLink(i, 'label', e.target.value)}
                            placeholder="Titulo do link (ex: Meu Portfolio)"
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocialLink(i)}
                          title="Remover link"
                          className="mt-2 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {form.socialLinks.filter(l => l.platform === 'custom').length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <ExternalLink size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum link personalizado</p>
                    <p className="text-xs text-white/15 mt-1">Adicione links para exibir como botoes no cartao</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resume */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText size={16} className="text-green-400" />
                </div>
                <h3 className="font-semibold">Curriculo</h3>
              </div>
              <div className="flex items-center gap-3">
                {profile?.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-cyan hover:underline flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-cyan/5"
                  >
                    <ExternalLink size={14} /> Ver curriculo atual
                  </a>
                )}
                <label className="px-5 py-2.5 rounded-xl border border-white/10 text-sm cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all font-medium inline-flex items-center gap-2">
                  <FileText size={14} />
                  {uploadResume.isPending ? 'Enviando...' : 'Upload PDF'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </label>
              </div>
            </div>

            {/* Appearance */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Palette size={16} className="text-purple-400" />
                </div>
                <h3 className="font-semibold">Aparencia</h3>
              </div>
              <div className="space-y-5">
                {/* Card Theme */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-3 block uppercase tracking-wider">Tema do cartao</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CARD_THEMES.map((theme) => (
                      <button
                        type="button"
                        key={theme.value}
                        onClick={() => updateField('cardTheme', theme.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          form.cardTheme === theme.value
                            ? 'border-brand-cyan shadow-md shadow-brand-cyan/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2 ${theme.preview}`} />
                        <span className="text-xs text-white/70">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 mb-3 block uppercase tracking-wider">Cor dos botoes</label>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESET_BUTTON_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => updateField('buttonColor', color)}
                        title={`Cor ${color}`}
                        className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-105 ${
                          form.buttonColor === color
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-transparent hover:border-white/20'
                        }`}
                        style={{ backgroundColor: color, boxShadow: form.buttonColor === color ? `0 0 20px ${color}40` : undefined }}
                      />
                    ))}
                    <div className="relative">
                      <input
                        type="color"
                        value={form.buttonColor}
                        onChange={(e) => updateField('buttonColor', e.target.value)}
                        title="Escolher cor personalizada"
                        className="w-9 h-9 rounded-xl cursor-pointer opacity-0 absolute inset-0"
                      />
                      <div className="w-9 h-9 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                        <Plus size={14} className="text-white/40" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Slug (URL publica)</label>
                  <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 focus-within:border-brand-cyan/50 transition-all">
                    <span className="text-sm text-white/30 px-4 py-3 bg-white/[0.03] border-r border-white/10 shrink-0">
                      {window.location.origin}/
                    </span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                        setSlugInput(val);
                      }}
                      className="flex-1 px-4 py-3 bg-transparent text-white text-sm focus:outline-none"
                      placeholder="meu-cartao"
                    />
                  </div>
                  {slugCheck && slugInput !== profile?.slug && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs mt-1.5 flex items-center gap-1 ${slugCheck.available ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {slugCheck.available ? <Check size={12} /> : <X size={12} />}
                      {slugCheck.available ? 'Disponivel!' : 'Slug ja em uso'}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics (paid users only) */}
            {hasPaid && analytics && (
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                    <BarChart3 size={16} className="text-brand-cyan" />
                  </div>
                  <h3 className="font-semibold">Analytics</h3>
                  <span className="text-xs text-white/30 ml-auto">Ultimos 30 dias</span>
                </div>

                {/* Daily Views Chart */}
                <div className="mb-6">
                  <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Visualizacoes por dia</p>
                  {analytics.dailyViews.length > 0 ? (
                    <div className="flex items-end gap-1 h-24">
                      {getLast30Days(analytics.dailyViews).map((day) => {
                        const maxCount = Math.max(...getLast30Days(analytics.dailyViews).map(d => d.count), 1);
                        const height = Math.max((day.count / maxCount) * 100, 2);
                        return (
                          <div
                            key={day.date}
                            className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
                            style={{ height: `${height}%`, backgroundColor: day.count > 0 ? '#00E4F2' : '#ffffff10' }}
                            title={`${day.date}: ${day.count} views`}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 text-center py-4">Nenhuma visualizacao ainda</p>
                  )}
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-white/20">30 dias atras</span>
                    <span className="text-[10px] text-white/20">Hoje</span>
                  </div>
                </div>

                {/* Link Clicks */}
                {analytics.linkClicks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Cliques nos links</p>
                    <div className="space-y-2">
                      {analytics.linkClicks.slice(0, 10).map((link, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]">
                          <span className="text-white/70 truncate flex-1">{link.label}</span>
                          <span className="text-brand-cyan font-semibold ml-2">{link.totalClicks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Inbox (paid users only) */}
            {hasPaid && (
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <MessageSquare size={16} className="text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Mensagens</h3>
                  {contacts && contacts.filter((m) => !m.isRead).length > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                      {contacts.filter((m) => !m.isRead).length} nova{contacts.filter((m) => !m.isRead).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {contacts && contacts.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contacts.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border transition-all ${
                          msg.isRead ? 'bg-white/[0.02] border-white/5' : 'bg-brand-cyan/5 border-brand-cyan/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{msg.senderName}</span>
                              {!msg.isRead && <div className="w-2 h-2 rounded-full bg-brand-cyan shrink-0" />}
                            </div>
                            {msg.senderEmail && (
                              <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                                <Mail size={10} /> {msg.senderEmail}
                              </p>
                            )}
                            <p className="text-xs text-white/20 mt-0.5">
                              {new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!msg.isRead && (
                              <button
                                type="button"
                                onClick={() => markAsRead.mutate(msg.id)}
                                title="Marcar como lida"
                                className="p-1.5 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-400/10 transition-all"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                              title={expandedMessage === msg.id ? 'Recolher' : 'Expandir'}
                              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                            >
                              {expandedMessage === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>
                        {expandedMessage === msg.id ? (
                          <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap">{msg.message}</p>
                        ) : (
                          <p className="text-sm text-white/40 mt-1 truncate">{msg.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <MessageSquare size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-white/15 mt-1">Quando alguem enviar uma mensagem pelo seu cartao, ela aparecera aqui</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-4 flex items-center gap-3 sticky bottom-4"
            >
              <button
                type="button"
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:shadow-brand-cyan/20 disabled:opacity-50"
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Salvo!' : updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </button>

              {hasPaid && (
                <label className="flex items-center gap-3 text-sm cursor-pointer ml-auto px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateField('isPublished', e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="text-white/60 peer-checked:text-white transition-colors">Publicado</span>
                  <div className="w-11 h-6 bg-white/10 peer-checked:bg-brand-cyan rounded-full relative transition-all peer-checked:shadow-md peer-checked:shadow-brand-cyan/30">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm" />
                  </div>
                </label>
              )}
            </motion.div>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-24 h-fit"
          >
            <div className="flex items-center gap-2 mb-4">
              <Eye size={16} className="text-white/40" />
              <h3 className="font-semibold text-white/60">Preview</h3>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
              <CardPreview
                displayName={form.displayName}
                bio={form.bio}
                photoUrl={resolvePhotoUrl(profile?.photoUrl) ? `${resolvePhotoUrl(profile?.photoUrl)}?v=${photoVersion}` : undefined}
                coverPhotoUrl={resolvePhotoUrl(profile?.coverPhotoUrl) ? `${resolvePhotoUrl(profile?.coverPhotoUrl)}?v=${coverVersion}` : undefined}
                buttonColor={form.buttonColor}
                cardTheme={form.cardTheme}
                availabilityStatus={form.availabilityStatus || undefined}
                socialLinks={form.socialLinks}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
