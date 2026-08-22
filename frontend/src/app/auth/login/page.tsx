'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">÷</div>
          <h1 className="text-white text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          <span className="inline-block mt-2 text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">v3 · Microservices</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-orange-500 transition-colors placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••"
              className="w-full bg-gray-900 text-white rounded-xl px-4 py-3 text-sm outline-none border border-gray-700 focus:border-orange-500 transition-colors placeholder-gray-600" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-5">
          No account?{' '}
          <Link href="/auth/register" className="text-orange-400 hover:text-orange-300 transition-colors">Create one</Link>
        </p>
      </div>
    </div>
  );
}
