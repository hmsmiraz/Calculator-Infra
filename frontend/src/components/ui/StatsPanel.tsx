'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStats } from '@/services/user.service';
import { UserStats } from '@/types';

export default function StatsPanel() {
  const { token } = useAuth();
  const [stats,   setStats]   = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cached,  setCached]  = useState(false);

  useEffect(() => {
    if (!token) return;
    getStats(token).then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
        setCached(!!res.cached);
      }
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="bg-gray-800 rounded-3xl p-5 w-72 shadow-2xl shadow-black/50">
      <p className="text-gray-600 text-sm text-center py-8">Loading stats...</p>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-3xl p-5 w-72 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-300 font-semibold text-lg">Your Stats</h2>
        {cached && <span className="text-xs text-green-500 bg-green-950/40 px-2 py-0.5 rounded-full">cached</span>}
      </div>

      {!stats || stats.total_calculations === 0 ? (
        <p className="text-gray-600 text-sm text-center py-4">No calculations yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-white font-bold text-lg">{stats.total_calculations}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add',  value: stats.by_operation.additions,       color: 'text-green-400',  icon: '+' },
              { label: 'Sub',  value: stats.by_operation.subtractions,    color: 'text-blue-400',   icon: '−' },
              { label: 'Mul',  value: stats.by_operation.multiplications, color: 'text-yellow-400', icon: '×' },
              { label: 'Div',  value: stats.by_operation.divisions,       color: 'text-purple-400', icon: '÷' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-gray-900 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`${color} text-xs font-bold`}>{icon}</span>
                  <span className="text-gray-500 text-xs">{label}</span>
                </div>
                <span className="text-white font-semibold">{value}</span>
              </div>
            ))}
          </div>

          {stats.last_calculation && (
            <div className="bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-gray-500 text-xs mb-1">Last calculation</p>
              <p className="text-gray-400 text-xs">
                {new Date(stats.last_calculation).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Architecture info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-600 text-xs mb-2">Services</p>
        <div className="space-y-1">
          {[
            { name: 'api-gateway',          port: '4000', color: 'bg-orange-500' },
            { name: 'auth-service',         port: '4001', color: 'bg-blue-500'   },
            { name: 'calculator-service',   port: '4002', color: 'bg-green-500'  },
            { name: 'user-service',         port: '4003', color: 'bg-purple-500' },
          ].map(({ name, port, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-gray-500 text-xs">{name}</span>
              </div>
              <span className="text-gray-700 text-xs">:{port}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
