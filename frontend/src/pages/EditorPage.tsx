import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Copy, Check, ExternalLink, CreditCard, Upload, X, Plus, GripVertical } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { CardPreview } from '@/components/organisms/CardPreview';
import { useAuth } from '@/providers/AuthProvider';
import {
  useProfile,
  useUpdateProfile,
  useUploadPhoto,
  useUploadResume,
  useCheckSlug,
  type Profile,
} from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { PRESET_BUTTON_COLORS, SOCIAL_PLATFORMS } from '@/lib/constants';

export function EditorPage() {
  const { hasPaid } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const uploadResume = useUploadResume();

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    buttonColor: '#00E4F2',
    slug: '',
    isPublished: false,
    socialLinks: [] as Array<{ platform: string; label: string; url: string; order: number }>,
  });

  const [slugInput, setSlugInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        buttonColor: profile.buttonColor || '#00E4F2',
        slug: profile.slug || '',
        isPublished: profile.isPublished,
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

  const handleSave = useCallback(async () => {
    const data = {
      ...form,
      slug: slugInput,
    };
    await updateProfile.mutateAsync(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [form, slugInput, updateProfile]);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadPhoto.mutateAsync(file);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadResume.mutateAsync(file);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${profile?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addSocialLink = () => {
    updateField('socialLinks', [
      ...form.socialLinks,
      { platform: 'website', label: '', url: '', order: form.socialLinks.length },
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
    const data: { url: string } = await api.post('/stripe/checkout-session');
    window.location.href = data.url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white">
      <Header />
      <div className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Payment banner */}
        {!hasPaid && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold">Desbloqueie seu cartao</h3>
              <p className="text-sm text-white/50 mt-1">
                Pague R$20 uma unica vez para publicar seu cartao digital
              </p>
            </div>
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              <CreditCard size={16} />
              Pagar R$ 20,00
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Form */}
          <div className="space-y-6">
            {/* Photo */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Foto</h3>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-full bg-brand-bg-card flex items-center justify-center overflow-hidden border-2 border-white/10"
                  style={
                    profile?.photoUrl
                      ? { backgroundImage: `url(${profile.photoUrl})`, backgroundSize: 'cover' }
                      : undefined
                  }
                >
                  {!profile?.photoUrl && <Upload size={20} className="text-white/30" />}
                </div>
                <label className="px-4 py-2 rounded-lg border border-white/10 text-sm cursor-pointer hover:bg-white/5 transition-colors">
                  {uploadPhoto.isPending ? 'Enviando...' : 'Escolher foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-semibold">Informacoes</h3>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Nome exibido</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 resize-none"
                  placeholder="Conte um pouco sobre voce..."
                />
                <p className="text-xs text-white/30 mt-1 text-right">{form.bio.length}/500</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Redes Sociais</h3>
                <button
                  onClick={addSocialLink}
                  className="flex items-center gap-1 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {form.socialLinks.map((link, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <GripVertical size={16} className="text-white/20 mt-3 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={link.platform}
                          onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
                        >
                          {SOCIAL_PLATFORMS.map((p) => (
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
                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
                        />
                      </div>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
                      />
                    </div>
                    <button
                      onClick={() => removeSocialLink(i)}
                      className="mt-2 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {form.socialLinks.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-4">
                    Nenhum link adicionado
                  </p>
                )}
              </div>
            </div>

            {/* Resume */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4">Curriculo</h3>
              <div className="flex items-center gap-3">
                {profile?.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-cyan hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={14} /> Ver curriculo atual
                  </a>
                )}
                <label className="px-4 py-2 rounded-lg border border-white/10 text-sm cursor-pointer hover:bg-white/5 transition-colors">
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

            {/* Color & Slug */}
            <div className="glass-card p-6 space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-2 block">Cor do botao</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_BUTTON_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateField('buttonColor', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.buttonColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.buttonColor}
                    onChange={(e) => updateField('buttonColor', e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-1 block">Slug (URL publica)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/30 shrink-0">craftcard.com.br/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setSlugInput(val);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/50"
                    placeholder="meu-cartao"
                  />
                </div>
                {slugCheck && slugInput !== profile?.slug && (
                  <p className={`text-xs mt-1 ${slugCheck.available ? 'text-green-400' : 'text-red-400'}`}>
                    {slugCheck.available ? 'Disponivel!' : 'Slug ja em uso'}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? 'Salvo!' : updateProfile.isPending ? 'Salvando...' : 'Salvar'}
              </button>

              {profile?.isPublished && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar link'}
                </button>
              )}

              {hasPaid && (
                <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateField('isPublished', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-white/10 peer-checked:bg-brand-cyan rounded-full relative transition-colors">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                  Publicado
                </label>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <h3 className="font-semibold mb-4 text-center lg:text-left">Preview</h3>
            <CardPreview
              displayName={form.displayName}
              bio={form.bio}
              photoUrl={profile?.photoUrl || undefined}
              buttonColor={form.buttonColor}
              socialLinks={form.socialLinks}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
