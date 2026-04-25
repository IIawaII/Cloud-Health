import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthState, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';
import { getApiError, getStringField, getObjectField } from '@/lib/utils';
import { compressAvatarBase64 } from '@/lib/avatar';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = '';

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractUser(data: unknown): User | null {
  const userData = getObjectField(data, 'user');
  if (!userData) return null;
  return {
    id: getStringField(userData, 'id') || '',
    username: getStringField(userData, 'username') || '',
    email: getStringField(userData, 'email') || '',
    avatar: getStringField(userData, 'avatar'),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // 预加载缓存的用户信息，避免刷新时用户名/头像闪烁
      const cachedUsername = localStorage.getItem('user_username');
      const cachedEmail = localStorage.getItem('user_email');
      const cachedAvatar = localStorage.getItem('user_avatar');
      if (cachedUsername) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: {
            id: '',
            username: cachedUsername,
            email: cachedEmail || '',
            avatar: cachedAvatar || undefined,
          },
          token,
        }));
      }
      checkAuth();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // 监听 storage 事件，处理多标签页同步登出
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        if (!e.newValue) {
          // 其他标签页登出了
          setState({ isAuthenticated: false, user: null, token: null, isLoading: false });
        } else if (e.newValue !== e.oldValue) {
          // 其他标签页登录了，刷新页面以获取新状态
          window.location.reload();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setState({ isAuthenticated: false, user: null, token: null, isLoading: false });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = extractUser(data);
        // 从 localStorage 恢复头像（本地开发时 KV 不持久化）
        const cachedAvatar = localStorage.getItem('user_avatar');
        if (user && cachedAvatar && !user.avatar) {
          user.avatar = cachedAvatar;
        }
        // 将服务器返回的用户信息持久化到 localStorage
        if (user?.avatar) {
          localStorage.setItem('user_avatar', user.avatar);
        }
        if (user?.username) {
          localStorage.setItem('user_username', user.username);
        }
        if (user?.email) {
          localStorage.setItem('user_email', user.email);
        }
        setState({
          isAuthenticated: true,
          user,
          token,
          isLoading: false,
        });
      } else if (response.status === 401) {
        // 令牌明确无效，清除本地存储
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_avatar');
        localStorage.removeItem('user_username');
        localStorage.removeItem('user_email');
        setState({ isAuthenticated: false, user: null, token: null, isLoading: false });
      } else {
        // 其他错误（如 500），假设 token 仍有效，从 localStorage 恢复缓存的用户信息
        const cachedUsername = localStorage.getItem('user_username');
        const cachedEmail = localStorage.getItem('user_email');
        const cachedAvatar = localStorage.getItem('user_avatar');
        setState({
          isAuthenticated: true,
          user: cachedUsername
            ? { id: '', username: cachedUsername, email: cachedEmail || '', avatar: cachedAvatar || undefined }
            : null,
          token,
          isLoading: false,
        });
      }
    } catch (err) {
      // 网络错误（超时、断网等），不清除 token，从 localStorage 恢复缓存的用户信息
      console.warn('[Auth] verify network error, keeping login state:', err);
      const cachedUsername = localStorage.getItem('user_username');
      const cachedEmail = localStorage.getItem('user_email');
      const cachedAvatar = localStorage.getItem('user_avatar');
      setState({
        isAuthenticated: true,
        user: cachedUsername
          ? { id: '', username: cachedUsername, email: cachedEmail || '', avatar: cachedAvatar || undefined }
          : null,
        token,
        isLoading: false,
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      const token = getStringField(data, 'token');

      if (response.ok && token) {
        const user = extractUser(data);
        localStorage.setItem('auth_token', token);
        if (user?.avatar) {
          localStorage.setItem('user_avatar', user.avatar);
        }
        if (user?.username) {
          localStorage.setItem('user_username', user.username);
        }
        if (user?.email) {
          localStorage.setItem('user_email', user.email);
        }
        setState({
          isAuthenticated: true,
          user: user ?? null,
          token,
          isLoading: false,
        });
        return { success: true, message: getStringField(data, 'message') ?? '', token, user };
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
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      const token = getStringField(data, 'token');

      if (response.ok && token) {
        const user = extractUser(data);
        localStorage.setItem('auth_token', token);
        if (user?.avatar) {
          localStorage.setItem('user_avatar', user.avatar);
        }
        if (user?.username) {
          localStorage.setItem('user_username', user.username);
        }
        if (user?.email) {
          localStorage.setItem('user_email', user.email);
        }
        setState({
          isAuthenticated: true,
          user: user ?? null,
          token,
          isLoading: false,
        });
        return { success: true, message: getStringField(data, 'message') ?? '', token, user };
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
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // 忽略登出请求的错误
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_username');
    localStorage.removeItem('user_email');
    setState({ isAuthenticated: false, user: null, token: null, isLoading: false });
  }, []);

  const updateUser = useCallback((user: User) => {
    // 缓存用户信息到 localStorage（本地开发时 KV 不持久化）
    if (user.avatar) {
      const compressed = compressAvatarBase64(user.avatar);
      if (compressed) {
        localStorage.setItem('user_avatar', compressed);
      }
    }
    if (user.username) {
      localStorage.setItem('user_username', user.username);
    }
    if (user.email) {
      localStorage.setItem('user_email', user.email);
    }
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
