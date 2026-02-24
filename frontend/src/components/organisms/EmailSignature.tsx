import { useState, useCallback } from 'react';
import { Copy, Check, Mail, Sparkles, Briefcase, Palette } from 'lucide-react';
import { resolvePhotoUrl, APP_NAME } from '@/lib/constants';

type SignatureTemplate = 'minimal' | 'corporate' | 'colorful';

interface EmailSignatureProps {
  displayName: string;
  bio?: string | null;
  tagline?: string | null;
  photoUrl?: string | null;
  slug: string;
  buttonColor?: string;
  socialLinks?: Array<{ platform: string; label: string; url: string }>;
}

const TEMPLATES: Array<{ value: SignatureTemplate; label: string; icon: typeof Mail; desc: string }> = [
  { value: 'minimal', label: 'Minimalista', icon: Sparkles, desc: 'Limpo e elegante' },
  { value: 'corporate', label: 'Corporativo', icon: Briefcase, desc: 'Profissional' },
  { value: 'colorful', label: 'Colorido', icon: Palette, desc: 'Estilo CraftCard' },
];

function generateSignatureHtml(props: EmailSignatureProps, template: SignatureTemplate): string {
  const { displayName, bio, tagline, photoUrl, slug, buttonColor = '#00E4F2', socialLinks = [] } = props;
  const cardUrl = `${window.location.origin}/${slug}`;
  const resolvedPhoto = resolvePhotoUrl(photoUrl);
  const subtitle = (tagline || bio || '').slice(0, 80);

  const filteredSocials = socialLinks
    .filter((l) => l.url && !['header', 'pix'].includes(l.platform))
    .slice(0, 5);

  // Pill-badge style social links for light backgrounds
  const socialBadgesLight = filteredSocials
    .map(
      (l) =>
        `<a href="${l.url}" style="display:inline-block;padding:2px 10px;border-radius:10px;text-decoration:none;font-size:11px;font-weight:500;color:${buttonColor};background:#f0f0f0;margin-right:4px;margin-bottom:4px;line-height:18px;" target="_blank">${l.label}</a>`,
    )
    .join('');

  // Pill-badge style social links for dark backgrounds
  const socialBadgesDark = filteredSocials
    .map(
      (l) =>
        `<a href="${l.url}" style="display:inline-block;padding:2px 10px;border-radius:10px;text-decoration:none;font-size:11px;font-weight:500;color:${buttonColor};background:rgba(255,255,255,0.1);margin-right:4px;margin-bottom:4px;line-height:18px;" target="_blank">${l.label}</a>`,
    )
    .join('');

  const photoHtml = (size: number, radius: string, border = '') =>
    resolvedPhoto
      ? `<img src="${resolvedPhoto}" width="${size}" height="${size}" style="border-radius:${radius};display:block;object-fit:cover;${border}" alt="${displayName}" />`
      : '';

  if (template === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#333;max-width:420px;">
  <tr>
    <td style="padding:12px 0;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:14px;vertical-align:middle;">
            ${photoHtml(54, '50%')}
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a;line-height:1.3;">${displayName}</p>
            ${subtitle ? `<p style="margin:2px 0 0;font-size:12px;color:#888;line-height:1.4;">${subtitle}</p>` : ''}
            <p style="margin:6px 0 0;">
              <a href="${cardUrl}" style="font-size:12px;color:${buttonColor};text-decoration:none;font-weight:500;">Ver meu cartao digital &rarr;</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${socialBadgesLight ? `<tr><td style="border-top:1px solid #eee;padding:10px 0 0;"><div>${socialBadgesLight}</div></td></tr>` : ''}
</table>`;
  }

  if (template === 'corporate') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#333;max-width:480px;border-collapse:collapse;">
  <tr>
    <td style="padding:16px 0;border-top:3px solid ${buttonColor};">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:16px;vertical-align:top;">
            ${photoHtml(68, '8px')}
          </td>
          <td style="vertical-align:top;padding-left:16px;border-left:2px solid ${buttonColor};">
            <p style="margin:0;font-size:17px;font-weight:700;color:#111;line-height:1.2;">${displayName}</p>
            ${subtitle ? `<p style="margin:4px 0 0;font-size:13px;color:#555;line-height:1.4;">${subtitle}</p>` : ''}
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
              <tr>
                <td>
                  <a href="${cardUrl}" style="display:inline-block;background:${buttonColor};color:#ffffff;padding:8px 20px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.3px;">Ver Cartao Digital</a>
                </td>
              </tr>
            </table>
            ${socialBadgesLight ? `<div style="margin-top:10px;">${socialBadgesLight}</div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  // colorful
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,Helvetica,sans-serif;max-width:440px;border-collapse:collapse;">
  <tr>
    <td style="background:#1A1A2E;padding:20px;border-radius:12px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-right:16px;vertical-align:middle;">
            ${photoHtml(60, '50%', `border:2px solid ${buttonColor};`)}
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.3;">${displayName}</p>
            ${subtitle ? `<p style="margin:3px 0 0;font-size:12px;color:#999999;line-height:1.4;">${subtitle}</p>` : ''}
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
              <tr>
                <td>
                  <a href="${cardUrl}" style="display:inline-block;background:${buttonColor};color:#000000;padding:7px 18px;border-radius:20px;text-decoration:none;font-size:12px;font-weight:600;">Cartao Digital &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${socialBadgesDark ? `<tr><td colspan="2" style="padding-top:14px;"><div style="border-top:1px solid #2a2a4e;padding-top:10px;">${socialBadgesDark}</div></td></tr>` : ''}
        <tr>
          <td colspan="2" style="padding-top:10px;text-align:right;">
            <span style="font-size:9px;color:#555;">Feito com ${APP_NAME}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function EmailSignature(props: EmailSignatureProps) {
  const [template, setTemplate] = useState<SignatureTemplate>('minimal');
  const [copied, setCopied] = useState(false);

  const html = generateSignatureHtml(props, template);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const previewBg = template === 'colorful' ? 'bg-[#0f0f1e]' : 'bg-white';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Mail size={16} className="text-brand-cyan" />
        Assinatura de Email
      </div>

      {/* Template selector */}
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTemplate(t.value)}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${
                template === t.value
                  ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan'
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={14} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className={`p-5 rounded-xl border border-white/10 overflow-auto ${previewBg}`}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          copied
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'border border-white/10 text-white/70 hover:text-white hover:bg-white/5'
        }`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'HTML copiado!' : 'Copiar HTML da assinatura'}
      </button>

      <p className="text-[10px] text-white/30 text-center leading-relaxed">
        Cole o HTML nas configuracoes de assinatura do seu email (Gmail, Outlook, etc.)
      </p>
    </div>
  );
}
