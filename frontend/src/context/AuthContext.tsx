'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AuthContextValue {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      setToken(stored);
      fetchMe(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async (t: string) => {
    try {
      const res  = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) setUser(data.data.user);
      else clearAuth();
    } catch { clearAuth(); }
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const res  = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('auth_token', data.data.token);
      return null;
    }
    return data.message || 'Login failed';
  };

  const register = async (name: string, email: string, password: string): Promise<string | null> => {
    const res  = await fetch(`${API}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
      setToken(data.data.token);
      localStorage.setItem('auth_token', data.data.token);
      return null;
    }
    return data.message || data.errors?.[0]?.message || 'Registration failed';
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch(`${API}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
