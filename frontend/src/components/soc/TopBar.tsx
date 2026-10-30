import { Volume2, VolumeX, Maximize2, Minimize2, Radio } from 'lucide-react';
import type { ThreatStreamMetrics, StreamState } from '../../hooks/useThreatStream';

interface TopBarProps {
  streamState: StreamState;
  metrics: ThreatStreamMetrics;
  activeArcCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  cinematicMode: boolean;
  onToggleCinematic: () => void;
}

export const TopBar = ({
  streamState,
  metrics,
  activeArcCount,
  soundEnabled,
  onToggleSound,
  cinematicMode,
  onToggleCinematic,
}: TopBarProps) => {
  const isOnline = streamState === 'connected';

  return (
    <header className="w-full bg-[#080A0F] border-b border-[#1E2536] px-4 py-2 flex items-center justify-between text-xs font-mono select-none z-30 relative">
      {/* Left: System Identifiers */}
      <div className="flex items-center gap-4 divide-x divide-[#161B26]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-none ${
              isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="font-bold tracking-wider text-slate-100 uppercase text-[11px] flex items-center gap-1.5">
            SYS_DEFENSE // ACTIVE
          </span>
          <span className="text-[9px] px-1 py-0.2 bg-[#131722] text-cyan-400 border border-[#252D3D]">
            SOC-V2
          </span>
        </div>

        <div className="pl-4 flex items-center gap-2 text-slate-400 text-[11px]">
          <span>INGEST:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 animate-pulse" />
            LIVE (STOCHASTIC)
          </span>
        </div>
      </div>

      {/* Right: Instrumental Telemetry Readouts */}
      <div className="flex items-center divide-x divide-[#161B26]">
        {/* Peak Bandwidth */}
        <div className="px-4 text-right">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Peak Bandwidth</div>
          <div className="text-xs font-bold text-cyan-400 tabular-nums">
            {metrics.peakGbps.toFixed(1)} <span className="text-[10px] text-slate-500">Gbps</span>
          </div>
        </div>

        {/* Arrival Rate */}
        <div className="px-4 text-right">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Arrival Rate</div>
          <div className="text-xs font-bold text-slate-200 tabular-nums">
            {metrics.currentLambda.toFixed(1)} <span className="text-[10px] text-slate-500">/sec (λ)</span>
          </div>
        </div>

        {/* Active Load */}
        <div className="hidden sm:block px-4 text-right">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Active Load</div>
          <div className="text-xs font-bold text-red-400 tabular-nums">
            {metrics.activeGbps.toFixed(1)} <span className="text-[10px] text-slate-500">Gbps</span>
          </div>
        </div>

        {/* Rolling Buffer */}
        <div className="hidden md:block px-4 text-right">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">Buffer</div>
          <div className="text-xs font-bold text-slate-300 tabular-nums">
            {activeArcCount} <span className="text-[10px] text-slate-500">/ 35 ARCS</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pl-4 flex items-center gap-2">
          {/* Audio Mute */}
          <button
            onClick={onToggleSound}
            className="p-1.5 bg-[#0D1017] hover:bg-[#131722] text-slate-300 hover:text-cyan-300 border border-[#1E2536] transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sonar' : 'Unmute Sonar'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Cinematic Toggle */}
          <button
            onClick={onToggleCinematic}
            className={`px-2 py-1 text-[10px] font-mono border transition-colors flex items-center gap-1.5 cursor-pointer ${
              cinematicMode
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-[#131722] hover:bg-[#1E2536] text-slate-300 border-[#252D3D]'
            }`}
            title="Toggle Cinematic Mode (Hotkey: F)"
          >
            {cinematicMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>CINEMATIC [F]</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

