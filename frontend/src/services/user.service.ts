import { UserStats } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authFetch = (url: string, token: string, options: RequestInit = {}) =>
  fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

export const getStats = async (token: string): Promise<{ success: boolean; data?: UserStats; cached?: boolean }> => {
  const res = await authFetch('/api/v1/users/stats', token);
  return res.json();
};

export const updateProfile = async (name: string, token: string) => {
  const res = await authFetch('/api/v1/users/profile', token, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return res.json();
};
