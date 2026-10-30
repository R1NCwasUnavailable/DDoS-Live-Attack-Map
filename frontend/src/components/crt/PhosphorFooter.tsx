interface PhosphorFooterProps {
  totalCount: number;
  peakBandwidth: number;
  arrivalRate: number;
  latencyMs: number;
  fps: number;
  activePreset: string;
  onSelectPreset: (preset: string) => void;
}

const REGION_PRESETS = [
  { id: 'GLOBAL', label: 'GLOBAL' },
  { id: 'NA', label: 'NA_NORAD' },
  { id: 'EMEA', label: 'EMEA_RADAR' },
  { id: 'APAC', label: 'APAC_SIGINT' },
];

export const PhosphorFooter = ({
  totalCount,
  peakBandwidth,
  arrivalRate,
  latencyMs,
  fps,
  activePreset,
  onSelectPreset,
}: PhosphorFooterProps) => {
  return (
    <footer className="w-full bg-[#030b06]/95 border-t border-[#22c55e]/40 px-4 py-1.5 font-mono text-[10px] text-[#22c55e] flex items-center justify-between select-none z-30 relative shadow-[0_-5px_15px_rgba(34,197,94,0.06)]">
      {/* Telemetry Cells */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[#15803d]">[REC_COUNT: </span>
          <span className="text-[#86efac] font-bold tabular-nums">
            {totalCount.toString().padStart(7, '0')}
          </span>
          <span className="text-[#15803d]">]</span>
        </div>

        <div className="hidden sm:block">
          <span className="text-[#15803d]">PEAK: </span>
          <span className="text-[#86efac] font-bold tabular-nums">{peakBandwidth.toFixed(1)} GBPS</span>
        </div>

        <div className="hidden md:block">
          <span className="text-[#15803d]">ARRIVAL: </span>
          <span className="text-[#86efac] font-bold tabular-nums">{arrivalRate.toFixed(1)}/S</span>
        </div>

        <div className="hidden lg:block">
          <span className="text-[#15803d]">PING: </span>
          <span className="text-[#86efac] font-bold tabular-nums">{latencyMs}MS</span>
        </div>

        <div>
          <span className="text-[#15803d]">CRT_FPS: </span>
          <span className="text-[#86efac] font-bold tabular-nums">{fps}</span>
        </div>
      </div>

      {/* Scope Orientation Jump Buttons */}
      <div className="flex items-center gap-1.5">
        <span className="hidden sm:inline text-[#15803d]">RADAR_AZIMUTH:</span>
        {REGION_PRESETS.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`px-2 py-0.5 text-[9px] uppercase tracking-wider border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#22c55e]/30 text-[#86efac] border-[#4ade80] font-bold'
                  : 'bg-[#030b06] hover:bg-[#062010] text-[#15803d] border-[#22c55e]/30'
              }`}
            >
              [{p.label}]
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default PhosphorFooter;

