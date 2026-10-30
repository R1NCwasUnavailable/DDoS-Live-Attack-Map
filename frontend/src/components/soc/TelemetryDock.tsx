import { Target, Crosshair, BarChart3, X } from 'lucide-react';
import type { ThreatArc, ThreatStreamMetrics } from '../../hooks/useThreatStream';

interface TelemetryDockProps {
  metrics: ThreatStreamMetrics;
  selectedAttack: ThreatArc | null;
  onClearSelectedAttack: () => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

const VECTOR_DETAILS = [
  { name: 'SYN Flood', layer: 'TCP/L4', color: '#EF4444', desc: 'State table exhaustion' },
  { name: 'UDP Amplification', layer: 'UDP/L4', color: '#F59E0B', desc: 'Reflection flood (NTP/SSDP)' },
  { name: 'HTTP Flood / DDoS', layer: 'HTTP/L7', color: '#06B6D4', desc: 'Application layer requests' },
  { name: 'DNS Amplification', layer: 'DNS/L4-L7', color: '#A855F7', desc: 'Open resolver reflection' },
];

export const TelemetryDock = ({
  metrics,
  selectedAttack,
  onClearSelectedAttack,
  activeFilter,
  onSelectFilter,
}: TelemetryDockProps) => {
  const totalVectorCount = Object.values(metrics.protocolStats).reduce((a, b) => a + b, 0) || 1;
  const maxTargetCount = metrics.topTargets[0]?.[1] || 1;
  const maxOriginCount = metrics.topOrigins[0]?.[1] || 1;

  // Helper to build tactical proportion bar
  const renderProportionBar = (current: number, max: number, barColor: string) => {
    const totalBlocks = 20;
    const filledBlocks = Math.max(1, Math.round((current / max) * totalBlocks));
    const emptyBlocks = totalBlocks - filledBlocks;
    return (
      <span className="font-mono text-[9px] tracking-tighter" style={{ color: barColor }}>
        {'■'.repeat(filledBlocks)}
        <span className="text-[#1E2536]">{'□'.repeat(emptyBlocks)}</span>
      </span>
    );
  };

  return (
    <aside className="w-80 md:w-88 h-full bg-[#080A0F] border-l border-[#1E2536] flex flex-col z-20 relative select-none">
      {/* Corner Bracket Accents */}
      <div className="soc-corner-tl" />
      <div className="soc-corner-tr" />
      <div className="soc-corner-bl" />
      <div className="soc-corner-br" />

      {/* Dock Header */}
      <div className="px-3 py-2.5 bg-[#0D1017] border-b border-[#1E2536] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200">
            GEO.PROBABILITY_MATRIX
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">[ REAL_TIME ]</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 1. Target Nations Proportion Matrix (Section 3.3) */}
        <div>
          <div className="text-[10px] uppercase font-bold text-red-400 mb-2 flex items-center gap-1.5">
            <Target className="w-3 h-3" />
            <span>Target Country Share (L7/L4)</span>
          </div>
          <div className="space-y-1.5 bg-[#0D1017] p-2 border border-[#161B26]">
            {metrics.topTargets.length === 0 ? (
              <div className="text-[9px] text-slate-600 font-mono py-1">[ AWAITING_EVENTS ]</div>
            ) : (
              metrics.topTargets.slice(0, 4).map(([country, count]) => {
                const pct = Math.round((count / totalVectorCount) * 100);
                return (
                  <div key={country} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="w-8 text-slate-300 font-bold">{country}</span>
                    <div className="flex-1 px-2">{renderProportionBar(count, maxTargetCount, '#EF4444')}</div>
                    <span className="text-right text-slate-400 tabular-nums">
                      {count} <span className="text-slate-600">({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Origin Botnet Clusters Proportion Matrix */}
        <div>
          <div className="text-[10px] uppercase font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
            <Crosshair className="w-3 h-3" />
            <span>Origin Botnet Share</span>
          </div>
          <div className="space-y-1.5 bg-[#0D1017] p-2 border border-[#161B26]">
            {metrics.topOrigins.length === 0 ? (
              <div className="text-[9px] text-slate-600 font-mono py-1">[ AWAITING_EVENTS ]</div>
            ) : (
              metrics.topOrigins.slice(0, 4).map(([country, count]) => {
                const pct = Math.round((count / totalVectorCount) * 100);
                return (
                  <div key={country} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="w-8 text-slate-300 font-bold">{country}</span>
                    <div className="flex-1 px-2">{renderProportionBar(count, maxOriginCount, '#06B6D4')}</div>
                    <span className="text-right text-slate-400 tabular-nums">
                      {count} <span className="text-slate-600">({pct}%)</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Vector Protocol Distribution Matrix */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-cyan-400" />
              <span>Vector Distribution</span>
            </span>
            {activeFilter !== 'ALL' && (
              <button
                onClick={() => onSelectFilter('ALL')}
                className="text-[9px] text-cyan-400 hover:underline cursor-pointer"
              >
                RESET
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {VECTOR_DETAILS.map((v) => {
              const count = metrics.protocolStats[v.name] || 0;
              const pct = Math.round((count / totalVectorCount) * 100);
              const isSelected = activeFilter === v.name;

              return (
                <div
                  key={v.name}
                  onClick={() => onSelectFilter(isSelected ? 'ALL' : v.name)}
                  className={`p-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#131722] border-cyan-400'
                      : 'bg-[#0D1017] hover:bg-[#111622] border-[#161B26]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: v.color, boxShadow: `0 0 6px ${v.color}` }}
                      />
                      <span className="font-bold text-slate-200">{v.name}</span>
                      <span className="text-[9px] text-slate-500">[{v.layer}]</span>
                    </div>
                    <div className="tabular-nums font-bold" style={{ color: v.color }}>
                      {count} <span className="text-[9px] text-slate-500">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-[#161B26] h-1 rounded-none overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: v.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Threat Inspector Detail Card (when an arc is clicked) */}
        {selectedAttack && (
          <div className="bg-[#0D1017] border border-cyan-500/60 p-3 space-y-2 relative">
            <div className="soc-corner-tl" />
            <div className="soc-corner-tr" />
            <div className="soc-corner-bl" />
            <div className="soc-corner-br" />

            <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2536]">
              <span className="text-[10px] font-bold text-cyan-300 font-mono uppercase">
                INSPECTOR // {selectedAttack.meta.id}
              </span>
              <button
                onClick={onClearSelectedAttack}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">VECTOR:</span>
                <span className="font-bold" style={{ color: selectedAttack.color }}>
                  {selectedAttack.meta.vector}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BANDWIDTH:</span>
                <span className="text-amber-400 font-bold">{selectedAttack.meta.volumeGbps.toFixed(1)} Gbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PATH:</span>
                <span className="text-slate-200">
                  {selectedAttack.meta.src} &rarr; {selectedAttack.meta.dst} ({selectedAttack.meta.targetIndustry})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SOURCE IP:</span>
                <span className="text-slate-300">{selectedAttack.meta.srcIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AUTONOMOUS SYS:</span>
                <span className="text-slate-300 truncate max-w-[130px]">{selectedAttack.meta.asn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BOTNET PROFILE:</span>
                <span className="text-red-400 font-bold">{selectedAttack.meta.botnet}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-[#0D1017] border-t border-[#1E2536] text-[9px] text-slate-500 flex items-center justify-between">
        <span>INTERCEPTED</span>
        <span className="text-cyan-400 tabular-nums">{metrics.totalReceived.toLocaleString()} TOTAL</span>
      </div>
    </aside>
  );
};

export default TelemetryDock;

