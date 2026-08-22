'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">÷</div>
          <span className="text-white font-semibold">Calculator</span>
          <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded-full">v3 · Microservices</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👋 {user?.name}</span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
