import type { User } from '@/types/auth';

const KEYS = {
  avatar: 'user_avatar',
  username: 'user_username',
  email: 'user_email',
  role: 'user_role',
} as const;

export function clearUserCache() {
  localStorage.removeItem(KEYS.avatar);
  localStorage.removeItem(KEYS.username);
  localStorage.removeItem(KEYS.email);
  localStorage.removeItem(KEYS.role);
}

export function persistUser(user: User | null) {
  if (user?.avatar) localStorage.setItem(KEYS.avatar, user.avatar);
  if (user?.username) localStorage.setItem(KEYS.username, user.username);
  if (user?.email) localStorage.setItem(KEYS.email, user.email);
  if (user?.role) localStorage.setItem(KEYS.role, user.role);
}

export function loadCachedUser(): Partial<User> | null {
  const username = localStorage.getItem(KEYS.username);
  if (!username) return null;
  return {
    id: '',
    username,
    email: localStorage.getItem(KEYS.email) || '',
    avatar: localStorage.getItem(KEYS.avatar) || undefined,
    role: (localStorage.getItem(KEYS.role) as 'user' | 'admin') || 'user',
  };
}

export function buildUserWithCache(user: User | null): User | null {
  if (!user) return null;
  const cachedAvatar = localStorage.getItem(KEYS.avatar);
  if (cachedAvatar && !user.avatar) {
    user.avatar = cachedAvatar;
  }
  return user;
}
