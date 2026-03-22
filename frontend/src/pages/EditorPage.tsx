import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Copy, Check, ExternalLink, CreditCard, Upload, X, Plus, Lock,
  Camera, FileText, Palette, Link2, Sparkles, Smartphone, Building2, Shield,
  QrCode, BarChart3, Calendar, Download, MessageSquare, Mail, Star, Video, UserPlus, Users, Paintbrush, Trash2,
  ChevronDown, Cloud, CloudUpload, Image, User, AlertCircle,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensors, useSensor, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import { Header } from '@/components/organisms/Header';
import { SortableLinkItem } from '@/components/organisms/SortableLinkItem';
import { TemplatePicker } from '@/components/organisms/TemplatePicker';
import { CardPreview } from '@/components/organisms/CardPreview';
import { MobilePreview } from '@/components/organisms/MobilePreview';
import { CustomQrCode, DEFAULT_QR_SETTINGS, type QrCodeSettings } from '@/components/organisms/CustomQrCode';
import { CardSwitcher } from '@/components/organisms/CardSwitcher';
import { useAuth } from '@/providers/AuthProvider';
import {
  useProfile,
  useUpdateProfile,
  useUploadPhoto,
  useUploadCover,
  useUploadResume,
  useUploadVideo,
  useUploadBackground,
  useDeleteBackground,
  useCheckSlug,
  useCards,
  useCreateCard,
  useDeleteCard,
  useSetPrimaryCard,
} from '@/hooks/useProfile';
import { api } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useContacts, useMarkAsRead, useDeleteMessage, useDeleteBulkMessages } from '@/hooks/useContacts';
import { useTestimonials, useApproveTestimonial, useRejectTestimonial } from '@/hooks/useTestimonials';
import { useGallery, useUploadGalleryImage, useDeleteGalleryImage } from '@/hooks/useGallery';
import { useMySlots, useSaveSlots, useMyBookings, useUpdateBookingStatus, useDeleteBooking } from '@/hooks/useBookings';
import { PRESET_BUTTON_COLORS, SOCIAL_PLATFORMS, GRID_SIZES, BLOCK_SHAPES, BLOCK_TEXTURES, BUTTON_SKINS, setMetadataField, getGridSize, parseMetadata, resolvePhotoUrl, API_URL } from '@/lib/constants';
import { StyleEditor } from '@/components/organisms/StyleEditor';
import { ServicesEditor } from '@/components/organisms/ServicesEditor';
import { FaqEditor } from '@/components/organisms/FaqEditor';
import { UpgradeBanner } from '@/components/organisms/UpgradeBanner';
import { FeatureLock } from '@/components/organisms/FeatureLock';
import { useAchievements, useCheckAchievements } from '@/hooks/useAchievements';
import { EmailSignature } from '@/components/organisms/EmailSignature';
import { WidgetCodeGenerator } from '@/components/organisms/WidgetCodeGenerator';
import { OnboardingWizard, type OnboardingData } from '@/components/organisms/OnboardingWizard';
import { useCreateOrganization } from '@/hooks/useOrganization';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { CardTemplate } from '@/lib/card-templates';

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
  // ── 8 novos temas premium ──────────────────────────────────────────
  // Cada tema usa propriedade `gradient` (CSS) em vez de `preview` (Tailwind)
  // para permitir gradientes mais complexos no seletor do editor.
  { value: 'glass', label: 'Glass', gradient: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))' },       // Vidro translucido
  { value: 'brutalist', label: 'Brutalist', gradient: 'linear-gradient(90deg, #ffffff, #333333)' },                              // Design brutalista (alto contraste)
  { value: 'neumorphism', label: 'Neumorfismo', gradient: 'linear-gradient(145deg, #2a2d42, #1a1c2e)' },                         // Neumorfismo (sombras suaves 3D)
  { value: 'terminal', label: 'Terminal', gradient: 'linear-gradient(90deg, #00ff41, #003300)' },                                 // Estetica hacker/terminal verde
  { value: 'polaroid', label: 'Polaroid', gradient: 'linear-gradient(180deg, #ffffff, #f0e6d3)' },                                // Fotografia vintage polaroid
  { value: 'pastel', label: 'Pastel', gradient: 'linear-gradient(135deg, #FFB6C1, #C4B5FD)' },                                    // Tons pastel suaves (rosa/lilas)
  { value: 'noir', label: 'Noir', gradient: 'linear-gradient(135deg, #000000, #B8860B)' },                                        // Cinema noir (preto e dourado)
  { value: 'retro', label: 'Retro', gradient: 'linear-gradient(135deg, #EC4899, #00E4F2)' },                                      // Retro/synthwave (rosa e ciano)
  { value: 'glass3d', label: 'Vidro 3D', gradient: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05), rgba(0,228,242,0.1))' }, // Glassmorphism 3D com profundidade
];

