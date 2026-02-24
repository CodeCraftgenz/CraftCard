import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    if ('serviceWorker' in navigator && permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, [permission]);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setLoading(true);
    try {
      // Get VAPID public key from backend (api interceptor already unwraps response.data)
      const vapidResult = await api.get('/notifications/vapid-key') as { publicKey: string | null };
      if (!vapidResult.publicKey) {
        setLoading(false);
        return;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidResult.publicKey) as BufferSource,
      });

      // Send subscription to backend
      const subJson = subscription.toJSON();
      await api.post('/notifications/subscribe', {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      });

      setIsSubscribed(true);
    } catch {
      // Permission denied or error
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await api.delete('/notifications/subscribe', {
          data: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
