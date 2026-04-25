import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthState, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';
import { getApiError, getStringField, getObjectField } from '@/lib/utils';
import { fetchWithTimeout } from '@/lib/fetch';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '';
const REFRESH_LOCK_KEY = 'auth_refresh_lock';
const AUTH_SYNC_CHANNEL = 'auth_sync';

function extractUser(data: unknown): User | null {
  const userData = getObjectField(data, 'user');
  if (!userData) return null;
  return {
    id: getStringField(userData, 'id') || '',
    username: getStringField(userData, 'username') || '',
    email: getStringField(userData, 'email') || '',
    avatar: getStringField(userData, 'avatar'),
    role: (getStringField(userData, 'role') as 'user' | 'admin') || 'user',
  };
}

function clearUserCache() {
  localStorage.removeItem('user_avatar');
  localStorage.removeItem('user_username');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_role');
}

function persistUser(user: User | null) {
  if (user?.avatar) {
    localStorage.setItem('user_avatar', user.avatar);
  }
  if (user?.username) {
    localStorage.setItem('user_username', user.username);
  }
  if (user?.email) {
    localStorage.setItem('user_email', user.email);
  }
  if (user?.role) {
    localStorage.setItem('user_role', user.role);
  }
}

function broadcastAuthChange(action: 'login' | 'logout') {
  try {
    const bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    bc.postMessage({ action, timestamp: Date.now() });
    bc.close();
  } catch {
    // BroadcastChannel 不支持时的降级：使用 localStorage 事件触发
    localStorage.setItem('auth_sync_event', JSON.stringify({ action, timestamp: Date.now() }));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // 页面加载时：优先用缓存用户信息减少闪烁，再异步验证 Cookie 中的会话
  useEffect(() => {
    const cachedUsername = localStorage.getItem('user_username');
    if (cachedUsername) {
      const cachedEmail = localStorage.getItem('user_email');
      const cachedAvatar = localStorage.getItem('user_avatar');
      const cachedRole = localStorage.getItem('user_role') as 'user' | 'admin' | null;
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: {
          id: '',
          username: cachedUsername,
          email: cachedEmail || '',
          avatar: cachedAvatar || undefined,
          role: cachedRole || 'user',
        },
      }));
    }
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 多标签页同步：监听登出/登录事件
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.action === 'logout') {
          setState({ isAuthenticated: false, user: null, isLoading: false });
        } else if (e.data?.action === 'login') {
          window.location.reload();
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
            setState({ isAuthenticated: false, user: null, isLoading: false });
          } else if (evt.action === 'login') {
            window.location.reload();
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
  }, []);

  /**
   * 刷新会话（通过 httpOnly Cookie 自动携带 refresh token）
   */
  const doRefreshSession = useCallback(async (): Promise<boolean> => {
    // 防止多标签页同时刷新
    const now = Date.now();
    const lockValue = localStorage.getItem(REFRESH_LOCK_KEY);
    if (lockValue && now - parseInt(lockValue, 10) < 10000) {
      await new Promise(r => setTimeout(r, 1500));
      return true;
    }

    try {
      localStorage.setItem(REFRESH_LOCK_KEY, String(now));
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      if (response.ok) {
        const data = await response.json();
        const user = extractUser(data);
        persistUser(user);
        return true;
      }
    } catch (err) {
      console.warn('[Auth] refresh session failed:', err);
    } finally {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }

    return false;
  }, []);

  // 辅助函数：从 verify 响应构建用户（自动恢复缓存头像）
  function buildUser(data: unknown): User | null {
    const user = extractUser(data);
    if (user) {
      const cachedAvatar = localStorage.getItem('user_avatar');
      if (cachedAvatar && !user.avatar) {
        user.avatar = cachedAvatar;
      }
    }
    return user;
  }

  // 辅助函数：设置已认证状态
  function setAuthenticated(user: User | null) {
    persistUser(user);
    setState({ isAuthenticated: true, user, isLoading: false });
  }

  // 辅助函数：设置离线/异常状态（保留缓存用户名和头像，避免闪烁）
  function setOfflineState() {
    const cachedUsername = localStorage.getItem('user_username');
    const cachedEmail = localStorage.getItem('user_email');
    const cachedAvatar = localStorage.getItem('user_avatar');
    const cachedRole = localStorage.getItem('user_role') as 'user' | 'admin' | null;
    setState({
      isAuthenticated: false,
      user: cachedUsername
        ? { id: '', username: cachedUsername, email: cachedEmail || '', avatar: cachedAvatar || undefined, role: cachedRole || 'user' }
        : null,
      isLoading: false,
    });
  }

  const checkAuth = useCallback(async () => {
    async function doVerify() {
      return fetchWithTimeout(`${API_BASE_URL}/api/auth/verify`, {
        timeout: 10000,
      });
    }

    try {
      const response = await doVerify();

      if (response.ok) {
        setAuthenticated(buildUser(await response.json()));
        return;
      }

      // 非 401 的服务端错误（如 500）
      if (response.status !== 401) {
        console.warn('[Auth] verify server error:', response.status);
        setOfflineState();
        return;
      }

      // 401: Access Token 过期，尝试用 Refresh Token 刷新
      const refreshed = await doRefreshSession();
      if (!refreshed) {
        clearUserCache();
        setState({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      const retryResponse = await doVerify();
      if (retryResponse.ok) {
        setAuthenticated(buildUser(await retryResponse.json()));
        return;
      }

      // 刷新后仍验证失败
      clearUserCache();
      setState({ isAuthenticated: false, user: null, isLoading: false });
    } catch (err) {
      console.warn('[Auth] verify network error:', err);
      setOfflineState();
    }
  }, [doRefreshSession]);

  const handleAuthSuccess = useCallback((data: unknown): AuthResponse => {
    const user = extractUser(data);
    persistUser(user);
    setState({
      isAuthenticated: true,
      user: user ?? null,
      isLoading: false,
    });
    broadcastAuthChange('login');
    return {
      success: true,
      message: getStringField(data, 'message') ?? '',
      user,
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        timeout: 10000,
      });

      const data = await response.json();

      if (response.ok) {
        return handleAuthSuccess(data);
      } else {
        const err = getApiError(data) || '登录失败';
        return { success: false, message: err, error: getApiError(data) };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, message: '请求超时，请检查网络或稍后重试', error: '请求超时' };
      }
      return { success: false, message: '网络错误，请稍后重试', error: '网络错误' };
    }
  }, [handleAuthSuccess]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const { confirmPassword: _confirmPassword, ...registerData } = credentials;
      void _confirmPassword;
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
        timeout: 10000,
      });

      const data = await response.json();

      if (response.ok) {
        return handleAuthSuccess(data);
      } else {
        const err = getApiError(data) || '注册失败';
        return { success: false, message: err, error: getApiError(data) };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, message: '请求超时，请检查网络或稍后重试', error: '请求超时' };
      }
      return { success: false, message: '网络错误，请稍后重试', error: '网络错误' };
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
    } catch {
      // 忽略登出请求的错误
    }

    clearUserCache();
    setState({ isAuthenticated: false, user: null, isLoading: false });
    broadcastAuthChange('logout');
  }, []);

  const updateUser = useCallback((user: User) => {
    persistUser(user);
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, checkAuth, updateUser, refreshSession: doRefreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
