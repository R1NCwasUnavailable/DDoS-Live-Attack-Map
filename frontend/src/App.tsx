import { useState, useEffect, useRef } from 'react';
import Globe from './components/ui/globe';
import VectorHeader from './components/vector/VectorHeader';
import VectorFeedDock from './components/vector/VectorFeedDock';
import VectorFlowMatrix from './components/vector/VectorFlowMatrix';
import VectorFooter from './components/vector/VectorFooter';
import { useThreatStream } from './hooks/useThreatStream';
import { tactileAudio } from './utils/tactileAudio';
import type { ThreatArc } from './hooks/useThreatStream';

export function App() {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hideHud, setHideHud] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<string>('GLOBAL');

  const {
    arcs,
    allArcs,
    rings,
    points,
    metrics,
    selectedAttack,
    setSelectedAttack,
    hoveredArcId,
    setHoveredArcId,
  } = useThreatStream(filterCategory);

  // Audio control
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    tactileAudio.setMuted(!next);
  };

  // Trigger sub-millisecond tactile tick on incoming packet
  const prevArcCountRef = useRef(0);
  useEffect(() => {
    if (arcs.length > prevArcCountRef.current && arcs.length > 0) {
      tactileAudio.playTactileClick();
    }
    prevArcCountRef.current = arcs.length;
  }, [arcs]);

  // Global keybind controls: [G] Graticule, [R] Reset, [H] Hide HUD, [SPACE] Rotation Toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRotating((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGraticule((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        setCameraPreset('GLOBAL');
      } else if (e.key === 'h' || e.key === 'H') {
        setHideHud((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen bg-[#000000] text-white font-mono overflow-hidden select-none relative">
      {/* 1. Minimalist Avionics Header Bar (Section 5.1) */}
      {!hideHud && (
        <VectorHeader
          metrics={metrics}
          showGraticule={showGraticule}
          onToggleGraticule={() => setShowGraticule(!showGraticule)}
          hideHud={hideHud}
          onToggleHideHud={() => setHideHud(!hideHud)}
          onResetCamera={() => setCameraPreset('GLOBAL')}
          isRotating={isRotating}
          onToggleRotation={() => setIsRotating(!isRotating)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. Central 3D Vector Wireframe Globe with Smooth Celestial Rotation */}
      <main className="w-full h-full relative bg-[#000000]">
        <Globe
          arcs={arcs}
          rings={rings}
          points={points}
          hoveredArcId={hoveredArcId}
          cameraPreset={cameraPreset}
          showGraticule={showGraticule}
          isRotating={isRotating}
          rotationSpeed={0.0022}
          onArcClick={(arc: ThreatArc) => setSelectedAttack(arc)}
        />

        {/* Wallpaper indicator if HUD is hidden */}
        {hideHud && (
          <div className="fixed top-4 left-6 text-[9px] font-mono text-zinc-600 z-30 flex items-center gap-2">
            <span className="w-1 h-1 bg-[#00FF66] rounded-full inline-block animate-pulse" />
            <span>VECTOR_WALLPAPER // PRESS [H] TO RESTORE TELEMETRY</span>
          </div>
        )}
      </main>

      {/* 3. Hairline Vector Attack Feed (Section 5.2) */}
      {!hideHud && (
        <VectorFeedDock
          events={allArcs}
          selectedAttack={selectedAttack}
          onSelectAttack={setSelectedAttack}
          hoveredArcId={hoveredArcId}
          onHoverArc={setHoveredArcId}
          activeFilter={filterCategory}
          onSelectFilter={setFilterCategory}
          latencyMs={metrics.latencyMs}
        />
      )}

      {/* 4. Geometric Flow Matrix (Section 5.3) */}
      {!hideHud && (
        <VectorFlowMatrix
          metrics={metrics}
          selectedAttack={selectedAttack}
          onClearSelectedAttack={() => setSelectedAttack(null)}
          activeFilter={filterCategory}
          onSelectFilter={setFilterCategory}
        />
      )}

      {/* 5. Geodetic Projection Footer (Section 4) */}
      {!hideHud && (
        <VectorFooter
          activePreset={cameraPreset}
          onSelectPreset={setCameraPreset}
          fps={metrics.fps}
        />
      )}
    </div>
  );
}

export default App;
