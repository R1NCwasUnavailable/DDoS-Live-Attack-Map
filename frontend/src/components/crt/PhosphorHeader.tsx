import { Volume2, VolumeX, Maximize2, Minimize2, Tv } from 'lucide-react';
import type { ThreatStreamMetrics, StreamState } from '../../hooks/useThreatStream';

interface PhosphorHeaderProps {
  streamState: StreamState;
  metrics: ThreatStreamMetrics;
  activeCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  crtShaderEnabled: boolean;
  onToggleCrtShader: () => void;
  cinematicMode: boolean;
  onToggleCinematic: () => void;
}

export const PhosphorHeader = ({
  streamState,
  metrics,
  activeCount,
  soundEnabled,
  onToggleSound,
  crtShaderEnabled,
  onToggleCrtShader,
  cinematicMode,
  onToggleCinematic,
}: PhosphorHeaderProps) => {
  const isOnline = streamState === 'connected';

  return (
    <header className="w-full bg-[#030b06]/95 border-b border-[#22c55e]/40 px-4 py-2 font-mono flex items-center justify-between text-xs text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.1)] select-none z-30 relative">
      {/* Scope Identity */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 border border-[#4ade80] flex items-center justify-center p-0.5">
          <div
            className={`w-1.5 h-1.5 ${
              isOnline ? 'bg-[#4ade80] shadow-[0_0_8px_#4ade80] animate-ping' : 'bg-[#f59e0b]'
            }`}
          />
        </div>
        <div className="leading-tight">
          <h1 className="text-xs font-bold uppercase tracking-widest text-[#4ade80] flex items-center gap-2">
            <span>GLOBAL_SIGINT // DDOS_VECTOR_RADAR</span>
            <span className="text-[9px] px-1 py-0.2 bg-[#052e16] text-[#86efac] border border-[#22c55e]/50">
              P31-CRT
            </span>
          </h1>
          <p className="text-[9px] text-[#15803d]">P31_PHOSPHOR_EMULATION // CLOUDFLARE_ENRICHED</p>
        </div>
      </div>

      {/* Instrument Readout Cells */}
      <div className="flex items-center gap-4 sm:gap-6 text-[11px]">
        {/* Peak Bandwidth */}
        <div className="flex flex-col text-right">
          <span className="text-[8px] uppercase tracking-wider text-[#15803d]">PEAK_LOAD</span>
          <span className="font-bold tabular-nums text-[#86efac]">
            {metrics.peakGbps.toFixed(1)} <span className="text-[9px] text-[#15803d]">GBPS</span>
          </span>
        </div>

        {/* Arrival Rate */}
        <div className="flex flex-col text-right">
          <span className="text-[8px] uppercase tracking-wider text-[#15803d]">ARRIVAL_RATE</span>
          <span className="font-bold tabular-nums text-[#86efac]">
            {metrics.currentLambda.toFixed(1)} <span className="text-[9px] text-[#15803d]">/SEC (λ)</span>
          </span>
        </div>

        {/* Active Trajectories Buffer */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[8px] uppercase tracking-wider text-[#15803d]">ACTIVE_ARCS</span>
          <span className="font-bold tabular-nums text-[#86efac]">
            {activeCount} <span className="text-[9px] text-[#15803d]">/ 35</span>
          </span>
        </div>

        {/* Total Intercepts */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-[8px] uppercase tracking-wider text-[#15803d]">INTERCEPT_COUNT</span>
          <span className="font-bold tabular-nums text-[#86efac]">
            {metrics.totalReceived.toLocaleString()}
          </span>
        </div>

        {/* Online Status */}
        <div className="border border-[#22c55e]/40 px-2 py-1 text-[10px] text-[#4ade80] bg-[#22c55e]/10 font-bold uppercase tracking-wider">
          {streamState === 'connected' ? 'SYS_ONLINE' : streamState}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-[#22c55e]/25">
          {/* CRT Scanline Toggle */}
          <button
            onClick={onToggleCrtShader}
            className={`p-1.5 border transition-colors cursor-pointer ${
              crtShaderEnabled
                ? 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]'
                : 'bg-[#041009] text-[#15803d] border-[#15803d]'
            }`}
            title="Toggle CRT Scanline / Curved Tube Lens Overlay"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          {/* Audio Hum / Tick Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 bg-[#041009] hover:bg-[#062010] text-[#22c55e] border border-[#22c55e]/40 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Terminal Audio' : 'Enable CRT 55Hz Hum & Geiger Ticks'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#4ade80]" /> : <VolumeX className="w-3.5 h-3.5 text-[#15803d]" />}
          </button>

          {/* Cinematic Toggle */}
          <button
            onClick={onToggleCinematic}
            className={`px-2 py-1 text-[10px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
              cinematicMode
                ? 'bg-[#22c55e]/25 text-[#4ade80] border-[#4ade80]'
                : 'bg-[#041009] hover:bg-[#062010] text-[#22c55e] border-[#22c55e]/40'
            }`}
            title="Toggle Cinematic Scope (Key: F)"
          >
            {cinematicMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">CINEMATIC [F]</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PhosphorHeader;

