import type { ThreatArc } from '../../hooks/useThreatStream';

interface PhosphorLogDockProps {
  arcs: ThreatArc[];
  selectedAttack: ThreatArc | null;
  onSelectAttack: (arc: ThreatArc | null) => void;
  hoveredArcId: string | null;
  onHoverArc: (id: string | null) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

const FILTER_BUTTONS = ['ALL', 'L4', 'L7', 'AMBER > 65G'];

export const PhosphorLogDock = ({
  arcs,
  selectedAttack,
  onSelectAttack,
  hoveredArcId,
  onHoverArc,
  activeFilter,
  onSelectFilter,
}: PhosphorLogDockProps) => {
  return (
    <aside className="w-80 md:w-92 h-full bg-[#041009]/95 border-r border-[#22c55e]/40 p-3 font-mono flex flex-col justify-between shadow-[0_0_15px_rgba(34,197,94,0.15)] select-none z-20 relative">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Panel Header with ASCII Decorative Ticks */}
        <div className="flex items-center justify-between border-b border-[#22c55e]/30 pb-1.5 mb-2 shrink-0">
          <span className="text-[11px] font-bold tracking-wider text-[#4ade80] flex items-center gap-1.5 font-phosphor">
            <span className="inline-block w-2 h-2 bg-[#22c55e] animate-pulse" />
            [01] INBOUND_INTERCEPT.LOG
          </span>
          <span className="text-[9px] text-[#15803d]">[CH_01_RAW]</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mb-2 pb-1.5 border-b border-[#22c55e]/20 overflow-x-auto shrink-0">
          {FILTER_BUTTONS.map((f) => {
            const isSelected = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => onSelectFilter(f)}
                className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#22c55e]/25 text-[#86efac] border-[#4ade80] font-bold'
                    : 'bg-[#030b06] hover:bg-[#062010] text-[#15803d] border-[#22c55e]/30'
                }`}
              >
                [{f}]
              </button>
            );
          })}
        </div>

        {/* Streaming Packet Monospace Stream */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-[#22c55e]/15">
          {arcs.length === 0 ? (
            <div className="p-6 text-center text-[10px] text-[#15803d] font-mono">
              [ SCANNING_TELEMETRY_FREQUENCIES ... ]
            </div>
          ) : (
            arcs
              .slice()
              .reverse()
              .map((arc) => {
                const isSelected = selectedAttack?.meta.id === arc.meta.id;
                const isHovered = hoveredArcId === arc.meta.id;
                const isVolumetric = arc.meta.volumeGbps > 65;
                const dateStr = new Date(arc.meta.timestamp).toLocaleTimeString();

                return (
                  <div
                    key={arc.meta.id}
                    onClick={() => onSelectAttack(isSelected ? null : arc)}
                    onMouseEnter={() => onHoverArc(arc.meta.id)}
                    onMouseLeave={() => onHoverArc(null)}
                    className={`pt-1.5 pb-1 px-1.5 text-[10px] flex items-center justify-between border-l-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#22c55e]/20 border-[#4ade80] text-[#86efac]'
                        : isHovered
                        ? 'bg-[#22c55e]/10 border-[#22c55e] text-[#4ade80]'
                        : 'border-transparent hover:bg-[#22c55e]/5 text-[#22c55e]'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="text-[#15803d] mr-1.5 font-mono text-[9px]">{dateStr}</span>
                      <span className="text-[#4ade80] font-bold">{arc.meta.src}</span>
                      <span className="text-[#15803d] mx-1">=&gt;</span>
                      <span className="text-[#4ade80] font-bold">{arc.meta.dst}</span>
                      <span className="text-[#16a34a] ml-1.5 text-[9px]">[{arc.meta.vector}]</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`font-bold tabular-nums text-[10px] ${
                          isVolumetric ? 'text-[#f59e0b] font-phosphor-amber' : 'text-[#86efac]'
                        }`}
                      >
                        {arc.meta.volumeGbps.toFixed(1)}G
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Terminal Footer Telemetry Gauge */}
      <div className="border-t border-[#22c55e]/30 pt-2 text-[9px] text-[#16a34a] flex justify-between uppercase shrink-0 mt-2">
        <span>STATUS: BUFFER_LOCKED</span>
        <span>FIFO_CAP: {arcs.length}/35</span>
      </div>
    </aside>
  );
};

export default PhosphorLogDock;

