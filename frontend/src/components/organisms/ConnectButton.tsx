import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Check, Clock, Loader2 } from 'lucide-react';
import { useConnectionStatus, useRequestConnection, useAcceptConnection } from '@/hooks/useConnections';
import { useProfile } from '@/hooks/useProfile';

interface ConnectButtonProps {
  targetProfileId: string;
  accent: string;
  isLoggedIn: boolean;
}

export function ConnectButton({ targetProfileId, accent, isLoggedIn }: ConnectButtonProps) {
  const [justSent, setJustSent] = useState(false);
  const navigate = useNavigate();
  const { data: myProfile } = useProfile(undefined, isLoggedIn);
  const { data: status, isLoading: statusLoading } = useConnectionStatus(
    isLoggedIn ? targetProfileId : undefined,
  );
  const requestMutation = useRequestConnection();
  const acceptMutation = useAcceptConnection();

  // Not logged in — show button that redirects to login
  if (!isLoggedIn) {
    return (
      <motion.button
        onClick={() => navigate('/login')}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all text-white"
        style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}20)`, border: `1px solid ${accent}30` }}
      >
        <UserPlus size={16} style={{ color: accent }} />
        Conectar
      </motion.button>
    );
  }

  // Loading status or profile
  if (statusLoading || !myProfile) return null;

  // Don't show if viewing own profile
  if (myProfile.id === targetProfileId) return null;

  const handleConnect = () => {
    // Try to capture geolocation for the connection map
    const cachedGeo = sessionStorage.getItem('craftcard_geo');
    if (cachedGeo) {
      const geo = JSON.parse(cachedGeo);
      requestMutation.mutate(
        { fromProfileId: myProfile.id, toProfileId: targetProfileId, ...geo },
        { onSuccess: () => setJustSent(true) },
      );
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geo = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          sessionStorage.setItem('craftcard_geo', JSON.stringify(geo));
          requestMutation.mutate(
            { fromProfileId: myProfile.id, toProfileId: targetProfileId, ...geo },
            { onSuccess: () => setJustSent(true) },
          );
        },
        () => {
          // Geo denied — connect without location
          requestMutation.mutate(
            { fromProfileId: myProfile.id, toProfileId: targetProfileId },
            { onSuccess: () => setJustSent(true) },
          );
        },
        { timeout: 3000, enableHighAccuracy: false, maximumAge: 60000 },
      );
    } else {
      requestMutation.mutate(
        { fromProfileId: myProfile.id, toProfileId: targetProfileId },
        { onSuccess: () => setJustSent(true) },
      );
    }
  };

  const handleAccept = () => {
    if (status?.connectionId) {
      acceptMutation.mutate(status.connectionId);
    }
  };

  const isLoading = requestMutation.isPending || acceptMutation.isPending;

  // Already connected
  if (status?.status === 'ACCEPTED') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium border border-white/10 bg-white/5 text-white/50"
      >
        <Check size={16} />
        Conectado
      </motion.div>
    );
  }

  // Pending - user sent the request
  if ((status?.status === 'PENDING' && status.direction === 'SENT') || justSent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium border border-white/10 bg-white/5 text-white/40"
      >
        <Clock size={16} />
        Solicitação Enviada
      </motion.div>
    );
  }

  // Pending - user received the request
  if (status?.status === 'PENDING' && status.direction === 'RECEIVED') {
    return (
      <motion.button
        onClick={handleAccept}
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg transition-all"
        style={{
          background: `linear-gradient(135deg, #22c55e, #16a34a)`,
          boxShadow: `0 4px 20px rgba(34,197,94,0.3)`,
        }}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        Aceitar Conexão
      </motion.button>
    );
  }

  // No connection - show connect button
  return (
    <motion.button
      onClick={handleConnect}
      disabled={isLoading}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all text-white"
      style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}20)`, border: `1px solid ${accent}30` }}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <UserPlus size={16} style={{ color: accent }} />
      )}
      Conectar
    </motion.button>
  );
}
