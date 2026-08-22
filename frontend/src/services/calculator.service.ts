import { Operator, CalcApiResponse, HistoryResponse } from '@/types';

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

export const calculate = async (
  a: number, b: number, operator: Operator, token: string
): Promise<CalcApiResponse> => {
  const res = await authFetch('/api/v1/calculator/calculate', token, {
    method: 'POST',
    body: JSON.stringify({ a, b, operator }),
  });
  return res.json();
};

export const getHistory = async (token: string, page = 1, limit = 20): Promise<HistoryResponse> => {
  const res = await authFetch(`/api/v1/calculator/history?page=${page}&limit=${limit}`, token);
  return res.json();
};

export const clearHistory = async (token: string) => {
  const res = await authFetch('/api/v1/calculator/history', token, { method: 'DELETE' });
  return res.json();
};

export const deleteHistoryEntry = async (id: number, token: string) => {
  const res = await authFetch(`/api/v1/calculator/history/${id}`, token, { method: 'DELETE' });
  return res.json();
};
