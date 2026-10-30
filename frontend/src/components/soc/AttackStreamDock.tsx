import { ArrowRight, Filter } from 'lucide-react';
import type { ThreatArc } from '../../hooks/useThreatStream';

interface AttackStreamDockProps {
  arcs: ThreatArc[];
  selectedAttack: ThreatArc | null;
  onSelectAttack: (arc: ThreatArc | null) => void;
  hoveredArcId: string | null;
  onHoverArc: (id: string | null) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

const FILTER_OPTIONS = ['ALL', 'L4', 'L7', 'SYN Flood', 'UDP Amplification'];

export const AttackStreamDock = ({
  arcs,
  selectedAttack,
  onSelectAttack,
  hoveredArcId,
  onHoverArc,
  activeFilter,
  onSelectFilter,
}: AttackStreamDockProps) => {
  return (
    <aside className="w-80 md:w-88 h-full bg-[#080A0F] border-r border-[#1E2536] flex flex-col z-20 relative select-none">
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
            SYS.ATTACK_STREAM
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">[ LIVE_FEED ]</span>
      </div>

      {/* Filter Tabs */}
      <div className="px-2 py-1.5 bg-[#080A0F] border-b border-[#161B26] flex items-center gap-1 overflow-x-auto">
        <Filter className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
        {FILTER_OPTIONS.map((f) => {
          const isSelected = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => onSelectFilter(f)}
              className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                  : 'bg-[#0D1017] hover:bg-[#131722] text-slate-400 border-[#1E2536]'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Live Trajectory Log List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#161B26] p-1.5 space-y-1">
        {arcs.length === 0 ? (
          <div className="p-6 text-center text-[10px] text-slate-600 font-mono">
            [ SYNTHESIZING_VECTORS ... ]
          </div>
        ) : (
          arcs
            .slice()
            .reverse()
            .map((arc) => {
              const isSelected = selectedAttack?.meta.id === arc.meta.id;
              const isHovered = hoveredArcId === arc.meta.id;

              return (
                <div
                  key={arc.meta.id}
                  onClick={() => onSelectAttack(isSelected ? null : arc)}
                  onMouseEnter={() => onHoverArc(arc.meta.id)}
                  onMouseLeave={() => onHoverArc(null)}
                  className={`p-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#131722] border-cyan-400 text-slate-100'
                      : isHovered
                      ? 'bg-[#0F1420] border-[#252D3D] text-slate-200'
                      : 'bg-[#0B0D13] hover:bg-[#0E121B] border-[#161B26] text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    {/* Origin -> Destination */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
                      <span className="px-1.5 py-0.2 bg-[#161B26] text-slate-200 border border-[#252D3D]">
                        {arc.meta.src}
                      </span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="px-1.5 py-0.2 bg-red-950/70 text-red-300 border border-red-900/60">
                        {arc.meta.dst}
                      </span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[90px] font-normal">
                        {arc.meta.targetIndustry}
                      </span>
                    </div>

                    {/* Bandwidth Volume Readout */}
                    <div
                      className="text-[10px] font-mono font-bold px-1.5 py-0.2 border tabular-nums"
                      style={{
                        backgroundColor: `${arc.color}15`,
                        borderColor: `${arc.color}50`,
                        color: arc.color,
                      }}
                    >
                      {arc.meta.volumeGbps.toFixed(1)} Gbps
                    </div>
                  </div>

                  {/* Vector details & ASN */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-none"
                        style={{ backgroundColor: arc.color }}
                      />
                      <span className="text-slate-300">{arc.meta.vector}</span>
                      <span className="text-slate-600">[{arc.meta.protocol}]</span>
                    </span>
                    <span className="truncate max-w-[110px] text-slate-500">
                      {arc.meta.asn || arc.meta.srcIp}
                    </span>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-[#0D1017] border-t border-[#1E2536] text-[9px] text-slate-500 flex items-center justify-between">
        <span>ACTIVE_STREAM</span>
        <span className="text-cyan-400">{arcs.length} VECTORS</span>
      </div>
    </aside>
  );
};

export default AttackStreamDock;

