import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle, Building2 } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { usePreviewInvite, useAcceptInvite } from '@/hooks/useOrganization';
import { useAuth } from '@/providers/AuthProvider';

export function OrgJoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const { data: preview, isLoading: previewLoading, error: previewError } = usePreviewInvite(token);
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<'preview' | 'accepting' | 'success' | 'error'>('preview');
  const [orgName, setOrgName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEmailMismatch, setIsEmailMismatch] = useState(false);

  const previewData = preview as any;
  const previewErr = previewError as any;
  const previewErrMsg = previewErr?.response?.data?.message || previewErr?.message || '';

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');
    try {
      const res: any = await acceptInvite.mutateAsync(token);
      const result = res?.data ?? res;
      setStatus('success');
      setOrgName(result.organization?.name || previewData?.orgName || '');
      await refreshAuth();
      setTimeout(() => {
        navigate(result.organization ? `/org/${result.organization.id}` : '/editor');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      const msg = err?.response?.data?.message || err?.message || 'Erro ao aceitar convite';
      setErrorMsg(msg);
      if (msg.includes('outro email') || msg.includes('forbidden')) {
        setIsEmailMismatch(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center max-w-md w-full"
        >
          {/* Loading preview */}
          {previewLoading && status === 'preview' && (
            <div className="animate-pulse text-white/50">Verificando convite...</div>
          )}

          {/* Preview error (invite not found, expired, etc.) */}
          {previewError && status === 'preview' && (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="text-red-400" size={24} />
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">Convite invalido</h2>
              <p className="text-white/50 text-sm mb-4">{previewErrMsg || 'Convite nao encontrado'}</p>
              <button
                type="button"
                onClick={() => navigate('/editor')}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors"
              >
                Voltar ao editor
              </button>
            </>
          )}

          {/* Preview loaded — show invite info and accept button */}
          {previewData && status === 'preview' && (
            <>
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {previewData.orgLogoUrl ? (
                  <img src={previewData.orgLogoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <Building2 className="text-purple-400" size={28} />
                )}
              </div>
              <h2 className="text-white text-lg font-semibold mb-1">Voce foi convidado!</h2>
              <p className="text-white/50 text-sm mb-4">
                Para fazer parte da organizacao
              </p>
              <div className="bg-white/5 border border-purple-500/20 rounded-xl p-4 mb-4">
                <p className="text-white font-bold text-lg">{previewData.orgName}</p>
                <p className="text-white/40 text-xs mt-1">
                  Cargo: <span className="text-purple-400 font-medium">{previewData.role}</span>
                </p>
              </div>
              <p className="text-white/30 text-xs mb-4">
                Convite enviado para <strong className="text-white/50">{previewData.email}</strong>
              </p>
              {user && user.email.toLowerCase() !== previewData.email?.toLowerCase() && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 justify-center">
                    <AlertTriangle size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-medium">Email diferente</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    Voce esta logado como <strong className="text-brand-cyan">{user.email}</strong>.
                    O convite foi enviado para outro email.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="mt-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors"
                  >
                    Trocar conta
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleAccept}
                className="w-full px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: previewData.orgColor || '#8B5CF6' }}
              >
                Aceitar Convite
              </button>
            </>
          )}

          {/* Accepting */}
          {status === 'accepting' && (
            <div className="animate-pulse text-white/50">Aceitando convite...</div>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-400" size={24} />
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">Convite aceito!</h2>
              <p className="text-white/50 text-sm">
                Voce agora e membro de <strong className="text-white">{orgName}</strong>. Redirecionando...
              </p>
            </>
          )}

          {/* Accept error */}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {isEmailMismatch ? (
                  <AlertTriangle className="text-yellow-400" size={24} />
                ) : (
                  <X className="text-red-400" size={24} />
                )}
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">
                {isEmailMismatch ? 'Email incorreto' : 'Erro'}
              </h2>
              <p className="text-white/50 text-sm mb-2">{errorMsg}</p>
              {isEmailMismatch && user && (
                <p className="text-white/40 text-xs mb-4">
                  Voce esta logado como <strong className="text-brand-cyan">{user.email}</strong>.
                  Faca login com o email que recebeu o convite.
                </p>
              )}
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={() => navigate('/editor')}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  Voltar ao editor
                </button>
                {isEmailMismatch && (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-brand-cyan/20 text-brand-cyan rounded-xl text-sm hover:bg-brand-cyan/30 transition-colors"
                  >
                    Trocar conta
                  </button>
                )}
                {!isEmailMismatch && (
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
