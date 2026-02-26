export type PlanType = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanLimits {
  maxCards: number;
  maxLinks: number;
  maxThemes: number | 'all';
  canPublish: boolean;
  analytics: boolean;
  gallery: boolean;
  bookings: boolean;
  testimonials: boolean;
  contacts: boolean;
  services: boolean;
  faq: boolean;
  resume: boolean;
  video: boolean;
  watermark: boolean;
  customFonts: boolean;
  customBg: boolean;
  leadsExport: boolean;
  orgDashboard: boolean;
  branding: boolean;
  customDomain: boolean;
  webhooks: boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxCards: 1,
    maxLinks: 5,
    maxThemes: 3,
    canPublish: true,
    analytics: false,
    gallery: false,
    bookings: false,
    testimonials: false,
    contacts: false,
    services: false,
    faq: false,
    resume: false,
    video: false,
    watermark: true,
    customFonts: false,
    customBg: false,
    leadsExport: false,
    orgDashboard: false,
    branding: false,
    customDomain: false,
    webhooks: false,
  },
  PRO: {
    maxCards: 3,
    maxLinks: 20,
    maxThemes: 'all',
    canPublish: true,
    analytics: true,
    gallery: true,
    bookings: true,
    testimonials: true,
    contacts: true,
    services: true,
    faq: true,
    resume: true,
    video: true,
    watermark: false,
    customFonts: true,
    customBg: true,
    leadsExport: true,
    orgDashboard: false,
    branding: false,
    customDomain: false,
    webhooks: false,
  },
  BUSINESS: {
    maxCards: 1,
    maxLinks: 50,
    maxThemes: 'all',
    canPublish: true,
    analytics: true,
    gallery: true,
    bookings: true,
    testimonials: true,
    contacts: true,
    services: true,
    faq: true,
    resume: true,
    video: true,
    watermark: false,
    customFonts: true,
    customBg: true,
    leadsExport: true,
    orgDashboard: true,
    branding: true,
    customDomain: false,
    webhooks: true,
  },
  ENTERPRISE: {
    maxCards: 1,
    maxLinks: 50,
    maxThemes: 'all',
    canPublish: true,
    analytics: true,
    gallery: true,
    bookings: true,
    testimonials: true,
    contacts: true,
    services: true,
    faq: true,
    resume: true,
    video: true,
    watermark: false,
    customFonts: true,
    customBg: true,
    leadsExport: true,
    orgDashboard: true,
    branding: true,
    customDomain: true,
    webhooks: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as PlanType)] || PLAN_LIMITS.FREE;
}

export function hasFeature(plan: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  return true; // numeric/string limits are checked differently
}

/** List of themes available to free tier */
export const FREE_THEMES = ['default', 'gradient', 'minimal'];
