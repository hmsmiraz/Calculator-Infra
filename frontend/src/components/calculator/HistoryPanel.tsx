'use client';

import { useState } from 'react';
import { CalculationHistoryEntry } from '@/types';
import { clearHistory, deleteHistoryEntry } from '@/services/calculator.service';
import { useAuth } from '@/context/AuthContext';

const OP_COLORS: Record<string, string> = {
  addition:       'text-green-400',
  subtraction:    'text-blue-400',
  multiplication: 'text-yellow-400',
  division:       'text-purple-400',
};

interface Props {
  entries:  CalculationHistoryEntry[];
  onClear:  () => void;
  onDelete: (id: number) => void;
  loading:  boolean;
  cached:   boolean;
}

export default function HistoryPanel({ entries, onClear, onDelete, loading, cached }: Props) {
  const { token }    = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    await clearHistory(token!);
    setClearing(false);
    onClear();
  };

  const handleDelete = async (id: number) => {
    await deleteHistoryEntry(id, token!);
    onDelete(id);
  };

  return (
    <div className="bg-gray-800 rounded-3xl p-5 w-72 shadow-2xl shadow-black/50 max-h-[560px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-300 font-semibold text-lg">History</h2>
          {cached && <span className="text-xs text-green-500 bg-green-950/40 px-2 py-0.5 rounded-full">cached</span>}
        </div>
        {entries.length > 0 && (
          <button onClick={handleClearAll} disabled={clearing}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors disabled:opacity-50">
            {clearing ? 'Clearing...' : 'Clear all'}
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 space-y-2 pr-1">
        {loading ? (
          <p className="text-gray-600 text-sm text-center mt-8">Loading history...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-600 text-sm text-center mt-8">No calculations yet.<br />Results will appear here.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="bg-gray-900 rounded-xl px-4 py-3 group relative">
              <p className="text-gray-400 text-sm pr-6">{e.expression}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs capitalize ${OP_COLORS[e.operation] ?? 'text-gray-500'}`}>{e.operation}</span>
                <span className="text-xs text-gray-600">{new Date(e.created_at).toLocaleTimeString()}</span>
              </div>
              <button onClick={() => handleDelete(e.id)}
                className="absolute top-2 right-2 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
