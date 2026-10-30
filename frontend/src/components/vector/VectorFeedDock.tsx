import type { ThreatArc } from '../../hooks/useThreatStream';

interface VectorFeedDockProps {
  events: ThreatArc[];
  selectedAttack: ThreatArc | null;
  onSelectAttack: (arc: ThreatArc | null) => void;
  hoveredArcId: string | null;
  onHoverArc: (id: string | null) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  latencyMs: number;
}

const FILTER_PILLS = ['ALL', 'L4', 'L7', 'CRITICAL > 85G'];

export const VectorFeedDock = ({
  events,
  selectedAttack,
  onSelectAttack,
  hoveredArcId,
  onHoverArc,
  activeFilter,
  onSelectFilter,
  latencyMs,
}: VectorFeedDockProps) => {
  return (
    <aside className="fixed bottom-10 left-6 z-20 w-80 md:w-88 font-mono select-none">
      {/* Boundary Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.12]">
        <span className="text-[10px] tracking-widest uppercase text-white font-medium flex items-center gap-2">
          <span className="w-1 h-1 bg-[#00F0FF] rounded-none inline-block" />
          01 // EVENT_STREAM
        </span>
        <span className="text-[9px] text-zinc-500 tabular-nums">
          BUFF: {events.length}/35
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-white/[0.06] overflow-x-auto">
        {FILTER_PILLS.map((f) => {
          const isSelected = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => onSelectFilter(f)}
              className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider border transition-colors shrink-0 cursor-pointer ${
                isSelected
                  ? 'border-white text-white bg-white/[0.1]'
                  : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Zero-Fill Minimal List */}
      <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="py-4 text-[10px] text-zinc-700 font-mono">
            // INTERCEPT_IN_PROGRESS ...
          </div>
        ) : (
          events
            .slice()
            .reverse()
            .map((evt) => {
              const isSelected = selectedAttack?.meta.id === evt.meta.id;
              const isHovered = hoveredArcId === evt.meta.id;
              const isCritical = evt.meta.volumeGbps > 85;
              const timeStr = new Date(evt.meta.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={evt.meta.id}
                  onClick={() => onSelectAttack(isSelected ? null : evt)}
                  onMouseEnter={() => onHoverArc(evt.meta.id)}
                  onMouseLeave={() => onHoverArc(null)}
                  className={`flex items-center justify-between py-1 px-1 text-[11px] border-b transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-white text-white bg-white/[0.08]'
                      : isHovered
                      ? 'border-white/40 text-white bg-white/[0.03]'
                      : 'border-white/[0.04] hover:border-white/[0.18] text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="text-[9px] text-zinc-600 tabular-nums">{timeStr}</span>
                    <span className="text-white font-normal">{evt.meta.src}</span>
                    <span className="text-zinc-600 text-[9px]">→</span>
                    <span className="text-white font-normal">{evt.meta.dst}</span>
                    <span className="text-[9px] text-zinc-500 uppercase">
                      [{evt.meta.vector.split(' ')[0]}]
                    </span>
                  </div>

                  <span
                    className={`tabular-nums text-[10px] shrink-0 ${
                      isCritical ? 'text-[#FF3B30] font-normal' : 'text-zinc-300 font-light'
                    }`}
                  >
                    {evt.meta.volumeGbps.toFixed(1)}G
                  </span>
                </div>
              );
            })
        )}
      </div>

      {/* Axis Scale Legend */}
      <div className="mt-3 pt-1 border-t border-white/[0.06] flex items-center justify-between text-[8px] text-zinc-600 uppercase tracking-wider">
        <span>MODE: REALTIME_ESTIMATED</span>
        <span className="tabular-nums">LATENCY: ~{latencyMs}MS</span>
      </div>
    </aside>
  );
};

export default VectorFeedDock;

