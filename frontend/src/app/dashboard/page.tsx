'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getHistory } from '@/services/calculator.service';
import { CalculationHistoryEntry } from '@/types';
import Calculator from '@/components/calculator/Calculator';
import HistoryPanel from '@/components/calculator/HistoryPanel';
import StatsPanel from '@/components/ui/StatsPanel';
import Navbar from '@/components/ui/Navbar';

export default function DashboardPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();

  const [history,        setHistory]        = useState<CalculationHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyCached,  setHistoryCached]  = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token) return;
    setHistoryLoading(true);
    getHistory(token).then((res) => {
      if (res.success && res.data) {
        setHistory(res.data.calculations);
        setHistoryCached(!!res.cached);
      }
    }).finally(() => setHistoryLoading(false));
  }, [token]);

  const handleNewCalculation = useCallback((entry: CalculationHistoryEntry) => {
    setHistory((prev) => [entry, ...prev.slice(0, 49)]);
    setHistoryCached(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setHistoryCached(false);
  }, []);

  const handleDeleteEntry = useCallback((id: number) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="flex items-start justify-center gap-6 p-8 pt-12 flex-wrap">
        <Calculator onNewCalculation={handleNewCalculation} />
        <HistoryPanel
          entries={history}
          onClear={handleClearHistory}
          onDelete={handleDeleteEntry}
          loading={historyLoading}
          cached={historyCached}
        />
        <StatsPanel />
      </main>
      <p className="text-center text-gray-700 text-xs pb-6">
        Branch 3 — Microservices Architecture
      </p>
    </div>
  );
}
