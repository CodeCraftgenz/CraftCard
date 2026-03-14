import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, ChevronRight, ChevronLeft, Check, Loader2,
  GraduationCap, User, Mail, Lock, Eye, EyeOff, LogIn,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useProfile, useUploadPhoto, useUpdateProfile } from '@/hooks/useProfile';
import { usePublicSetting } from '@/hooks/useAdmin';
import {
  SOFT_SKILLS, FORMATION_AREAS, MAX_SKILLS, HACKATHON_CONFIG,
  parseHackathonMeta,
  type SoftSkill,
} from './constants';

// ── Steps ──────────────────────────────────────────────────

type Step = 'account' | 'photo' | 'area' | 'skills' | 'done';
const STEPS: Step[] = ['account', 'photo', 'area', 'skills', 'done'];

// ── Component ──────────────────────────────────────────────

export default function HackathonOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const { register, loginWithPassword, isAuthenticated } = useAuth();
  const uploadPhoto = useUploadPhoto();
  const updateProfile = useUpdateProfile();
  const { data: hackathonSetting, isLoading: settingLoading } = usePublicSetting('hackathon_active');
  const isHackathonActive = hackathonSetting?.value === 'true';

  // Fetch existing profile to detect returning users
  const { data: existingProfile, isLoading: profileLoading } = useProfile(undefined, isAuthenticated);

  const [step, setStep] = useState<Step>(isAuthenticated ? 'photo' : 'account');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Account fields
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Area & Skills
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // ── Redirect returning users to dashboard ─────────────
  useEffect(() => {
    if (!isAuthenticated || profileLoading || redirectChecked) return;
    setRedirectChecked(true);

    if (!existingProfile) return;

    const metaLink = existingProfile.socialLinks?.find(
      (l: { linkType?: string | null }) => l.linkType === 'hackathon_meta',
    );
    if (!metaLink) return; // New user, no hackathon data yet

    // If editing, pre-populate fields and start at photo step
    if (isEditMode) {
      const meta = parseHackathonMeta(metaLink.metadata);
      if (meta.hackathonArea) setSelectedArea(meta.hackathonArea);
      if (meta.hackathonSkills) setSelectedSkills(meta.hackathonSkills);
      setStep('photo');
      return;
    }

    // Returning user who already completed onboarding → go to dashboard
    navigate('/hackathon/dashboard', { replace: true });
  }, [isAuthenticated, profileLoading, existingProfile, redirectChecked, isEditMode, navigate]);

  const stepIndex = STEPS.indexOf(step);

  // ── Guard: loading state ────────────────────────────────
  if (settingLoading || (isAuthenticated && profileLoading && !redirectChecked)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, #001a33)` }}
      >
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // ── Guard: evento inativo ─────────────────────────────
  if (!isHackathonActive) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, #001a33)` }}
      >
        <div className="text-center max-w-md">
          <GraduationCap size={48} className="mx-auto mb-4 text-white/30" />
          <h1 className="text-2xl font-bold text-white mb-2">Inscricoes encerradas</h1>
          <p className="text-white/50 text-sm mb-6">O evento {HACKATHON_CONFIG.name} ainda nao esta com inscricoes abertas ou ja foi encerrado.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm border border-white/20 hover:bg-white/10 transition"
          >
            Voltar ao inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= MAX_SKILLS) return prev;
      return [...prev, id];
    });
  };

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  // ── Step: Account ─────────────────────────────────────

  const handleRegister = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, confirmPassword: password });
      goNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  // ── Step: Login ──────────────────────────────────────

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha');
      return;
    }
    setLoading(true);
    try {
      await loginWithPassword(email.trim(), password);
      // After login, the useEffect above will detect hackathon data and redirect
      // For new users without hackathon data, go to photo step
      goNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  // ── Step: Photo ───────────────────────────────────────

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      goNext();
      return;
    }
    setLoading(true);
    try {
      await uploadPhoto.mutateAsync(photoFile);
      goNext();
    } catch {
      setError('Erro ao enviar foto');
    } finally {
      setLoading(false);
    }
  };

  // ── Step: Skills (final save) ─────────────────────────

  const handleFinish = async () => {
    if (selectedSkills.length === 0) {
      setError('Selecione pelo menos 1 skill');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const hackathonMeta = JSON.stringify({
        hackathonArea: selectedArea,
        hackathonSkills: selectedSkills,
      });
      const area = FORMATION_AREAS.find(a => a.id === selectedArea);

      // Preserve existing social links — only replace the hackathon_meta entry
      const existingLinks = (existingProfile?.socialLinks || [])
        .filter(l => l.linkType !== 'hackathon_meta')
        .map(l => ({
          platform: l.platform as 'custom',
          label: l.label,
          url: l.url,
          order: l.order,
          linkType: l.linkType || undefined,
          metadata: l.metadata || undefined,
        }));

      const hackathonLink = {
        platform: 'custom' as const,
        label: 'hackathon_meta',
        url: '#',
        order: 999,
        linkType: 'hackathon_meta',
        metadata: hackathonMeta,
      };

      // Only set displayName if user typed one (new registration); skip for existing users
      const payload: Record<string, unknown> = {
        isPublished: true,
        socialLinks: [...existingLinks, hackathonLink],
      };
      if (name.trim()) payload.displayName = name.trim();
      // Only set bio/buttonColor if user doesn't already have custom values
      if (!existingProfile?.bio) payload.bio = area?.fullPhrase || null;
      if (!existingProfile?.buttonColor || existingProfile.buttonColor === '#00E4F2') {
        payload.buttonColor = area?.color || '#00E4F2';
      }

      await updateProfile.mutateAsync(payload as Parameters<typeof updateProfile.mutateAsync>[0]);
      setStep('done');
    } catch {
      setError('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────

  const ProgressBar = () => (
    <div className="flex gap-1.5 mb-8">
      {STEPS.filter(s => s !== 'done').map((s, i) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            background: i <= STEPS.indexOf(step) - (step === 'done' ? 0 : 0)
              ? `linear-gradient(90deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})`
              : 'rgba(255,255,255,0.1)',
            ...(i <= stepIndex ? {} : {}),
          }}
        />
      ))}
    </div>
  );

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{
        background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue} 0%, #001a33 50%, #1a0a00 100%)`,
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 mb-6"
      >
        <GraduationCap size={32} style={{ color: HACKATHON_CONFIG.senacOrange }} />
        <h1 className="text-2xl font-bold text-white">{HACKATHON_CONFIG.name}</h1>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <ProgressBar />

        <AnimatePresence mode="wait">
          {/* ── STEP: Account (Register / Login) ── */}
          {step === 'account' && (
            <motion.div key="account" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-1">
                {isLoginMode ? 'Entrar na sua conta' : 'Crie sua conta'}
              </h2>
              <p className="text-sm text-white/50 mb-6">
                {isLoginMode ? 'Use o e-mail e senha cadastrados' : 'Rapido e sem complicacao'}
              </p>

              <div className="space-y-4">
                {!isLoginMode && (
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                  />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLoginMode ? 'Senha' : 'Senha (min. 6 caracteres)'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <button
                onClick={isLoginMode ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full mt-6 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
              >
                {loading
                  ? <Loader2 size={18} className="animate-spin" />
                  : isLoginMode
                    ? <><LogIn size={18} /> Entrar</>
                    : <>Criar conta <ChevronRight size={18} /></>
                }
              </button>

              <button
                type="button"
                onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                className="w-full mt-3 py-2 text-sm text-white/50 hover:text-white/80 transition text-center"
              >
                {isLoginMode ? 'Nao tenho conta — Criar agora' : 'Ja tenho conta — Entrar'}
              </button>
            </motion.div>
          )}

          {/* ── STEP: Photo ─────────────────────── */}
          {step === 'photo' && (
            <motion.div key="photo" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-1">Sua foto</h2>
              <p className="text-sm text-white/50 mb-6">Opcional — pode adicionar depois</p>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-white/40 transition group"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-white/30 group-hover:text-white/50 transition" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} aria-label="Upload foto de perfil" />
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="text-sm text-white/40 hover:text-white/60 transition"
                  >
                    Remover foto
                  </button>
                )}
              </div>

              {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

              <div className="flex gap-3 mt-6">
                {!isAuthenticated && (
                  <button onClick={goBack} className="flex-1 py-3 rounded-xl font-medium text-white/60 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1">
                    <ChevronLeft size={18} /> Voltar
                  </button>
                )}
                <button
                  onClick={handlePhotoUpload}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>{photoFile ? 'Enviar' : 'Pular'} <ChevronRight size={18} /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Area ──────────────────────── */}
          {step === 'area' && (
            <motion.div key="area" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-1">Area de Formacao</h2>
              <p className="text-sm text-white/50 mb-4">Selecione a area que mais combina com voce</p>

              <div className="grid grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {FORMATION_AREAS.map(area => {
                  const selected = selectedArea === area.id;
                  return (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(area.id)}
                      className="relative p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: selected ? area.color : 'rgba(255,255,255,0.1)',
                        background: selected ? `${area.color}15` : 'rgba(255,255,255,0.03)',
                        boxShadow: selected ? `0 0 20px ${area.color}20` : 'none',
                      }}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: area.color }}>
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-white leading-tight">{area.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5 italic">{area.phrase}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={goBack} className="flex-1 py-3 rounded-xl font-medium text-white/60 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1">
                  <ChevronLeft size={18} /> Voltar
                </button>
                <button
                  onClick={goNext}
                  disabled={!selectedArea}
                  className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
                >
                  Continuar <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Skills ────────────────────── */}
          {step === 'skills' && (
            <motion.div key="skills" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-xl font-bold text-white mb-1">Soft Skills</h2>
              <p className="text-sm text-white/50 mb-4">
                Escolha ate {MAX_SKILLS} habilidades — <span className="font-medium text-white/70">{selectedSkills.length}/{MAX_SKILLS}</span>
              </p>

              <div className="flex flex-wrap gap-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {SOFT_SKILLS.map((skill: SoftSkill) => {
                  const selected = selectedSkills.includes(skill.id);
                  const disabled = !selected && selectedSkills.length >= MAX_SKILLS;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      disabled={disabled}
                      className="px-3 py-2 rounded-xl border text-sm transition-all flex items-center gap-1.5"
                      style={{
                        borderColor: selected ? HACKATHON_CONFIG.senacOrange : 'rgba(255,255,255,0.1)',
                        background: selected ? `${HACKATHON_CONFIG.senacOrange}20` : 'rgba(255,255,255,0.03)',
                        opacity: disabled ? 0.35 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span>{skill.emoji}</span>
                      <span className={selected ? 'text-white font-medium' : 'text-white/60'}>{skill.label}</span>
                      {selected && <Check size={14} style={{ color: HACKATHON_CONFIG.senacOrange }} />}
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <div className="flex gap-3 mt-5">
                <button onClick={goBack} className="flex-1 py-3 rounded-xl font-medium text-white/60 border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1">
                  <ChevronLeft size={18} /> Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading || selectedSkills.length === 0}
                  className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-30"
                  style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Finalizar <Check size={18} /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Done ──────────────────────── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="text-center py-4"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
              >
                <Check size={36} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tudo pronto!</h2>
              <p className="text-white/50 mb-6 text-sm">
                Seu perfil para o {HACKATHON_CONFIG.name} foi criado com sucesso.
              </p>
              <button
                onClick={() => navigate('/hackathon/dashboard')}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{ background: `linear-gradient(135deg, ${HACKATHON_CONFIG.senacBlue}, ${HACKATHON_CONFIG.senacOrange})` }}
              >
                Ver meu Cartao
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <p className="text-white/20 text-xs mt-6">
        Powered by CraftCard &times; {HACKATHON_CONFIG.name}
      </p>
    </div>
  );
}
