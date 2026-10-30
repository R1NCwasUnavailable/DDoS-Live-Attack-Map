import { X } from 'lucide-react';
import type { ThreatArc, ThreatStreamMetrics } from '../../hooks/useThreatStream';

interface VectorFlowMatrixProps {
  metrics: ThreatStreamMetrics;
  selectedAttack: ThreatArc | null;
  onClearSelectedAttack: () => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const VectorFlowMatrix = ({
  metrics,
  selectedAttack,
  onClearSelectedAttack,
  activeFilter,
  onSelectFilter,
}: VectorFlowMatrixProps) => {
  const totalEvents = Object.values(metrics.protocolStats).reduce((a, b) => a + b, 0) || 1;

  return (
    <aside className="fixed bottom-10 right-6 z-20 w-72 md:w-80 font-mono select-none space-y-4">
      {/* 1. Target Concentration & Flow Matrix */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.12]">
          <span className="text-[10px] tracking-widest uppercase text-white font-medium flex items-center gap-2">
            <span className="w-1 h-1 bg-white rounded-none inline-block" />
            02 // TARGET_CONCENTRATION
          </span>
          <span className="text-[9px] text-zinc-600">L3/L4/L7</span>
        </div>

        <div className="space-y-2.5">
          {metrics.topTargets.slice(0, 4).map(([code, count]) => {
            const pct = Math.round((count / totalEvents) * 100);
            return (
              <div key={code} className="text-[10px]">
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span className="text-white font-normal">{code}</span>
                  <span className="text-zinc-500 tabular-nums">
                    {count} PKTS ({pct}%)
                  </span>
                </div>
                {/* Ultra-thin 1px Gauge (Section 5.3) */}
                <div className="w-full h-[1px] bg-white/[0.08] relative">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Vector Type Distribution (1px Hairline Meters) */}
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/[0.08]">
          <span className="text-[9px] tracking-wider uppercase text-zinc-500">
            SIGNAL SPECTRUM
          </span>
          {activeFilter !== 'ALL' && (
            <button
              onClick={() => onSelectFilter('ALL')}
              className="text-[8px] text-white hover:underline cursor-pointer"
            >
              [RESET]
            </button>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(metrics.protocolStats).map(([vec, count]) => {
            const pct = Math.round((count / totalEvents) * 100);
            const isL7 = vec.includes('HTTP');
            const beamColor = isL7 ? '#FFFFFF' : '#00F0FF';

            return (
              <div
                key={vec}
                onClick={() => onSelectFilter(activeFilter === vec ? 'ALL' : vec)}
                className="cursor-pointer group"
              >
                <div className="flex justify-between text-[9px] text-zinc-500 mb-1 group-hover:text-zinc-300">
                  <span>{vec}</span>
                  <span className="tabular-nums" style={{ color: beamColor }}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-[1px] bg-white/[0.08] relative">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: beamColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Coordinate Reticle Dossier (when an arc is clicked) */}
      {selectedAttack && (
        <div className="pt-2 border-t border-white/[0.14] text-[10px] space-y-1">
          <div className="flex items-center justify-between pb-1 text-white">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400">
              RETICLE // {selectedAttack.meta.id}
            </span>
            <button
              onClick={onClearSelectedAttack}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex justify-between text-zinc-500">
            <span>TRAJECTORY:</span>
            <span className="text-white">
              {selectedAttack.meta.src} → {selectedAttack.meta.dst}
            </span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>BANDWIDTH:</span>
            <span className="text-[#00F0FF] tabular-nums">
              {selectedAttack.meta.volumeGbps.toFixed(1)} GBPS
            </span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>TARGET_SECTOR:</span>
            <span className="text-zinc-300 truncate max-w-[130px]">
              {selectedAttack.meta.targetIndustry}
            </span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>AUTONOMOUS_SYS:</span>
            <span className="text-zinc-300 truncate max-w-[130px]">
              {selectedAttack.meta.asn}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default VectorFlowMatrix;

