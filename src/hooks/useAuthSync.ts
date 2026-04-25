import { useEffect } from 'react';

const AUTH_SYNC_CHANNEL = 'auth_sync';

export function broadcastAuthChange(action: 'login' | 'logout') {
  try {
    const bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    bc.postMessage({ action, timestamp: Date.now() });
    bc.close();
  } catch {
    localStorage.setItem('auth_sync_event', JSON.stringify({ action, timestamp: Date.now() }));
  }
}

export function useAuthSync(onLogout: () => void, onLogin: () => void) {
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.action === 'logout') {
          onLogout();
        } else if (e.data?.action === 'login') {
          onLogin();
        }
      };
    } catch {
      // 降级到 localStorage 事件
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth_sync_event' && e.newValue) {
        try {
          const evt = JSON.parse(e.newValue) as { action: string };
          if (evt.action === 'logout') {
            onLogout();
          } else if (evt.action === 'login') {
            onLogin();
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [onLogout, onLogin]);
}
