import { ShieldAlert, Zap, Globe2, Radio, Check } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProtocolInfo {
  vector: string;
  layer: string;
  color: string;
  desc: string;
  icon: ReactNode;
}

const PROTOCOLS: ProtocolInfo[] = [
  {
    vector: 'SYN Flood',
    layer: 'TCP/L4',
    color: '#ef4444',
    desc: 'High-urgency TCP state table exhaustion',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
  },
  {
    vector: 'UDP Amplification',
    layer: 'UDP/L4',
    color: '#f97316',
    desc: 'Reflection flood (NTP/SSDP/Memcached)',
    icon: <Zap className="w-3.5 h-3.5 text-orange-400" />,
  },
  {
    vector: 'HTTP Flood / DDoS',
    layer: 'HTTP/L7',
    color: '#06b6d4',
    desc: 'High-frequency app layer request flood',
    icon: <Globe2 className="w-3.5 h-3.5 text-cyan-400" />,
  },
  {
    vector: 'DNS Amplification',
    layer: 'DNS/L4-L7',
    color: '#8b5cf6',
    desc: 'Open resolver volumetric reflection',
    icon: <Radio className="w-3.5 h-3.5 text-purple-400" />,
  },
];

interface LegendProps {
  activeFilter: string | null;
  onSelectFilter: (vector: string | null) => void;
  protocolStats: Record<string, number>;
}

export const Legend = ({
  activeFilter,
  onSelectFilter,
  protocolStats,
}: LegendProps) => {
  const totalAttacks = Object.values(protocolStats).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="glass-panel rounded-xl p-4 w-80 text-xs shadow-2xl pointer-events-auto border border-cyan-500/20">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15 mb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold tracking-wider text-cyan-300 uppercase text-[11px]">
            Attack Vectors & Protocols
          </span>
        </div>
        {activeFilter && (
          <button
            onClick={() => onSelectFilter(null)}
            className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-mono cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="space-y-2">
        {PROTOCOLS.map((p) => {
          const count = protocolStats[p.vector] || 0;
          const percentage = Math.round((count / totalAttacks) * 100);
          const isSelected = activeFilter === p.vector;

          return (
            <div
              key={p.vector}
              onClick={() => onSelectFilter(isSelected ? null : p.vector)}
              className={`p-2 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}
                  />
                  <span className="font-medium text-slate-200">{p.vector}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {p.layer}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-cyan-300 font-semibold">{count}</span>
                  <span className="text-[10px] text-slate-500">({percentage}%)</span>
                  {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: p.color,
                  }}
                />
              </div>

              <div className="text-[10px] text-slate-400 truncate">{p.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Legend;
