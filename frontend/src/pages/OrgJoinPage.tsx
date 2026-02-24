import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { useAcceptInvite } from '@/hooks/useOrganization';

export function OrgJoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const acceptInvite = useAcceptInvite();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orgName, setOrgName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    acceptInvite.mutateAsync(token)
      .then((res: any) => {
        const result = res?.data ?? res;
        setStatus('success');
        setOrgName(result.organization?.name || '');
        setTimeout(() => {
          navigate(result.organization ? `/org/${result.organization.id}` : '/editor');
        }, 2000);
      })
      .catch((err: Error) => {
        setStatus('error');
        setErrorMsg(err.message || 'Erro ao aceitar convite');
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
          className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center max-w-sm"
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
              <p className="text-white/50 text-sm">Voce agora e membro de {orgName}. Redirecionando...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="text-red-400" size={24} />
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">Erro</h2>
              <p className="text-white/50 text-sm">{errorMsg}</p>
              <button
                onClick={() => navigate('/editor')}
                className="mt-4 px-4 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors"
              >
                Voltar ao editor
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
