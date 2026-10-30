import { Volume2, VolumeX, Grid, Eye, RotateCcw, Play, Pause } from 'lucide-react';
import type { ThreatStreamMetrics } from '../../hooks/useThreatStream';

interface VectorHeaderProps {
  metrics: ThreatStreamMetrics;
  showGraticule: boolean;
  onToggleGraticule: () => void;
  hideHud: boolean;
  onToggleHideHud: () => void;
  onResetCamera: () => void;
  isRotating: boolean;
  onToggleRotation: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VectorHeader = ({
  metrics,
  showGraticule,
  onToggleGraticule,
  hideHud,
  onToggleHideHud,
  onResetCamera,
  isRotating,
  onToggleRotation,
  soundEnabled,
  onToggleSound,
}: VectorHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2.5 border-b border-white/[0.08] bg-black/60 font-mono text-[11px] text-zinc-400 select-none">
      {/* System Identification */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full inline-block animate-pulse shadow-[0_0_6px_#00FF66]" />
          <span className="text-white font-medium tracking-widest uppercase">
            VECTOR // 01
          </span>
        </div>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-500 tracking-wider uppercase text-[10px] hidden sm:inline">
          GLOBAL THREAT TELEMETRY
        </span>
      </div>

      {/* Telemetry Avionics Readout */}
      <div className="flex items-center gap-6 md:gap-8">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">PEAK</span>
          <span className="text-white font-normal tabular-nums">{metrics.peakGbps.toFixed(1)}</span>
          <span className="text-[9px] text-zinc-600">GBPS</span>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">RATE</span>
          <span className="text-white font-normal tabular-nums">{metrics.currentLambda.toFixed(1)}</span>
          <span className="text-[9px] text-zinc-600">EVT/S</span>
        </div>

        <div className="hidden sm:flex items-baseline gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-600">INTERCEPT</span>
          <span className="text-white font-normal tabular-nums">{metrics.totalReceived.toLocaleString()}</span>
        </div>

        <div className="hidden lg:block pl-4 border-l border-white/[0.08] text-zinc-600 text-[10px]">
          REF: 00°00&apos;N / 000°00&apos;E
        </div>

        {/* Tactical Keybind Controls */}
        <div className="flex items-center gap-2 pl-4 border-l border-white/[0.08]">
          {/* Rotation Play/Pause Toggle [SPACE] */}
          <button
            onClick={onToggleRotation}
            className={`px-2 py-0.5 text-[9px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
              isRotating
                ? 'border-white/30 text-white bg-white/[0.06]'
                : 'border-white/[0.08] text-zinc-600 hover:text-zinc-400'
            }`}
            title="Toggle Continuous Celestial Rotation (Key: Space)"
          >
            {isRotating ? <Pause className="w-2.5 h-2.5 text-[#00F0FF]" /> : <Play className="w-2.5 h-2.5" />}
            <span className="hidden md:inline">{isRotating ? 'ROTATE' : 'PAUSED'}</span>
          </button>

          {/* Graticule Toggle [G] */}
          <button
            onClick={onToggleGraticule}
            className={`px-2 py-0.5 text-[9px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
              showGraticule
                ? 'border-white/30 text-white bg-white/[0.06]'
                : 'border-white/[0.08] text-zinc-600 hover:text-zinc-400'
            }`}
            title="Toggle Celestial Graticule Mesh (Key: G)"
          >
            <Grid className="w-2.5 h-2.5" />
            <span className="hidden md:inline">[G]</span>
          </button>

          {/* Camera Polar Reset [R] */}
          <button
            onClick={onResetCamera}
            className="px-2 py-0.5 text-[9px] font-mono border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset Camera to Polar Orbit [0, 0, 320] (Key: R)"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span className="hidden md:inline">[R]</span>
          </button>

          {/* Hide HUD / Wallpaper Mode [H] */}
          <button
            onClick={onToggleHideHud}
            className={`px-2 py-0.5 text-[9px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
              hideHud
                ? 'border-white/40 text-white bg-white/[0.08]'
                : 'border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
            title="Toggle Clean Wallpaper View (Key: H)"
          >
            <Eye className="w-2.5 h-2.5" />
            <span className="hidden md:inline">[H]</span>
          </button>

          {/* Sub-millisecond Tactical Tick Audio */}
          <button
            onClick={onToggleSound}
            className="p-1 border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sub-ms Tactical Audio' : 'Enable 4000Hz Sub-ms Tactile Clicks'}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3 text-[#00FF66]" /> : <VolumeX className="w-3 h-3 text-zinc-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default VectorHeader;
