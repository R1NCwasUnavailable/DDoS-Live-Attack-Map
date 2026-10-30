interface VectorFooterProps {
  activePreset: string;
  onSelectPreset: (preset: string) => void;
  fps: number;
}

const REGION_PRESETS = [
  { id: 'GLOBAL', label: 'GLOBAL' },
  { id: 'NA', label: 'NA' },
  { id: 'EMEA', label: 'EMEA' },
  { id: 'APAC', label: 'APAC' },
];

export const VectorFooter = ({
  activePreset,
  onSelectPreset,
  fps,
}: VectorFooterProps) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2 border-t border-white/[0.08] bg-black/60 font-mono text-[9px] text-zinc-500 select-none">
      {/* Left: Geodetic Projection Spec */}
      <div className="flex items-center gap-4">
        <span>SCALE: 1:100M</span>
        <span className="text-zinc-700">|</span>
        <span>PROJECTION: ORTHOGRAPHIC_VECTOR</span>
        <span className="hidden sm:inline text-zinc-700">|</span>
        <span className="hidden sm:inline">DATA: CLOUDFLARE_RADAR_INTERPOLATED</span>
        <span className="hidden md:inline text-zinc-700">|</span>
        <span className="hidden md:inline text-zinc-400">FPS: {fps}</span>
      </div>

      {/* Right: Regional Vector Presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-600 hidden sm:inline mr-1">ORIENTATION:</span>
        {REGION_PRESETS.map((p) => {
          const isSelected = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-white text-white bg-white/[0.1]'
                  : 'border-white/[0.08] text-zinc-600 hover:text-zinc-400'
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

export default VectorFooter;

