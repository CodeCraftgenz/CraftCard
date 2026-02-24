import { useState, useCallback } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
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

const TEMPLATES: Array<{ value: SignatureTemplate; label: string }> = [
  { value: 'minimal', label: 'Minimalista' },
  { value: 'corporate', label: 'Corporativo' },
  { value: 'colorful', label: 'Colorido' },
];

function generateSignatureHtml(props: EmailSignatureProps, template: SignatureTemplate): string {
  const { displayName, bio, tagline, photoUrl, slug, buttonColor = '#00E4F2', socialLinks = [] } = props;
  const cardUrl = `${window.location.origin}/${slug}`;
  const resolvedPhoto = resolvePhotoUrl(photoUrl);
  const subtitle = tagline || bio || '';

  const socialIcons = socialLinks
    .filter((l) => l.url && !['header', 'pix'].includes(l.platform))
    .slice(0, 5)
    .map(
      (l) =>
        `<a href="${l.url}" style="color:${buttonColor};text-decoration:none;margin-right:8px;font-size:12px;" target="_blank">${l.label}</a>`,
    )
    .join('');

  if (template === 'minimal') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      ${resolvedPhoto ? `<img src="${resolvedPhoto}" width="60" height="60" style="border-radius:50%;object-fit:cover;" alt="${displayName}" />` : ''}
    </td>
    <td style="vertical-align:top;">
      <strong style="font-size:16px;color:#111;">${displayName}</strong><br/>
      ${subtitle ? `<span style="font-size:12px;color:#666;">${subtitle.slice(0, 80)}</span><br/>` : ''}
      <a href="${cardUrl}" style="color:${buttonColor};text-decoration:none;font-size:12px;">Meu cartao digital</a>
      ${socialIcons ? `<br/><div style="margin-top:4px;">${socialIcons}</div>` : ''}
    </td>
  </tr>
</table>`;
  }

  if (template === 'corporate') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#333;border-top:3px solid ${buttonColor};padding-top:12px;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      ${resolvedPhoto ? `<img src="${resolvedPhoto}" width="70" height="70" style="border-radius:8px;object-fit:cover;" alt="${displayName}" />` : ''}
    </td>
    <td style="vertical-align:top;border-left:2px solid ${buttonColor};padding-left:16px;">
      <strong style="font-size:16px;color:#111;">${displayName}</strong><br/>
      ${subtitle ? `<span style="font-size:12px;color:#555;">${subtitle.slice(0, 80)}</span><br/>` : ''}
      <div style="margin-top:8px;">
        <a href="${cardUrl}" style="display:inline-block;background:${buttonColor};color:#fff;padding:6px 14px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:bold;">Ver Cartao Digital</a>
      </div>
      ${socialIcons ? `<div style="margin-top:6px;">${socialIcons}</div>` : ''}
    </td>
  </tr>
</table>`;
  }

  // colorful
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;color:#fff;background:linear-gradient(135deg,#1A1A2E,#16213E);border-radius:12px;padding:16px;">
  <tr>
    <td style="padding-right:16px;vertical-align:top;">
      ${resolvedPhoto ? `<img src="${resolvedPhoto}" width="70" height="70" style="border-radius:50%;object-fit:cover;border:2px solid ${buttonColor};" alt="${displayName}" />` : ''}
    </td>
    <td style="vertical-align:top;">
      <strong style="font-size:16px;color:#fff;">${displayName}</strong><br/>
      ${subtitle ? `<span style="font-size:12px;color:rgba(255,255,255,0.7);">${subtitle.slice(0, 80)}</span><br/>` : ''}
      <div style="margin-top:8px;">
        <a href="${cardUrl}" style="display:inline-block;background:${buttonColor};color:#fff;padding:6px 14px;border-radius:20px;text-decoration:none;font-size:12px;font-weight:bold;">Cartao Digital &#x2192;</a>
      </div>
      ${socialIcons ? `<div style="margin-top:6px;">${socialIcons.replace(/color:[^;]+;/g, 'color:' + buttonColor + ';')}</div>` : ''}
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top:8px;text-align:right;">
      <span style="font-size:10px;color:rgba(255,255,255,0.3);">Feito com ${APP_NAME}</span>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Mail size={16} className="text-brand-cyan" />
        Assinatura de Email
      </div>

      {/* Template selector */}
      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTemplate(t.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
              template === t.value
                ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan'
                : 'border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="p-4 rounded-xl bg-white border border-white/10 overflow-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        {copied ? 'HTML Copiado!' : 'Copiar HTML da Assinatura'}
      </button>

      <p className="text-[10px] text-white/30 text-center">
        Cole o HTML nas configuracoes de assinatura do seu email (Gmail, Outlook, etc.)
      </p>
    </div>
  );
}
