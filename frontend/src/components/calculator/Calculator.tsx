'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { calculate } from '@/services/calculator.service';
import { Operator, CalculationHistoryEntry } from '@/types';

type CalcState = {
  display: string;
  firstNum: string;
  operator: Operator | null;
  waitingForSecond: boolean;
  justCalculated: boolean;
};

const INITIAL: CalcState = {
  display: '0', firstNum: '', operator: null,
  waitingForSecond: false, justCalculated: false,
};

function Display({ value, expression }: { value: string; expression: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 mb-4 text-right min-h-[90px] flex flex-col justify-between">
      <span className="text-gray-500 text-sm truncate">{expression}</span>
      <span className="text-white text-4xl font-light tracking-wider truncate">{value}</span>
    </div>
  );
}

type BtnProps = { label: string; onClick: () => void; variant?: 'num'|'op'|'action'|'eq' };
function Btn({ label, onClick, variant = 'num' }: BtnProps) {
  const v = {
    num:    'bg-gray-700 hover:bg-gray-600 text-white',
    op:     'bg-orange-500 hover:bg-orange-400 text-white',
    action: 'bg-gray-500 hover:bg-gray-400 text-white',
    eq:     'bg-orange-500 hover:bg-orange-400 text-white',
  }[variant];
  return (
    <button onClick={onClick}
      className={`${v} rounded-2xl text-xl font-medium h-16 transition-all active:scale-95 select-none flex items-center justify-center`}>
      {label}
    </button>
  );
}

interface Props {
  onNewCalculation: (entry: CalculationHistoryEntry) => void;
}

export default function Calculator({ onNewCalculation }: Props) {
  const { token } = useAuth();
  const [state,   setState]   = useState<CalcState>(INITIAL);
  const [expr,    setExpr]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const digit = useCallback((d: string) => {
    setError(null);
    setState((p) => {
      if (p.waitingForSecond || p.justCalculated) return { ...p, display: d, waitingForSecond: false, justCalculated: false };
      if (p.display === '0' && d !== '.') return { ...p, display: d };
      if (d === '.' && p.display.includes('.')) return p;
      if (p.display.length >= 12) return p;
      return { ...p, display: p.display + d };
    });
  }, []);

  const op = useCallback((o: Operator) => {
    setError(null);
    setState((p) => {
      setExpr(`${p.display} ${o}`);
      return { ...p, firstNum: p.display, operator: o, waitingForSecond: true, justCalculated: false };
    });
  }, []);

  const equals = useCallback(async () => {
    if (!state.operator || state.waitingForSecond) return;

    const a        = parseFloat(state.firstNum);
    const b        = parseFloat(state.display);
    const operator = state.operator;

    setExpr(`${state.firstNum} ${operator} ${state.display} =`);
    setLoading(true);
    setError(null);

    try {
      const res = await calculate(a, b, operator, token!);

      if (res.success && res.data) {
        const rs = String(res.data.result);
        setState((s) => ({
          ...s,
          display: rs, firstNum: rs,
          operator: null, waitingForSecond: false, justCalculated: true,
        }));
        onNewCalculation({
          id: res.data.id, user_id: 0,
          operand_a: a, operand_b: b, operator,
          result: res.data.result,
          expression: res.data.expression,
          operation: res.data.operation,
          created_at: res.data.timestamp,
        });
      } else {
        setError(res.message || 'Calculation failed');
        setState((s) => ({ ...s, display: 'Error' }));
      }
    } catch {
      setError('Network error — is the gateway running?');
    } finally {
      setLoading(false);
    }
  }, [state, token, onNewCalculation]);

  const clear     = useCallback(() => { setState(INITIAL); setExpr(''); setError(null); }, []);
  const sign      = useCallback(() => setState((p) => ({ ...p, display: p.display.startsWith('-') ? p.display.slice(1) : `-${p.display}` })), []);
  const percent   = useCallback(() => setState((p) => ({ ...p, display: String(parseFloat(p.display) / 100) })), []);
  const backspace = useCallback(() => setState((p) => ({ ...p, display: p.display.length <= 1 || p.justCalculated ? '0' : p.display.slice(0, -1) })), []);

  return (
    <div className="bg-gray-800 rounded-3xl p-5 w-72 shadow-2xl shadow-black/50">
      <Display value={loading ? '...' : state.display} expression={expr} />
      {error && <p className="text-red-400 text-xs text-center mb-3 bg-red-950/40 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-4 gap-3">
        <Btn label="AC"  onClick={clear}            variant="action" />
        <Btn label="+/-" onClick={sign}             variant="action" />
        <Btn label="%"   onClick={percent}          variant="action" />
        <Btn label="÷"   onClick={() => op('/')}    variant="op" />
        <Btn label="7"   onClick={() => digit('7')} />
        <Btn label="8"   onClick={() => digit('8')} />
        <Btn label="9"   onClick={() => digit('9')} />
        <Btn label="×"   onClick={() => op('*')}    variant="op" />
        <Btn label="4"   onClick={() => digit('4')} />
        <Btn label="5"   onClick={() => digit('5')} />
        <Btn label="6"   onClick={() => digit('6')} />
        <Btn label="−"   onClick={() => op('-')}    variant="op" />
        <Btn label="1"   onClick={() => digit('1')} />
        <Btn label="2"   onClick={() => digit('2')} />
        <Btn label="3"   onClick={() => digit('3')} />
        <Btn label="+"   onClick={() => op('+')}    variant="op" />
        <Btn label="⌫"   onClick={backspace}        variant="action" />
        <Btn label="0"   onClick={() => digit('0')} />
        <Btn label="."   onClick={() => digit('.')} />
        <Btn label="="   onClick={equals}           variant="eq" />
      </div>
    </div>
  );
}
