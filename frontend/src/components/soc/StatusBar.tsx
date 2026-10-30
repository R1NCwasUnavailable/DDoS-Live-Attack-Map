import { Globe2 } from 'lucide-react';

interface StatusBarProps {
  latencyMs: number;
  fps: number;
  activeArcs: number;
  maxArcs?: number;
  activeCameraPreset: string;
  onSelectCameraPreset: (preset: string) => void;
}

const PRESETS = [
  { id: 'GLOBAL', label: 'GLOBAL' },
  { id: 'NA', label: 'NA' },
  { id: 'EMEA', label: 'EMEA' },
  { id: 'APAC', label: 'APAC' },
];

export const StatusBar = ({
  latencyMs,
  fps,
  activeArcs,
  maxArcs = 35,
  activeCameraPreset,
  onSelectCameraPreset,
}: StatusBarProps) => {
  return (
    <footer className="w-full bg-[#080A0F] border-t border-[#1E2536] px-4 py-1.5 flex items-center justify-between text-[10px] font-mono select-none z-30 relative">
      {/* Telemetry Metrics */}
      <div className="flex items-center gap-4 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none" />
          <span>LATENCY:</span>
          <span className="text-emerald-400 font-bold tabular-nums">{latencyMs}ms</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">|</span>
          <span>WEBGL FPS:</span>
          <span className="text-cyan-400 font-bold tabular-nums">{fps}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-slate-600">|</span>
          <span>ACTIVE ARCS:</span>
          <span className="text-slate-200 font-bold tabular-nums">
            {activeArcs}/{maxArcs}
          </span>
        </div>
      </div>

      {/* Camera Focus Presets (Section 6.2) */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1 text-slate-500 mr-2">
          <Globe2 className="w-3 h-3 text-cyan-400" />
          <span>CAMERA FOCUS:</span>
        </div>

        <div className="flex items-center gap-1">
          {PRESETS.map((p) => {
            const isSelected = activeCameraPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectCameraPreset(p.id)}
                className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-[#0D1017] hover:bg-[#131722] text-slate-400 border-[#1E2536]'
                }`}
              >
                [{p.label}]
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;

