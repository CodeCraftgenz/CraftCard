import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { useAcceptInvite } from '@/hooks/useOrganization';
import { useAuth } from '@/providers/AuthProvider';

export function OrgJoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orgName, setOrgName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEmailMismatch, setIsEmailMismatch] = useState(false);

  useEffect(() => {
    if (!token) return;
    acceptInvite.mutateAsync(token)
      .then(async (res: any) => {
        const result = res?.data ?? res;
        setStatus('success');
        setOrgName(result.organization?.name || '');
        // Refresh auth to include the new org membership
        await refreshAuth();
        setTimeout(() => {
          navigate(result.organization ? `/org/${result.organization.id}` : '/editor');
        }, 2000);
      })
      .catch((err: any) => {
        setStatus('error');
        const msg = err?.response?.data?.message || err?.message || 'Erro ao aceitar convite';
        setErrorMsg(msg);
        if (msg.includes('outro email') || msg.includes('forbidden')) {
          setIsEmailMismatch(true);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header />
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center max-w-md"
        >
          {status === 'loading' && (
            <div className="animate-pulse text-white/50">Aceitando convite...</div>
          )}
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
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