function EditorSection({ icon, title, badge, children, defaultOpen = true }: { icon: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card overflow-hidden hover:border-white/20 transition-colors">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center gap-3 text-left">
        <span className="w-7 h-7 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan/70 shrink-0">{icon}</span>
        <h3 className="font-semibold text-white/90 text-sm">{title}</h3>
        {badge}
        <ChevronDown size={16} className={`ml-auto text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EditorPage() {
  const { hasPaid, paidUntil, refreshAuth, cards: authCards, hasFeature, organizations, plan, planLimits, isAdmin } = useAuth();
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const createOrg = useCreateOrganization();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Refresh auth state on mount to ensure hasPaid is up-to-date
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Set initial activeCardId from auth cards
  useEffect(() => {
    if (authCards.length > 0 && !activeCardId) {
      const primary = authCards.find((c) => c.isPrimary);
      setActiveCardId(primary?.id || authCards[0].id);
    }
  }, [authCards, activeCardId]);

  const { data: cardsData } = useCards();
  const createCard = useCreateCard();
  const deleteCard = useDeleteCard();
  const setPrimaryCard = useSetPrimaryCard();
  const cards = cardsData || authCards;

  const { data: profile, isLoading } = useProfile(activeCardId);
  // Check if org branding is active for this card — locks visual customization
  const isBrandingLocked = useMemo(() => {
    if (!profile?.orgId) return false;
    return organizations.some((o) => o.id === profile.orgId && o.brandingActive);
  }, [profile?.orgId, organizations]);
  // Check if org has cover/background set — members can't override those specific images
  const orgForProfile = useMemo(() => {
    if (!profile?.orgId) return null;
    return organizations.find((o) => o.id === profile.orgId) || null;
  }, [profile?.orgId, organizations]);
  const isOrgCoverLocked = !!orgForProfile?.coverUrl;
  const isOrgBackgroundLocked = !!orgForProfile?.backgroundImageUrl;
  const updateProfile = useUpdateProfile(activeCardId);
  const uploadPhoto = useUploadPhoto();
  const uploadCover = useUploadCover();
  const uploadResume = useUploadResume();
  const uploadVideo = useUploadVideo();
  const uploadBackground = useUploadBackground();
  const deleteBackground = useDeleteBackground();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { data: analytics } = useAnalytics(hasPaid);
  const { data: contacts } = useContacts(hasPaid);
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();
  const deleteBulk = useDeleteBulkMessages();
  const { data: testimonials } = useTestimonials(hasPaid);
  const approveTestimonial = useApproveTestimonial();
  const rejectTestimonial = useRejectTestimonial();
  const { data: galleryImages } = useGallery();
  const uploadGalleryImage = useUploadGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { data: mySlots } = useMySlots();
  const saveSlots = useSaveSlots();
  const { data: myBookings } = useMyBookings();
  const updateBookingStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();
  const { data: achievements } = useAchievements();
  const checkAchievements = useCheckAchievements();
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const { canInstall, isInstalled, install: installPwa } = usePwaInstall();
  const pushNotifications = usePushNotifications();
  const [pwaDismissed, setPwaDismissed] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    buttonColor: '#00E4F2',
    slug: '',
    isPublished: false,
    cardTheme: 'default',
    availabilityStatus: '' as string,
    availabilityMessage: '',
    photoPositionY: 50,
    coverPositionY: 50,
    leadCaptureEnabled: false,
    bookingEnabled: false,
    resumeEnabled: true,
    contactFormEnabled: true,
    testimonialsEnabled: true,
    galleryEnabled: true,
    servicesEnabled: true,
    faqEnabled: true,
    connectionsEnabled: true,
    fontFamily: null as string | null,
    fontSizeScale: 1,
    backgroundType: 'theme' as string,
    backgroundGradient: null as string | null,
    backgroundImageUrl: null as string | null,
    backgroundOverlay: 0.7 as number,
    backgroundPattern: null as string | null,
    linkLayout: 'list' as string,
    linkStyle: 'rounded' as string,
    linkAnimation: 'none' as string,
    iconStyle: 'default' as string,
    iconPack: 'lucide' as string,
    socialLinks: [] as Array<{ platform: string; label: string; url: string; order: number; startsAt: string | null; endsAt: string | null; linkType?: string | null; metadata?: string | null }>,
  });

  const [slugInput, setSlugInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false); // SG-1: feedback visual de erro ao salvar
  const [photoVersion, setPhotoVersion] = useState(Date.now());
  const [coverVersion, setCoverVersion] = useState(Date.now());
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrSettings, setQrSettings] = useState<QrCodeSettings>({ ...DEFAULT_QR_SETTINGS });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const initializedRef = useRef(false);

  // Reset form when switching cards
  useEffect(() => {
    initializedRef.current = false;
  }, [activeCardId]);

  // Sync profile data to form only on initial load (or card switch)
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
        photoPositionY: profile.photoPositionY ?? 50,
        coverPositionY: profile.coverPositionY ?? 50,
        leadCaptureEnabled: profile.leadCaptureEnabled ?? false,
        bookingEnabled: profile.bookingEnabled ?? false,
        resumeEnabled: profile.resumeEnabled ?? true,
        contactFormEnabled: profile.contactFormEnabled ?? true,
        testimonialsEnabled: profile.testimonialsEnabled ?? true,
        galleryEnabled: profile.galleryEnabled ?? true,
        servicesEnabled: profile.servicesEnabled ?? true,
        faqEnabled: profile.faqEnabled ?? true,
        connectionsEnabled: profile.connectionsEnabled ?? true,
        fontFamily: profile.fontFamily ?? null,
        fontSizeScale: profile.fontSizeScale ?? 1,
        backgroundType: profile.backgroundType ?? 'theme',
        backgroundGradient: profile.backgroundGradient ?? null,
        backgroundImageUrl: profile.backgroundImageUrl ?? null,
        backgroundOverlay: profile.backgroundOverlay ?? 0.7,
        backgroundPattern: profile.backgroundPattern ?? null,
        linkLayout: profile.linkLayout ?? 'list',
        linkStyle: profile.linkStyle ?? 'rounded',
        linkAnimation: profile.linkAnimation ?? 'none',
        iconStyle: profile.iconStyle ?? 'default',
        iconPack: (profile as any).iconPack ?? 'lucide',
        socialLinks: profile.socialLinks.map((l) => ({
          platform: l.platform,
          label: l.label,
          url: l.url,
          order: l.order,
          startsAt: l.startsAt || null,
          endsAt: l.endsAt || null,
          linkType: l.linkType || 'link',
          metadata: l.metadata || null,
        })),
      });
      setSlugInput(profile.slug || '');

      // Show onboarding for new users (default displayName, no links)
      const onboardingDone = localStorage.getItem('craftcard_onboarding_done');
      if (!onboardingDone && profile.displayName === 'Novo Cartão' && profile.socialLinks.length === 0) {
        setShowOnboarding(true);
      }
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    updateField('socialLinks', arrayMove([...form.socialLinks], oldIndex, newIndex));
  };

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
    data.photoPositionY = form.photoPositionY;
    data.coverPositionY = form.coverPositionY;
    data.leadCaptureEnabled = form.leadCaptureEnabled;
    data.bookingEnabled = form.bookingEnabled;
    data.resumeEnabled = form.resumeEnabled;
    data.contactFormEnabled = form.contactFormEnabled;
    data.testimonialsEnabled = form.testimonialsEnabled;
    data.galleryEnabled = form.galleryEnabled;
    data.servicesEnabled = form.servicesEnabled;
    data.faqEnabled = form.faqEnabled;
    data.connectionsEnabled = form.connectionsEnabled;
    data.fontFamily = form.fontFamily || null;
    data.fontSizeScale = form.fontSizeScale;
    data.backgroundType = form.backgroundType;
    data.backgroundGradient = form.backgroundGradient || null;
    data.backgroundImageUrl = form.backgroundImageUrl || null;
    data.backgroundOverlay = form.backgroundOverlay;
    data.backgroundPattern = form.backgroundPattern || null;
    data.linkLayout = form.linkLayout;
    data.linkStyle = form.linkStyle;
    data.linkAnimation = form.linkAnimation;
    data.iconStyle = form.iconStyle;
    data.iconPack = form.iconPack;

    // Only send slug if >= 3 chars
    if (slugInput.length >= 3) {
      data.slug = slugInput;
    }

    // Filter social links - only include complete ones
    const validLinks = form.socialLinks.filter((l) => {
      const hasLabel = l.label.trim().length > 0;
      // Headers and Pix don't need a URL
      if (l.platform === 'header' || l.platform === 'pix') return hasLabel;
      // Map and Phone accept plain text (address/number)
      if (l.platform === 'map' || l.platform === 'phone') return hasLabel && l.url.trim().length > 0;
      const hasUrl = l.url.trim().length > 0;
      const isValidUrl = /^(https?:\/\/|mailto:|tel:).+/i.test(l.url.trim());
      return hasLabel && hasUrl && isValidUrl;
    });
    data.socialLinks = validLinks.map((l, i) => {
      // Strip UI-only keys from metadata before saving
      let cleanMeta = l.metadata || null;
      if (cleanMeta) {
        try {
          const parsed = JSON.parse(cleanMeta);
          delete parsed._showAppearance;
          cleanMeta = Object.keys(parsed).length > 0 ? JSON.stringify(parsed) : null;
        } catch { /* keep as-is */ }
      }
      return {
        platform: l.platform,
        label: l.label.trim(),
        url: l.url.trim(),
        order: i,
        startsAt: l.startsAt || null,
        endsAt: l.endsAt || null,
        linkType: l.linkType || 'link',
        metadata: cleanMeta,
      };
    });

    return data;
  }, [form, slugInput]);

  const handleSave = useCallback(async () => {
    try {
      const data = buildSavePayload();
      await updateProfile.mutateAsync(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Check achievements after save (fire-and-forget)
      checkAchievements.mutate();
    } catch {
      // SG-1: exibe feedback visual de erro ao salvar (auto-dismiss 5s)
      setSaveError(true);
      setTimeout(() => setSaveError(false), 5000);
    }
  }, [buildSavePayload, updateProfile]);

  // Auto-save with debounce (1.5s of inactivity triggers save)
  const triggerAutoSave = useDebouncedCallback(handleSave, 1500);

  const updateField = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    triggerAutoSave();
  }, [triggerAutoSave]);

  const [uploadError, setUploadError] = useState('');
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB — limite para fotos e capas
  const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB — limite para currículos/PDFs

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    // SG-2: validação de tamanho antes do upload
    if (file.size > MAX_IMAGE_SIZE) { setUploadError('Arquivo muito grande. Máximo: 5MB'); return; }
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
    if (file.size > MAX_IMAGE_SIZE) { setUploadError('Arquivo muito grande. Máximo: 5MB'); return; }
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
    if (file.size > MAX_RESUME_SIZE) { setUploadError('Arquivo muito grande. Máximo: 10MB'); return; }
    try {
      await uploadResume.mutateAsync(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar currículo';
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
      { platform: 'website', label: '', url: 'https://', order: form.socialLinks.length, startsAt: null, endsAt: null },
    ]);
  };

  const addCustomLink = () => {
    updateField('socialLinks', [
      ...form.socialLinks,
      { platform: 'custom', label: '', url: 'https://', order: form.socialLinks.length, startsAt: null, endsAt: null },
    ]);
  };

  const removeSocialLink = (index: number) => {
    updateField(
      'socialLinks',
      form.socialLinks.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })),
    );
  };

  const updateSocialLink = useCallback((index: number, field: string, value: string) => {
    setForm((prev) => {
      const links = [...prev.socialLinks];
      links[index] = { ...links[index], [field]: value };
      if (field === 'platform') {
        const platform = SOCIAL_PLATFORMS.find((p) => p.value === value);
        if (platform) {
          if (!links[index].label) {
            links[index].label = platform.label;
          }
          const oldPlatform = SOCIAL_PLATFORMS.find((p) => p.value === prev.socialLinks[index]?.platform);
          const currentUrl = links[index].url;
          if (!currentUrl || currentUrl === oldPlatform?.urlPrefix) {
            links[index].url = platform.urlPrefix;
          }
        }
      }
      return { ...prev, socialLinks: links };
    });
    triggerAutoSave();
  }, [triggerAutoSave]);

  const handleCheckout = async () => {
    const data: { url: string } = await api.post('/payments/checkout', { plan: 'PRO' });
    window.location.href = data.url;
  };

  // Memoized props for StyleEditor to prevent re-renders
  const styleEditorValue = useMemo(() => ({
    fontFamily: form.fontFamily,
    fontSizeScale: form.fontSizeScale,
    backgroundType: form.backgroundType,
    backgroundGradient: form.backgroundGradient,
    backgroundImageUrl: form.backgroundImageUrl,
    backgroundOverlay: form.backgroundOverlay,
    backgroundPattern: form.backgroundPattern,
    linkLayout: form.linkLayout,
    linkStyle: form.linkStyle,
    linkAnimation: form.linkAnimation,
    iconStyle: form.iconStyle,
    iconPack: form.iconPack,
  }), [form.fontFamily, form.fontSizeScale, form.backgroundType, form.backgroundGradient, form.backgroundImageUrl, form.backgroundOverlay, form.backgroundPattern, form.linkLayout, form.linkStyle, form.linkAnimation, form.iconStyle, form.iconPack]);

  const handleStyleChange = useCallback((key: string, val: string | number | null) => {
    updateField(key as keyof typeof form, val as never);
  }, [updateField]);

  const handleUploadBackground = useCallback(async (file: File) => {
    try {
      const result: { url: string } = await uploadBackground.mutateAsync(file);
      setForm((prev) => ({ ...prev, backgroundImageUrl: result.url, backgroundType: 'image' }));
    } catch {
      // upload error handled by react-query
    }
  }, [uploadBackground]);

  const handleDeleteBackground = useCallback(async () => {
    try {
      await deleteBackground.mutateAsync();
      setForm((prev) => ({ ...prev, backgroundImageUrl: null, backgroundType: 'theme', backgroundOverlay: 0.7 }));
    } catch {
      // delete error handled by react-query
    }
  }, [deleteBackground]);

  const applyTemplate = (template: CardTemplate) => {
    setForm((prev) => ({
      ...prev,
      displayName: prev.displayName || template.displayName,
      bio: prev.bio || template.bio,
      cardTheme: template.cardTheme,
      buttonColor: template.buttonColor,
      socialLinks: template.suggestedLinks.map((l, i) => ({
        platform: l.platform,
        label: l.label,
        url: l.url,
        order: i,
        startsAt: null,
        endsAt: null,
      })),
    }));
    triggerAutoSave();
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

  const getProfileCompleteness = () => {
    const items: Array<{ label: string; done: boolean; weight: number }> = [
      { label: 'Nome exibido', done: form.displayName.trim().length >= 2, weight: 15 },
      { label: 'Bio', done: form.bio.trim().length > 0, weight: 15 },
      { label: 'Foto de perfil', done: !!profile?.photoUrl, weight: 15 },
      { label: 'Foto de capa', done: !!profile?.coverPhotoUrl, weight: 10 },
      { label: 'Rede social', done: form.socialLinks.filter((l) => l.platform !== 'custom' && l.url.trim().length > 10).length >= 1, weight: 15 },
      { label: 'Link personalizado', done: form.socialLinks.filter((l) => l.platform === 'custom' && l.url.trim().length > 10).length >= 1, weight: 10 },
      { label: 'Slug configurado', done: slugInput.length >= 3, weight: 10 },
      { label: 'Publicado', done: form.isPublished, weight: 10 },
    ];
    const total = items.reduce((acc, i) => acc + (i.done ? i.weight : 0), 0);
    return { items, total };
  };

  const completeness = getProfileCompleteness();

  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    setForm((prev) => ({
      ...prev,
      displayName: data.displayName,
      bio: data.bio,
      socialLinks: data.links.map((l, i) => ({
        platform: l.platform,
        label: SOCIAL_PLATFORMS.find((p) => p.value === l.platform)?.label || l.platform,
        url: l.url,
        order: i,
        startsAt: null,
        endsAt: null,
        linkType: 'link',
        metadata: null,
      })),
    }));
    setShowOnboarding(false);
    localStorage.setItem('craftcard_onboarding_done', '1');
    // Save onboarding data after short delay
    setTimeout(() => {
      updateProfile.mutateAsync({
        displayName: data.displayName,
        bio: data.bio,
        socialLinks: data.links.map((l, i) => ({
          platform: l.platform,
          label: SOCIAL_PLATFORMS.find((p) => p.value === l.platform)?.label || l.platform,
          url: l.url,
          order: i,
        })),
      }).catch(() => {});
    }, 500);
  }, [updateProfile]);

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('craftcard_onboarding_done', '1');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-white" style={{ overflowX: 'clip' }}>
      <Header />

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      )}

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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles size={22} className="text-brand-cyan" />
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Editor do Cartão</span>
            </h1>
            <div className="flex items-center gap-2 text-xs">
              {updateProfile.isPending ? (
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex items-center gap-1.5 text-brand-cyan/70">
                  <Cloud size={14} />
                  <span>Salvando...</span>
                </motion.div>
              ) : saveError ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-red-400/90">
                  <AlertCircle size={14} />
                  <span>Erro ao salvar</span>
                </motion.div>
              ) : saved ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-emerald-400/70">
                  <CloudUpload size={14} />
                  <span>Salvo</span>
                </motion.div>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-white/40 mt-1">Personalize seu cartão digital profissional</p>
          {/* Linha separadora com gradiente sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent mt-4" />
        </motion.div>

        {/* Card Switcher (multiple cards) */}
        {hasPaid && cards.length > 0 && (
          <CardSwitcher
            cards={cards}
            activeCardId={activeCardId}
            onSwitch={async (id) => { triggerAutoSave.cancel(); await handleSave(); setActiveCardId(id); }} // SG-4: flush dados antes de trocar cartão
            onCreate={(label) => createCard.mutate(label, {
              onSuccess: () => refreshAuth(),
            })}
            onDelete={(id) => {
              deleteCard.mutate(id, {
                onSuccess: () => {
                  refreshAuth();
                  const remaining = cards.filter((c) => c.id !== id);
                  const primary = remaining.find((c) => c.isPrimary);
                  setActiveCardId(primary?.id || remaining[0]?.id);
                },
              });
            }}
            onSetPrimary={(id) => setPrimaryCard.mutate(id, {
              onSuccess: () => refreshAuth(),
            })}
            hasPaid={hasPaid}
            maxCards={typeof planLimits.maxCards === 'number' ? planLimits.maxCards : 5}
          />
        )}

        {/* Profile Completeness */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 glass-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/70">Completude do perfil</span>
            <span className="text-sm font-bold" style={{ color: completeness.total >= 80 ? '#4ade80' : completeness.total >= 50 ? '#facc15' : '#f87171' }}>
              {completeness.total}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completeness.total}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00E4F2, #D12BF2)' }}
            />
          </div>
          {completeness.total < 100 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {completeness.items.filter((i) => !i.done).map((item) => (
                <span key={item.label} className="text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-lg">
                  {item.label}
                </span>
              ))}
            </div>
          )}
          {completeness.total === 100 && (
            <p className="text-xs text-green-400 mt-2">Perfil completo! Seu cartão está pronto.</p>
          )}
        </motion.div>

        {/* Template suggestion (when profile is mostly empty) */}
        {completeness.total < 30 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card p-5 border-brand-cyan/20 cursor-pointer hover:border-brand-cyan/40 transition-all"
            onClick={() => setShowTemplatePicker(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-brand-cyan">Comece com um template</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  Escolha um template por profissao e personalize depois
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Super Admin quick access */}
        {isAdmin && (
          <motion.a
            href="/admin"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-400 text-sm">Painel Super Admin</h3>
              <p className="text-xs text-white/40 mt-0.5">Gerenciar usuários, pagamentos e organizacoes da plataforma</p>
            </div>
            <ExternalLink size={16} className="text-amber-400 shrink-0" />
          </motion.a>
        )}

        {/* Org dashboards quick access */}
        {organizations.filter(o => o.role === 'OWNER' || o.role === 'ADMIN').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-2"
          >
            {organizations.filter(o => o.role === 'OWNER' || o.role === 'ADMIN').map((org) => (
              <a
                key={org.id}
                href={`/org/${org.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-purple-400 text-sm">{org.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Dashboard da organização · {org.role === 'OWNER' ? 'Proprietario' : 'Admin'}
                    {org.brandingActive && ' · Branding ativo'}
                  </p>
                </div>
                <ExternalLink size={16} className="text-purple-400 shrink-0" />
              </a>
            ))}
          </motion.div>
        )}

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
                    <span><strong className="text-white">{profile.viewCount}</strong> visualizações</span>
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
                    <h3 className="font-bold text-lg">Desbloqueie seu cartão</h3>
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
                    <p className="text-xs text-white/40 mb-1">Seu cartão está no ar!</p>
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
                    className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-4"
                  >
                    <CustomQrCode
                      url={cardUrl}
                      fgColor={qrSettings.fgColor}
                      bgColor={qrSettings.bgColor}
                      logoUrl={qrSettings.showLogo ? (resolvePhotoUrl(profile?.photoUrl) || null) : null}
                      showLogo={qrSettings.showLogo}
                      frameText={qrSettings.frameText}
                      size={200}
                    />

                    {/* QR Customization Controls */}
                    <div className="w-full grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Cor QR</span>
                        <div className="flex items-center gap-2">
                          <input type="color" value={qrSettings.fgColor} onChange={(e) => setQrSettings((s) => ({ ...s, fgColor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                          <span className="text-xs text-white/50 font-mono">{qrSettings.fgColor}</span>
                        </div>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Fundo</span>
                        <div className="flex items-center gap-2">
                          <input type="color" value={qrSettings.bgColor} onChange={(e) => setQrSettings((s) => ({ ...s, bgColor: e.target.value }))} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                          <span className="text-xs text-white/50 font-mono">{qrSettings.bgColor}</span>
                        </div>
                      </label>
                    </div>

                    <div className="w-full flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-white/60">
                        <input type="checkbox" checked={qrSettings.showLogo} onChange={(e) => setQrSettings((s) => ({ ...s, showLogo: e.target.checked }))} className="rounded" />
                        Mostrar logo no centro
                      </label>
                      <input
                        type="text"
                        placeholder="Texto da moldura (ex: Escaneie aqui)"
                        value={qrSettings.frameText}
                        onChange={(e) => setQrSettings((s) => ({ ...s, frameText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:border-brand-cyan/50 focus:outline-none"
                        maxLength={30}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PWA Install Banner */}
        <AnimatePresence>
          {canInstall && !pwaDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 relative overflow-hidden rounded-2xl border border-brand-cyan/20"
            >
              <div className="absolute inset-0 gradient-bg opacity-5" />
              <div className="relative p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0">
                    <Smartphone size={20} className="text-brand-cyan" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Instalar no celular</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      Adicione o CraftCard na tela inicial para acesso rápido
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPwaDismissed(true)}
                    className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    Agora nao
                  </button>
                  <button
                    type="button"
                    onClick={installPwa}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    <Download size={14} />
                    Instalar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Installed PWA Badge */}
        {isInstalled && (
          <div className="mb-8 flex items-center gap-2 text-xs text-green-400 bg-green-500/5 border border-green-500/10 rounded-xl px-4 py-2.5 w-fit">
            <Smartphone size={14} />
            App instalado no dispositivo
          </div>
        )}

        {/* Push Notifications */}
        {pushNotifications.isSupported && hasPaid && (
          <div className="mb-8 flex items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Mail size={14} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Notificacoes Push</p>
                <p className="text-[10px] text-white/40">Receba alertas de novas mensagens e agendamentos</p>
              </div>
            </div>
            <button
              type="button"
              disabled={pushNotifications.loading}
              onClick={pushNotifications.isSubscribed ? pushNotifications.unsubscribe : pushNotifications.subscribe}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pushNotifications.isSubscribed
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
              }`}
            >
              {pushNotifications.loading ? '...' : pushNotifications.isSubscribed ? 'Ativado' : 'Ativar'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8 items-start">
          {/* Editor Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            {/* Org membership banner */}
            {organizations.filter(o => o.brandingActive).map((org) => (
              <a
                key={org.id}
                href={`/org/${org.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={14} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">Membro de {org.name}</p>
                  <p className="text-white/30 text-xs">Branding corporativo ativo · {org.role}</p>
                </div>
                <ExternalLink size={14} className="text-purple-400 shrink-0" />
              </a>
            ))}

            {/* Photo Section */}
            <EditorSection icon={<Camera size={16} />} title="Foto de Perfil" defaultOpen>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl bg-brand-bg-card flex items-center justify-center overflow-hidden border-2 border-white/10 transition-all hover:border-brand-cyan/30"
                    style={
                      resolvePhotoUrl(profile?.photoUrl)
                        ? { backgroundImage: `url(${resolvePhotoUrl(profile?.photoUrl)}?v=${photoVersion})`, backgroundSize: 'cover', backgroundPosition: `center ${form.photoPositionY}%` }
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
              {profile?.photoUrl && (
                <div className="mt-4">
                  <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Posicao vertical</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.photoPositionY}
                    onChange={(e) => updateField('photoPositionY', Number(e.target.value))}
                    title="Posicao vertical da foto de perfil"
                    className="w-full accent-brand-cyan"
                  />
                  <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                    <span>Topo</span>
                    <span>Centro</span>
                    <span>Base</span>
                  </div>
                </div>
              )}
            </EditorSection>

            {/* Cover Photo Section */}
            <EditorSection icon={<Image size={16} />} title="Foto de Capa" defaultOpen>
              <div className="relative">
                {isOrgCoverLocked && (
                  <div className="absolute inset-0 z-10 bg-dark-card/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 p-6">
                    <Lock size={20} className="text-purple-400" />
                    <p className="text-white/60 text-xs text-center">A capa é definida pela organização <strong>{orgForProfile?.name}</strong></p>
                  </div>
                )}
                <div className="space-y-3">
                {profile?.coverPhotoUrl && (
                  <div
                    className="w-full h-24 rounded-xl bg-brand-bg-card overflow-hidden border border-white/10"
                    style={{
                      backgroundImage: `url(${resolvePhotoUrl(profile.coverPhotoUrl)}?v=${coverVersion})`,
                      backgroundSize: 'cover',
                      backgroundPosition: `center ${form.coverPositionY}%`,
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
                {profile?.coverPhotoUrl && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Posicao vertical</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.coverPositionY}
                      onChange={(e) => updateField('coverPositionY', Number(e.target.value))}
                      title="Posicao vertical da foto de capa"
                      className="w-full accent-brand-cyan"
                    />
                    <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                      <span>Topo</span>
                      <span>Centro</span>
                      <span>Base</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </EditorSection>

            {/* Basic Info */}
            <EditorSection icon={<User size={16} />} title="Informações Básicas" defaultOpen>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block uppercase tracking-wider">Nome exibido</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    maxLength={60}
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
                    placeholder="Conte um pouco sobre você..."
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
                      { value: 'available', label: 'Disponível', color: 'bg-green-500', ring: 'ring-green-500/30' },
                      { value: 'busy', label: 'Ocupado', color: 'bg-yellow-500', ring: 'ring-yellow-500/30' },
                      { value: 'unavailable', label: 'Indisponível', color: 'bg-red-500', ring: 'ring-red-500/30' },
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
            </EditorSection>

            {/* Social Links */}
            <EditorSection
              icon={<Link2 size={16} />}
              title="Links e Redes Sociais"
              badge={form.socialLinks.length > 0 ? <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">{form.socialLinks.length}</span> : undefined}
              defaultOpen
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-white/70">Redes Sociais</h3>
                  {form.socialLinks.filter(l => l.platform !== 'custom').length > 0 && (
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/50">
                      {form.socialLinks.filter(l => l.platform !== 'custom').length}
                    </span>
                  )}
                </div>
                {form.socialLinks.length >= planLimits.maxLinks ? (
                  <span className="text-xs text-white/30 px-3 py-1.5" title={`Máximo de ${planLimits.maxLinks} links no plano ${plan}`}>
                    {form.socialLinks.length}/{planLimits.maxLinks} links
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="flex items-center gap-1.5 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-brand-cyan/5"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className={`space-y-3 ${form.socialLinks.filter(l => l.platform !== 'custom').length > 3 ? 'max-h-[480px] overflow-y-auto pr-1 scrollbar-thin' : ''}`}>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={form.socialLinks.map((_, i) => i).filter(i => form.socialLinks[i].platform !== 'custom')}
                      strategy={form.linkLayout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
                    >
                      {form.socialLinks.map((link, i) => {
                        if (link.platform === 'custom') return null;
                        return (
                          <SortableLinkItem key={i} id={i} onRemove={() => removeSocialLink(i)}>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={link.platform}
                                onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
                                title="Plataforma"
                                className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/50 transition-all"
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
                                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                              />
                            </div>
                            <input
                              type={['map', 'header', 'pix', 'phone'].includes(link.platform) ? 'text' : 'url'}
                              value={link.url}
                              onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                              placeholder={link.platform === 'map' ? 'Ex: Av. Paulista, 1000 - Sao Paulo, SP' : SOCIAL_PLATFORMS.find((p) => p.value === link.platform)?.placeholder || 'https://...'}
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const links = [...form.socialLinks];
                                  const hasSchedule = links[i].startsAt || links[i].endsAt;
                                  links[i] = { ...links[i], startsAt: hasSchedule ? null : '', endsAt: hasSchedule ? null : '' };
                                  updateField('socialLinks', links);
                                }}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                                  link.startsAt || link.endsAt ? 'text-brand-cyan bg-brand-cyan/10' : 'text-white/30 hover:text-white/50 hover:bg-white/5'
                                }`}
                              >
                                <Calendar size={12} />
                                Agendamento
                              </button>
                              {link.platform !== 'header' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const meta = parseMetadata(link.metadata);
                                    const links = [...form.socialLinks];
                                    links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, '_showAppearance', meta._showAppearance === '1' ? '0' : '1') };
                                    updateField('socialLinks', links);
                                  }}
                                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                                    parseMetadata(link.metadata).buttonShape || parseMetadata(link.metadata).buttonTexture || (parseMetadata(link.metadata).buttonSkinUrl && parseMetadata(link.metadata).buttonSkinUrl !== 'none')
                                      ? 'text-purple-400 bg-purple-400/10'
                                      : 'text-white/30 hover:text-white/50 hover:bg-white/5'
                                  }`}
                                >
                                  <Paintbrush size={12} />
                                  Aparencia
                                </button>
                              )}
                            </div>
                            {/* Per-link Appearance Panel */}
                            {link.platform !== 'header' && parseMetadata(link.metadata)._showAppearance === '1' && (
                              <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Forma do Bloco</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BLOCK_SHAPES.map((shape) => {
                                      const currentShape = parseMetadata(link.metadata).buttonShape || 'default';
                                      return (
                                        <button
                                          key={shape.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonShape', shape.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={shape.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentShape === shape.value
                                              ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {shape.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Textura</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BLOCK_TEXTURES.map((tex) => {
                                      const currentTex = parseMetadata(link.metadata).buttonTexture || 'none';
                                      return (
                                        <button
                                          key={tex.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonTexture', tex.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={tex.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentTex === tex.value
                                              ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {tex.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Skin Premium</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BUTTON_SKINS.map((skin) => {
                                      const currentSkin = parseMetadata(link.metadata).buttonSkinUrl || 'none';
                                      return (
                                        <button
                                          key={skin.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonSkinUrl', skin.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={skin.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentSkin === skin.value
                                              ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {skin.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Texto</label>
                                  <div className="flex items-center gap-2">
                                    {/* Text color */}
                                    <input
                                      type="color"
                                      value={parseMetadata(link.metadata).textColor || '#ffffff'}
                                      title="Cor do texto"
                                      onChange={(e) => {
                                        const links = [...form.socialLinks];
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textColor', e.target.value) };
                                        updateField('socialLinks', links);
                                      }}
                                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                                    />
                                    {/* Bold */}
                                    <button
                                      type="button"
                                      title="Negrito"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textBold === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textBold', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[11px] font-bold transition-all ${
                                        parseMetadata(link.metadata).textBold === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      B
                                    </button>
                                    {/* Italic */}
                                    <button
                                      type="button"
                                      title="Itálico"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textItalic === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textItalic', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[11px] italic transition-all ${
                                        parseMetadata(link.metadata).textItalic === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      I
                                    </button>
                                    {/* Uppercase */}
                                    <button
                                      type="button"
                                      title="Maiúsculas"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textUppercase === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textUppercase', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[9px] font-bold transition-all ${
                                        parseMetadata(link.metadata).textUppercase === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      AA
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Grid Size Selector — only when layout is grid */}
                            {form.linkLayout === 'grid' && link.platform !== 'header' && (
                              <div className="flex items-center gap-1.5">
                                {GRID_SIZES.map((size) => {
                                  const current = getGridSize(link.metadata);
                                  const isSelected = current.value === size.value;
                                  return (
                                    <button
                                      key={size.value}
                                      type="button"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'gridSize', size.value) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`flex flex-col items-center gap-0.5 rounded-lg border-2 p-1.5 transition-all flex-1 ${
                                        isSelected
                                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan'
                                          : 'border-white/10 hover:border-white/20 text-white/40'
                                      }`}
                                    >
                                      <div
                                        className="rounded bg-current opacity-30"
                                        style={{ width: size.w, height: size.h }}
                                      />
                                      <span className="text-[9px] font-medium">{size.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {(link.startsAt !== null || link.endsAt !== null) && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-white/30 block mb-1">Inicio</label>
                                  <input
                                    type="datetime-local"
                                    title="Data de início"
                                    value={link.startsAt || ''}
                                    onChange={(e) => {
                                      const links = [...form.socialLinks];
                                      links[i] = { ...links[i], startsAt: e.target.value || null };
                                      updateField('socialLinks', links);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-cyan/50 transition-all"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-white/30 block mb-1">Fim</label>
                                  <input
                                    type="datetime-local"
                                    title="Data de fim"
                                    value={link.endsAt || ''}
                                    onChange={(e) => {
                                      const links = [...form.socialLinks];
                                      links[i] = { ...links[i], endsAt: e.target.value || null };
                                      updateField('socialLinks', links);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-cyan/50 transition-all"
                                  />
                                </div>
                              </div>
                            )}
                          </SortableLinkItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
                {form.socialLinks.filter(l => l.platform !== 'custom').length > 3 && (
                  <p className="text-xs text-white/30 text-center pt-1">Role para ver mais links</p>
                )}
                {form.socialLinks.filter(l => l.platform !== 'custom').length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <Link2 size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum link adicionado</p>
                    <p className="text-xs text-white/15 mt-1">Clique em "Adicionar" para começar</p>
                  </div>
                )}
              </div>

              {/* Custom Links (Link-in-bio) */}
              <div className="mt-6 pt-6 border-t border-white/10">
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
                {form.socialLinks.length >= planLimits.maxLinks ? (
                  <span className="text-xs text-white/30 px-3 py-1.5" title={`Máximo de ${planLimits.maxLinks} links no plano ${plan}`}>
                    {form.socialLinks.length}/{planLimits.maxLinks} links
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={addCustomLink}
                    className="flex items-center gap-1.5 text-sm text-brand-cyan hover:text-brand-cyan/80 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-brand-cyan/5"
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                )}
              </div>
              <p className="text-xs text-white/30 mb-4">Links exibidos como botões no seu cartão (estilo Linktree)</p>
              <div className="space-y-3">
                <div className={`space-y-3 ${form.socialLinks.filter(l => l.platform === 'custom').length > 3 ? 'max-h-[480px] overflow-y-auto pr-1 scrollbar-thin' : ''}`}>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={form.socialLinks.map((_, i) => i).filter(i => form.socialLinks[i].platform === 'custom')}
                      strategy={form.linkLayout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
                    >
                      {form.socialLinks.map((link, i) => {
                        if (link.platform !== 'custom') return null;
                        return (
                          <SortableLinkItem key={i} id={i} onRemove={() => removeSocialLink(i)}>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateSocialLink(i, 'label', e.target.value)}
                              placeholder="Título do link (ex: Meu Portfolio)"
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-brand-cyan/50 transition-all"
                            />
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const links = [...form.socialLinks];
                                  const hasSchedule = links[i].startsAt || links[i].endsAt;
                                  links[i] = { ...links[i], startsAt: hasSchedule ? null : '', endsAt: hasSchedule ? null : '' };
                                  updateField('socialLinks', links);
                                }}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                                  link.startsAt || link.endsAt ? 'text-brand-cyan bg-brand-cyan/10' : 'text-white/30 hover:text-white/50 hover:bg-white/5'
                                }`}
                              >
                                <Calendar size={12} />
                                Agendamento
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const meta = parseMetadata(link.metadata);
                                  const links = [...form.socialLinks];
                                  links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, '_showAppearance', meta._showAppearance === '1' ? '0' : '1') };
                                  updateField('socialLinks', links);
                                }}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                                  parseMetadata(link.metadata).buttonShape || parseMetadata(link.metadata).buttonTexture
                                    ? 'text-purple-400 bg-purple-400/10'
                                    : 'text-white/30 hover:text-white/50 hover:bg-white/5'
                                }`}
                              >
                                <Paintbrush size={12} />
                                Aparencia
                              </button>
                            </div>
                            {/* Per-link Appearance Panel — custom links */}
                            {parseMetadata(link.metadata)._showAppearance === '1' && (
                              <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Forma do Bloco</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BLOCK_SHAPES.map((shape) => {
                                      const currentShape = parseMetadata(link.metadata).buttonShape || 'default';
                                      return (
                                        <button
                                          key={shape.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonShape', shape.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={shape.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentShape === shape.value
                                              ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {shape.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Textura</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BLOCK_TEXTURES.map((tex) => {
                                      const currentTex = parseMetadata(link.metadata).buttonTexture || 'none';
                                      return (
                                        <button
                                          key={tex.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonTexture', tex.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={tex.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentTex === tex.value
                                              ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {tex.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Skin Premium</label>
                                  <div className="flex flex-wrap gap-1">
                                    {BUTTON_SKINS.map((skin) => {
                                      const currentSkin = parseMetadata(link.metadata).buttonSkinUrl || 'none';
                                      return (
                                        <button
                                          key={skin.value}
                                          type="button"
                                          onClick={() => {
                                            const links = [...form.socialLinks];
                                            links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'buttonSkinUrl', skin.value) };
                                            updateField('socialLinks', links);
                                          }}
                                          title={skin.desc}
                                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                            currentSkin === skin.value
                                              ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                                              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                          }`}
                                        >
                                          {skin.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-white/40 block mb-1.5 uppercase tracking-wider">Texto</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={parseMetadata(link.metadata).textColor || '#ffffff'}
                                      title="Cor do texto"
                                      onChange={(e) => {
                                        const links = [...form.socialLinks];
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textColor', e.target.value) };
                                        updateField('socialLinks', links);
                                      }}
                                      className="w-7 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                                    />
                                    <button
                                      type="button"
                                      title="Negrito"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textBold === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textBold', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[11px] font-bold transition-all ${
                                        parseMetadata(link.metadata).textBold === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      B
                                    </button>
                                    <button
                                      type="button"
                                      title="Itálico"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textItalic === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textItalic', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[11px] italic transition-all ${
                                        parseMetadata(link.metadata).textItalic === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      I
                                    </button>
                                    <button
                                      type="button"
                                      title="Maiúsculas"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        const cur = parseMetadata(links[i].metadata).textUppercase === '1' ? '0' : '1';
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'textUppercase', cur) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`w-7 h-7 rounded border text-[9px] font-bold transition-all ${
                                        parseMetadata(link.metadata).textUppercase === '1'
                                          ? 'border-purple-400 bg-purple-400/15 text-purple-300'
                                          : 'border-white/10 text-white/40 hover:border-white/20'
                                      }`}
                                    >
                                      AA
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Grid Size Selector — custom links */}
                            {form.linkLayout === 'grid' && (
                              <div className="flex items-center gap-1.5">
                                {GRID_SIZES.map((size) => {
                                  const current = getGridSize(link.metadata);
                                  const isSelected = current.value === size.value;
                                  return (
                                    <button
                                      key={size.value}
                                      type="button"
                                      onClick={() => {
                                        const links = [...form.socialLinks];
                                        links[i] = { ...links[i], metadata: setMetadataField(links[i].metadata, 'gridSize', size.value) };
                                        updateField('socialLinks', links);
                                      }}
                                      className={`flex flex-col items-center gap-0.5 rounded-lg border-2 p-1.5 transition-all flex-1 ${
                                        isSelected
                                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan'
                                          : 'border-white/10 hover:border-white/20 text-white/40'
                                      }`}
                                    >
                                      <div
                                        className="rounded bg-current opacity-30"
                                        style={{ width: size.w, height: size.h }}
                                      />
                                      <span className="text-[9px] font-medium">{size.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            {(link.startsAt !== null || link.endsAt !== null) && (
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-white/30 block mb-1">Inicio</label>
                                  <input
                                    type="datetime-local"
                                    title="Data de início"
                                    value={link.startsAt || ''}
                                    onChange={(e) => {
                                      const links = [...form.socialLinks];
                                      links[i] = { ...links[i], startsAt: e.target.value || null };
                                      updateField('socialLinks', links);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-cyan/50 transition-all"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-white/30 block mb-1">Fim</label>
                                  <input
                                    type="datetime-local"
                                    title="Data de fim"
                                    value={link.endsAt || ''}
                                    onChange={(e) => {
                                      const links = [...form.socialLinks];
                                      links[i] = { ...links[i], endsAt: e.target.value || null };
                                      updateField('socialLinks', links);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-brand-cyan/50 transition-all"
                                  />
                                </div>
                              </div>
                            )}
                          </SortableLinkItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
                {form.socialLinks.filter(l => l.platform === 'custom').length > 3 && (
                  <p className="text-xs text-white/30 text-center pt-1">Role para ver mais links</p>
                )}
                {form.socialLinks.filter(l => l.platform === 'custom').length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <ExternalLink size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum link personalizado</p>
                    <p className="text-xs text-white/15 mt-1">Adicione links para exibir como botões no cartão</p>
                  </div>
                )}
              </div>
              {form.socialLinks.length >= planLimits.maxLinks && (
                <div className="mt-4">
                  <UpgradeBanner compact />
                </div>
              )}
              </div>
            </EditorSection>

            {/* Resume */}
            <FeatureLock feature="resume">{(
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText size={16} className="text-green-400" />
                </div>
                <h3 className="font-semibold flex-1">Currículo</h3>
                <button
                  type="button"
                  onClick={() => updateField('resumeEnabled', !form.resumeEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.resumeEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                  title="Ativar/desativar currículo"
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.resumeEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {profile?.resumeUrl && (
                  <a
                    href={`${profile.resumeUrl}?v=${Date.now()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-cyan hover:underline flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-cyan/5"
                  >
                    <ExternalLink size={14} /> Ver currículo atual
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
            )}
            </FeatureLock>

            {/* Appearance */}
            <EditorSection icon={<Palette size={16} />} title="Tema do Cartão" defaultOpen={false}>
              <div className="relative">
                {isBrandingLocked && (
                  <div className="absolute inset-0 z-10 bg-dark-card/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-6">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Lock size={24} className="text-yellow-400" />
                    </div>
                    <p className="text-sm text-white/70 text-center max-w-xs">
                      Visual controlado pela organização. Contacte o administrador para alterar cores, tema ou fontes.
                    </p>
                  </div>
                )}
                <div className="space-y-5">
                {/* Card Theme */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-3 block uppercase tracking-wider">Tema do cartão</label>
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
                        <div className={`w-full h-8 rounded-lg mb-2 ${theme.preview || ''}`} style={theme.gradient ? { background: theme.gradient } : undefined} />
                        <span className="text-xs text-white/70">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-white/50 mb-3 block uppercase tracking-wider">Cor dos botões</label>
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
                      placeholder="meu-cartão"
                    />
                  </div>
                  {slugCheck && slugInput !== profile?.slug && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs mt-1.5 flex items-center gap-1 ${slugCheck.available ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {slugCheck.available ? <Check size={12} /> : <X size={12} />}
                      {slugCheck.available ? 'Disponível!' : 'Slug já em uso'}
                    </motion.p>
                  )}
                </div>
              </div>
              </div>
            </EditorSection>

            {/* Visual Customization (Pro+ only) */}
            {isBrandingLocked ? null : hasFeature('customFonts') ? (
              <EditorSection icon={<Paintbrush size={16} />} title="Visual" defaultOpen={false}>
                <StyleEditor
                  value={styleEditorValue}
                  onChange={handleStyleChange}
                  accent={form.buttonColor}
                  onUploadBackground={handleUploadBackground}
                  onDeleteBackground={handleDeleteBackground}
                  isUploadingBackground={uploadBackground.isPending}
                  backgroundLockedByOrg={isOrgBackgroundLocked ? orgForProfile?.name || null : null}
                />
              </EditorSection>
            ) : (
              <UpgradeBanner feature="customFonts" compact />
            )}

            {/* Analytics (PRO+) */}
            <FeatureLock feature="analytics">
            {analytics && (
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
                  <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Visualizações por dia</p>
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
                    <p className="text-sm text-white/30 text-center py-4">Nenhuma visualização ainda</p>
                  )}
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-white/20">30 dias atras</span>
                    <span className="text-[10px] text-white/20">Hoje</span>
                  </div>
                </div>

                {/* Link Clicks */}
                {analytics.linkClicks.length > 0 && (
                  <div className="mb-6">
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

                {/* Device Breakdown */}
                {analytics.deviceBreakdown && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Dispositivos</p>
                    <div className="flex gap-3">
                      {Object.entries(analytics.deviceBreakdown).filter(([, v]) => v > 0).map(([device, count]) => (
                        <div key={device} className="flex-1 bg-white/[0.03] rounded-xl p-3 text-center">
                          <Smartphone size={16} className="mx-auto text-brand-cyan/60 mb-1" />
                          <p className="text-white font-semibold text-sm">{count}</p>
                          <p className="text-white/30 text-[10px] capitalize">{device}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referrer Breakdown */}
                {analytics.referrerBreakdown && analytics.referrerBreakdown.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Origens de trafego</p>
                    <div className="space-y-2">
                      {analytics.referrerBreakdown.slice(0, 8).map((ref, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]">
                          <span className="text-white/70 capitalize">{ref.source}</span>
                          <span className="text-brand-cyan font-semibold">{ref.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Browser Breakdown */}
                {analytics.browserBreakdown && analytics.browserBreakdown.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Navegadores</p>
                    <div className="space-y-2">
                      {analytics.browserBreakdown.slice(0, 6).map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]">
                          <span className="text-white/70 capitalize">{b.browser}</span>
                          <span className="text-brand-cyan font-semibold">{b.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UTM Sources */}
                {analytics.utmBreakdown && analytics.utmBreakdown.sources.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Campanhas UTM</p>
                    <div className="space-y-2">
                      {analytics.utmBreakdown.sources.map((u, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]">
                          <span className="text-white/70">{u.source}</span>
                          <span className="text-brand-cyan font-semibold">{u.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Breakdown */}
                {analytics.geoBreakdown && analytics.geoBreakdown.countries.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Paises</p>
                    <div className="space-y-2">
                      {analytics.geoBreakdown.countries.slice(0, 8).map((g, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/[0.03]">
                          <span className="text-white/70">{g.country}</span>
                          <span className="text-brand-cyan font-semibold">{g.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversion Funnel */}
                {analytics.conversionFunnel && analytics.conversionFunnel.views > 0 && (
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wider">Funil de conversao</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Visualizações', value: analytics.conversionFunnel.views },
                        { label: 'Cliques em links', value: analytics.conversionFunnel.clicks },
                        { label: 'Mensagens', value: analytics.conversionFunnel.messages },
                        { label: 'Agendamentos', value: analytics.conversionFunnel.bookings },
                      ].map((step, i) => {
                        const pct = analytics.conversionFunnel!.views > 0 ? (step.value / analytics.conversionFunnel!.views) * 100 : 0;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-white/50 text-xs w-28 text-right">{step.label}</span>
                            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-cyan/40 rounded-full transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
                            </div>
                            <span className="text-white text-xs w-10 font-semibold">{step.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Achievements / Badges */}
            {achievements && achievements.length > 0 && (
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star size={16} className="text-yellow-400" />
                  </div>
                  <h3 className="font-semibold">Conquistas</h3>
                  <span className="text-xs text-white/30 ml-auto">
                    {achievements.filter((a) => a.unlocked).length}/{achievements.length}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {achievements.map((ach) => (
                    <div
                      key={ach.type}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all ${
                        ach.unlocked ? 'bg-white/5' : 'bg-white/[0.02] opacity-40'
                      }`}
                      title={`${ach.label}: ${ach.description}`}
                    >
                      <span className="text-xl">{ach.icon}</span>
                      <span className="text-[9px] text-white/50 leading-tight">{ach.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </FeatureLock>

            {/* Sharing Tools (PRO+) */}
            <FeatureLock feature="analytics">
            {profile && (
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Sparkles size={16} className="text-indigo-400" />
                  </div>
                  <h3 className="font-semibold">Ferramentas</h3>
                </div>
                <div className="space-y-6">
                  <EmailSignature
                    displayName={form.displayName}
                    bio={form.bio}
                    photoUrl={profile.photoUrl}
                    slug={slugInput || profile.slug}
                    buttonColor={form.buttonColor}
                    socialLinks={form.socialLinks}
                  />
                  <div className="border-t border-white/10 pt-5">
                    <WidgetCodeGenerator slug={slugInput || profile.slug} />
                  </div>
                </div>
              </div>
            )}
            </FeatureLock>

            {/* Messages / Leads Inbox (PRO+) */}
            <FeatureLock feature="contacts">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <MessageSquare size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Leads & Mensagens</h3>
                      <p className="text-xs text-white/30">{contacts?.length || 0} contatos recebidos</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('contactFormEnabled', !form.contactFormEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.contactFormEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                      title="Ativar/desativar formulário de contato"
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.contactFormEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                    {contacts && contacts.filter((m) => !m.isRead).length > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                        {contacts.filter((m) => !m.isRead).length} nova{contacts.filter((m) => !m.isRead).length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMessages.size > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Excluir ${selectedMessages.size} mensagen${selectedMessages.size > 1 ? 's' : ''}?`)) {
                            deleteBulk.mutate([...selectedMessages], { onSuccess: () => setSelectedMessages(new Set()) });
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={12} />
                        Excluir ({selectedMessages.size})
                      </button>
                    )}
                    {contacts && contacts.length > 0 && (
                      <a
                        href={`${API_URL}/contacts/me/export`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-white/50 rounded-lg text-xs hover:bg-white/10 transition-colors"
                      >
                        <Download size={12} />
                        CSV
                      </a>
                    )}
                  </div>
                </div>

                {contacts && contacts.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {contacts.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          expandedMessage === msg.id
                            ? 'bg-brand-cyan/8 border-brand-cyan/30 shadow-lg shadow-brand-cyan/5'
                            : !msg.isRead
                              ? 'bg-brand-cyan/5 border-brand-cyan/20'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedMessages.has(msg.id)}
                            onChange={(e) => {
                              const next = new Set(selectedMessages);
                              if (e.target.checked) next.add(msg.id); else next.delete(msg.id);
                              setSelectedMessages(next);
                            }}
                            className="mt-2.5 w-4 h-4 rounded border-white/20 bg-white/5 text-brand-cyan focus:ring-brand-cyan/50 cursor-pointer shrink-0"
                            title="Selecionar mensagem"
                          />
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cyan/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-brand-cyan shrink-0">
                            {(msg.senderName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-semibold text-white truncate">{msg.senderName}</span>
                                {!msg.isRead && <div className="w-2 h-2 rounded-full bg-brand-cyan shrink-0" />}
                              </div>
                              <span className="text-[10px] text-white/20 shrink-0">
                                {new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {msg.senderEmail && (
                              <p className="text-xs text-white/40 mt-0.5 truncate">{msg.senderEmail}</p>
                            )}
                            {expandedMessage === msg.id ? (
                              <p className="text-sm text-white/60 mt-2 whitespace-pre-wrap">{msg.message}</p>
                            ) : (
                              <p className="text-sm text-white/40 mt-1 truncate">{msg.message}</p>
                            )}
                            {/* Action buttons */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedMessage(expandedMessage === msg.id ? null : msg.id)}
                                className="text-xs text-white/30 hover:text-white/60 transition-colors"
                              >
                                {expandedMessage === msg.id ? 'Recolher' : 'Ver mais'}
                              </button>
                              {msg.senderEmail && (
                                <a
                                  href={`mailto:${msg.senderEmail}?subject=Re: Mensagem via CraftCard`}
                                  className="text-xs text-brand-cyan/60 hover:text-brand-cyan transition-colors flex items-center gap-1"
                                >
                                  <Mail size={10} />
                                  Responder
                                </a>
                              )}
                              {!msg.isRead && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead.mutate(msg.id)}
                                  className="text-xs text-green-400/50 hover:text-green-400 transition-colors flex items-center gap-1"
                                >
                                  <Check size={10} />
                                  Lida
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => { if (confirm('Excluir esta mensagem?')) deleteMessage.mutate(msg.id); }}
                                className="text-xs text-red-400/40 hover:text-red-400 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={10} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <MessageSquare size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum lead ainda</p>
                    <p className="text-xs text-white/15 mt-1">Quando alguém enviar uma mensagem pelo seu cartão, ela aparecerá aqui</p>
                  </div>
                )}
              </div>
            )}
            </FeatureLock>

            {/* Gallery (PRO+) */}
            <FeatureLock feature="gallery">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Camera size={16} className="text-purple-400" />
                  </div>
                  <h3 className="font-semibold flex-1">Galeria / Portfolio</h3>
                  <span className="text-xs text-white/30">{galleryImages?.length || 0}/12</span>
                  <button
                    type="button"
                    onClick={() => updateField('galleryEnabled', !form.galleryEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.galleryEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
                    title="Ativar/desativar galeria"
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.galleryEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Gallery Grid */}
                {galleryImages && galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img
                          src={img.imageUrl || (img.imageData ? `data:image/webp;base64,${img.imageData}` : '')}
                          alt={img.caption || 'Galeria'}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          title="Remover imagem"
                          onClick={() => deleteGalleryImage.mutate(img.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} className="text-white" />
                        </button>
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1 py-0.5">
                            <p className="text-[9px] text-white/70 truncate">{img.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  title="Selecionar imagem"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadGalleryImage.mutate({ file });
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={(galleryImages?.length || 0) >= 12 || uploadGalleryImage.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  {uploadGalleryImage.isPending ? 'Enviando...' : 'Adicionar Imagem'}
                </button>
              </div>
            )}
            </FeatureLock>

            {/* Services (PRO+) */}
            <FeatureLock feature="services">
              <ServicesEditor enabled={form.servicesEnabled} onToggle={() => updateField('servicesEnabled', !form.servicesEnabled)} />
            </FeatureLock>

            {/* FAQ (PRO+) */}
            <FeatureLock feature="faq">
              <FaqEditor enabled={form.faqEnabled} onToggle={() => updateField('faqEnabled', !form.faqEnabled)} />
            </FeatureLock>

            {/* Connections toggle */}
            <div className="glass-card p-6 hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Conexões</h3>
                    <p className="text-[11px] text-white/40">Mostrar perfis conectados no seu cartão</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="Habilitar conexões"
                    checked={form.connectionsEnabled}
                    onChange={() => updateField('connectionsEnabled', !form.connectionsEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-brand-cyan/60 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <a href="/connections" className="mt-3 flex items-center gap-1 text-xs text-brand-cyan hover:underline">
                Gerenciar conexões →
              </a>
            </div>

            {/* Organization links */}
            {(organizations.length > 0 || plan === 'BUSINESS' || plan === 'ENTERPRISE') && (
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserPlus size={16} className="text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">Organizacoes</h3>
                </div>
                <div className="space-y-2">
                  {organizations.map((org) => {
                    const isAdmin = org.role === 'ADMIN' || org.role === 'OWNER';
                    const Wrapper = isAdmin ? 'a' : 'div';
                    return (
                      <Wrapper
                        key={org.id}
                        {...(isAdmin ? { href: `/org/${org.id}` } : {})}
                        className={`group flex items-center justify-between px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 transition-all ${isAdmin ? 'hover:bg-purple-500/20 hover:border-purple-500/30 cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <UserPlus size={14} className="text-purple-400" />
                          </div>
                          <div>
                            <span className="text-white text-sm font-medium">{org.name}</span>
                            <span className="block text-white/30 text-xs">{org.role}</span>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Gerenciar
                            </span>
                            <ExternalLink size={14} className="text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </Wrapper>
                    );
                  })}
                  {(plan === 'BUSINESS' || plan === 'ENTERPRISE') && (
                    <>
                      {!showCreateOrg ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateOrg(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 text-white/50 text-sm hover:bg-white/5 hover:text-white/70 transition-colors"
                        >
                          <UserPlus size={14} />
                          Criar organização
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            placeholder="Nome da organização"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!newOrgName.trim()) return;
                                const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                await createOrg.mutateAsync({ name: newOrgName.trim(), slug });
                                setNewOrgName('');
                                setShowCreateOrg(false);
                                refreshAuth();
                              }}
                              disabled={createOrg.isPending || !newOrgName.trim()}
                              className="flex-1 px-4 py-2 rounded-xl bg-brand-cyan text-black text-sm font-semibold hover:bg-brand-cyan/90 transition-colors disabled:opacity-50"
                            >
                              {createOrg.isPending ? '...' : 'Criar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowCreateOrg(false); setNewOrgName(''); }}
                              className="px-4 py-2 rounded-xl bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Video Intro (PRO+) */}
            <FeatureLock feature="video">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <Video size={16} className="text-pink-400" />
                  </div>
                  <h3 className="font-semibold">Video Intro</h3>
                  <span className="text-xs text-white/30 ml-auto">Max 15s, 20MB</span>
                </div>

                {profile?.videoUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <video
                      src={profile.videoUrl}
                      controls
                      className="w-full max-h-48 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => updateProfile.mutate({ videoUrl: null })}
                      className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={12} />
                      Remover video
                    </button>
                  </div>
                )}

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4"
                  title="Selecionar video"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadVideo.mutate(file);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadVideo.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Upload size={16} />
                  {uploadVideo.isPending ? 'Enviando...' : 'Enviar Video MP4'}
                </button>
              </div>
            )}
            </FeatureLock>

            {/* Lead Capture (PRO+) */}
            <FeatureLock feature="contacts">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <UserPlus size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Captura de Leads</h3>
                    <p className="text-xs text-white/40 mt-0.5">Visitantes preenchem nome e email antes de ver o cartão</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('leadCaptureEnabled', !form.leadCaptureEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.leadCaptureEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                    title="Ativar captura de leads"
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.leadCaptureEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            )}
            </FeatureLock>

            {/* Bookings / Scheduling (PRO+) */}
            <FeatureLock feature="bookings">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Agendamento</h3>
                    <p className="text-xs text-white/40 mt-0.5">Ative para visitantes agendarem reunioes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField('bookingEnabled', !form.bookingEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.bookingEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                    title="Ativar agendamento"
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.bookingEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Google Calendar Integration */}
                <GoogleCalendarCard />

                {/* Quick Slot Config */}
                <div className="space-y-3 mb-4">
                  <p className="text-xs text-white/40">Configure seus horários disponíveis. Visitantes poderão agendar reuniões.</p>
                  {[
                    { label: 'Seg', dayOfWeek: 1 },
                    { label: 'Ter', dayOfWeek: 2 },
                    { label: 'Qua', dayOfWeek: 3 },
                    { label: 'Qui', dayOfWeek: 4 },
                    { label: 'Sex', dayOfWeek: 5 },
                    { label: 'Sáb', dayOfWeek: 6 },
                    { label: 'Dom', dayOfWeek: 0 },
                  ].map(({ label, dayOfWeek }) => {
                    const slot = mySlots?.find((s) => s.dayOfWeek === dayOfWeek);
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const hasSlot = !!slot;
                    const enabledId = `day-enabled-${dayOfWeek}`;
                    return (
                      <div key={dayOfWeek} className="flex items-center gap-2 text-sm">
                        {isWeekend ? (
                          <label htmlFor={enabledId} className="flex items-center gap-1.5 w-12 shrink-0 cursor-pointer" title={`Ativar ${label}`}>
                            <input
                              type="checkbox"
                              id={enabledId}
                              defaultChecked={hasSlot}
                              data-day-toggle={dayOfWeek}
                              onChange={(e) => {
                                const row = e.target.closest('div')?.querySelectorAll<HTMLInputElement>('[data-field]');
                                row?.forEach(el => { el.disabled = !e.target.checked; el.style.opacity = e.target.checked ? '1' : '0.3'; });
                              }}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 cursor-pointer shrink-0"
                            />
                            <span className="text-white/40 text-xs">{label}</span>
                          </label>
                        ) : (
                          <span className="w-12 shrink-0 text-white/50">{label}</span>
                        )}
                        <input
                          type="time"
                          title={`Início ${label}`}
                          defaultValue={slot?.startTime || '09:00'}
                          disabled={isWeekend && !hasSlot}
                          style={{ opacity: isWeekend && !hasSlot ? 0.3 : 1 }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs [color-scheme:dark]"
                          data-day={dayOfWeek}
                          data-field="start"
                        />
                        <span className="text-white/30">-</span>
                        <input
                          type="time"
                          title={`Fim ${label}`}
                          defaultValue={slot?.endTime || '17:00'}
                          disabled={isWeekend && !hasSlot}
                          style={{ opacity: isWeekend && !hasSlot ? 0.3 : 1 }}
                          className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs [color-scheme:dark]"
                          data-day={dayOfWeek}
                          data-field="end"
                        />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; duration: number }> = [];
                      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
                        const isWeekend = d === 0 || d === 6;
                        const toggle = document.querySelector<HTMLInputElement>(`[data-day-toggle="${d}"]`);
                        // Weekend: only save if checkbox is checked
                        if (isWeekend && toggle && !toggle.checked) continue;
                        const startEl = document.querySelector<HTMLInputElement>(`[data-day="${d}"][data-field="start"]`);
                        const endEl = document.querySelector<HTMLInputElement>(`[data-day="${d}"][data-field="end"]`);
                        if (startEl?.value && endEl?.value && startEl.value < endEl.value) {
                          slots.push({ dayOfWeek: d, startTime: startEl.value, endTime: endEl.value, duration: 30 });
                        }
                      }
                      saveSlots.mutate(slots);
                    }}
                    disabled={saveSlots.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-all disabled:opacity-40"
                  >
                    <Save size={14} />
                    {saveSlots.isPending ? 'Salvando...' : 'Salvar Horários'}
                  </button>
                </div>

                {/* Bookings List */}
                {myBookings && myBookings.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-white/40 mb-3">Agendamentos recentes</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {myBookings.slice(0, 15).map((b) => {
                        const isPast = new Date(b.date) < new Date(new Date().toDateString());
                        return (
                        <div key={b.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${isPast ? 'bg-white/[0.02] opacity-50' : 'bg-white/5'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{b.name}</p>
                            <p className="text-white/40">
                              {new Date(b.date).toLocaleDateString('pt-BR')} às {b.time}
                              {isPast && <span className="ml-1 text-white/20">(passado)</span>}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                            b.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                            b.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {b.status === 'confirmed' ? 'Confirmado' : b.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                          </span>
                          {b.status === 'pending' && !isPast && (
                            <div className="flex gap-1 shrink-0">
                              <button
                                type="button"
                                title="Confirmar (sincroniza com Google Calendar)"
                                onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'confirmed' })}
                                className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                title="Cancelar"
                                onClick={() => updateBookingStatus.mutate({ id: b.id, status: 'cancelled' })}
                                className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            title="Excluir agendamento"
                            onClick={() => { if (confirm('Excluir este agendamento?')) deleteBooking.mutate(b.id); }}
                            className="w-6 h-6 rounded-full hover:bg-red-500/10 flex items-center justify-center text-white/20 hover:text-red-400 transition shrink-0"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            </FeatureLock>

            {/* Testimonials (PRO+) */}
            <FeatureLock feature="testimonials">{(
              <div className="glass-card p-6 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Star size={16} className="text-yellow-400" />
                  </div>
                  <h3 className="font-semibold flex-1">Depoimentos</h3>
                  <button
                    type="button"
                    onClick={() => updateField('testimonialsEnabled', !form.testimonialsEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.testimonialsEnabled ? 'bg-yellow-500' : 'bg-white/10'}`}
                    title="Ativar/desativar depoimentos"
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.testimonialsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                  {testimonials && testimonials.filter((t) => !t.isApproved).length > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                      {testimonials.filter((t) => !t.isApproved).length} pendente{testimonials.filter((t) => !t.isApproved).length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {testimonials && testimonials.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border transition-all ${
                          t.isApproved ? 'bg-white/[0.02] border-white/5' : 'bg-yellow-500/5 border-yellow-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{t.authorName}</span>
                              {t.authorRole && <span className="text-xs text-white/30">· {t.authorRole}</span>}
                              {t.isApproved ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Aprovado</span>
                              ) : (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">Pendente</span>
                              )}
                            </div>
                            <p className="text-sm text-white/50 mt-1 italic">"{t.text}"</p>
                            <p className="text-xs text-white/20 mt-1">
                              {new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!t.isApproved && (
                              <button
                                type="button"
                                onClick={() => approveTestimonial.mutate(t.id)}
                                title="Aprovar depoimento"
                                className="p-1.5 rounded-lg text-white/30 hover:text-green-400 hover:bg-green-400/10 transition-all"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => rejectTestimonial.mutate(t.id)}
                              title="Remover depoimento"
                              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <Star size={24} className="mx-auto text-white/15 mb-2" />
                    <p className="text-sm text-white/30">Nenhum depoimento ainda</p>
                    <p className="text-xs text-white/15 mt-1">Quando alguém deixar um depoimento no seu cartão, ele aparecerá aqui</p>
                  </div>
                )}
              </div>
            )}
            </FeatureLock>

            {/* Actions Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card overflow-hidden sticky bottom-4"
            >
              {/* Linha gradiente decorativa no topo da barra */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="p-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { triggerAutoSave.cancel(); handleSave(); }} // SG-8: cancela debounce pendente antes do save manual
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
              </div>
            </motion.div>
          </motion.div>

          {/* Live Preview — no motion.div (transform breaks sticky) */}
          <div className="sticky top-6 self-start hidden lg:block">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={16} className="text-white/40" />
              <h3 className="font-semibold text-white/60">Preview Mobile</h3>
            </div>
            <MobilePreview accentColor={form.buttonColor}>
              <CardPreview
                displayName={form.displayName}
                bio={form.bio}
                photoUrl={resolvePhotoUrl(profile?.photoUrl) ? `${resolvePhotoUrl(profile?.photoUrl)}?v=${photoVersion}` : undefined}
                coverPhotoUrl={resolvePhotoUrl(profile?.coverPhotoUrl) ? `${resolvePhotoUrl(profile?.coverPhotoUrl)}?v=${coverVersion}` : undefined}
                buttonColor={form.buttonColor}
                cardTheme={form.cardTheme}
                availabilityStatus={form.availabilityStatus || undefined}
                photoPositionY={form.photoPositionY}
                coverPositionY={form.coverPositionY}
                isVerified={hasPaid}
                fontFamily={form.fontFamily}
                fontSizeScale={form.fontSizeScale}
                backgroundType={form.backgroundType}
                backgroundGradient={form.backgroundGradient}
                backgroundImageUrl={form.backgroundImageUrl}
                backgroundOverlay={form.backgroundOverlay}
                backgroundPattern={form.backgroundPattern}
                linkLayout={form.linkLayout}
                linkStyle={form.linkStyle}
                linkAnimation={form.linkAnimation}
                iconStyle={form.iconStyle}
                iconPack={form.iconPack}
                socialLinks={form.socialLinks}
              />
            </MobilePreview>
          </div>
        </div>
      </div>

      <TemplatePicker
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onApply={applyTemplate}
      />
    </div>
  );
}

// --- Google Calendar Connection Card ---
function GoogleCalendarCard() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');

  useEffect(() => {
    api.get('/bookings/google/status')
      .then((data: unknown) => {
        setStatus((data as { connected: boolean }).connected ? 'connected' : 'disconnected');
      })
      .catch(() => setStatus('disconnected'));
  }, []);

  // Check if just returned from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'connected') {
      setStatus('connected');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const data: { url: string } = await api.get('/bookings/google/connect-url');
      window.location.href = data.url;
    } catch {
      // fallback
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Desconectar o Google Calendar?')) return;
    await api.delete('/bookings/google/disconnect');
    setStatus('disconnected');
  };

  return (
    <div className={`mb-4 p-3 rounded-xl border transition-all ${
      status === 'connected'
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-white/[0.03] border-white/5'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className={status === 'connected' ? 'text-emerald-400' : 'text-blue-400'} />
          <span className="text-xs text-white/60">Google Calendar</span>
          {status === 'connected' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
              ✓ Conectado
            </span>
          )}
        </div>
        {status === 'loading' ? (
          <span className="text-[10px] text-white/20">...</span>
        ) : status === 'connected' ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
          >
            Desconectar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            className="text-[10px] px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition"
          >
            Conectar
          </button>
        )}
      </div>
      <p className="text-[10px] text-white/30 mt-1">
        {status === 'connected'
          ? 'Novos agendamentos serão adicionados automaticamente ao seu Google Calendar com lembrete de 30 min.'
          : 'Conecte para sincronizar agendamentos automaticamente com seu Google Calendar.'
        }
      </p>
    </div>
  );
}
