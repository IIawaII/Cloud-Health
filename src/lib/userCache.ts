import type { User } from '@/types/auth';

const KEYS = {
  id: 'user_id',
  avatar: 'user_avatar',
  username: 'user_username',
  email: 'user_email',
  role: 'user_role',
} as const;

export function clearUserCache() {
  localStorage.removeItem(KEYS.id);
  localStorage.removeItem(KEYS.avatar);
  localStorage.removeItem(KEYS.username);
  localStorage.removeItem(KEYS.email);
  localStorage.removeItem(KEYS.role);
}

export function persistUser(user: User | null) {
  if (user?.id) localStorage.setItem(KEYS.id, user.id);
  if (user?.avatar) localStorage.setItem(KEYS.avatar, user.avatar);
  if (user?.username) localStorage.setItem(KEYS.username, user.username);
  if (user?.email) localStorage.setItem(KEYS.email, user.email);
  if (user?.role) localStorage.setItem(KEYS.role, user.role);
}

export function loadCachedUser(): Partial<User> | null {
  const userId = localStorage.getItem(KEYS.id);
  const username = localStorage.getItem(KEYS.username);
  if (!userId || !username) return null;
  return {
    id: userId,
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
    return { ...user, avatar: cachedAvatar };
  }
  return user;
}
