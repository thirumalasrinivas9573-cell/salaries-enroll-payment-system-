import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SensitiveMask({ value = '', type = 'generic', className = '' }) {
  const [revealed, setRevealed] = useState(false);

  if (!value) return <span className="text-slate-400 font-mono text-xs">-</span>;

  let masked = value;
  if (!revealed) {
    if (type === 'aadhaar') {
      // 12 digits: XXXX-XXXX-1234
      const last4 = value.slice(-4);
      masked = `•••• •••• ${last4}`;
    } else if (type === 'pan') {
      // 10 chars: XXXXX1234F
      const last4 = value.slice(-4);
      masked = `••••••${last4}`;
    } else if (type === 'bank') {
      // Bank account: show last 4 digits
      const last4 = value.slice(-4);
      masked = `••••••••${last4}`;
    } else {
      const len = Math.max(0, value.length - 4);
      masked = '•'.repeat(Math.min(len, 8)) + value.slice(-4);
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
      <span className={revealed ? 'text-slate-900 font-semibold' : 'text-slate-600'}>
        {masked}
      </span>
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        title={revealed ? 'Hide identifier' : 'Reveal identifier'}
      >
        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
}
