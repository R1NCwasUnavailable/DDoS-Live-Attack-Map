import { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  Wifi,
  WifiOff,
  Crosshair,
  Server,
  Zap,
  Globe2,
  Volume2,
  VolumeX,
  Target,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ThreatArc, ThreatStreamMetrics, StreamState } from '../hooks/useThreatStream';

interface ThreatHUDProps {
  streamState: StreamState;
  metrics: ThreatStreamMetrics;
  recentArcs: ThreatArc[];
  selectedAttack: ThreatArc | null;
  onSelectAttack: (arc: ThreatArc | null) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ThreatHUD = ({
  streamState,
  metrics,
  recentArcs,
  selectedAttack,
  onSelectAttack,
  soundEnabled,
  onToggleSound,
}: ThreatHUDProps) => {
  const [feedCollapsed, setFeedCollapsed] = useState(false);
  const [telemetryCollapsed, setTelemetryCollapsed] = useState(false);

  return (
    <>
      {/* 1. Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Title & Live Status */}
        <div className="glass-panel rounded-xl px-4 py-2.5 flex items-center space-x-3 pointer-events-auto border border-cyan-500/20">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3 h-3 rounded-full ${
                streamState === 'connected'
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping'
                  : 'bg-yellow-500'
              }`}
            />
            <span
              className={`absolute w-2.5 h-2.5 rounded-full ${
                streamState === 'connected' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Global DDoS Attack Map
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                STOCHASTIC v1.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Cloudflare Radar & AbuseIPDB Emulation Engine
            </p>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        <div className="glass-panel rounded-xl px-4 py-2 pointer-events-auto flex items-center space-x-4 md:space-x-6 text-xs border border-cyan-500/20">
          {/* Stream Connection State */}
          <div className="flex items-center space-x-2">
            {streamState === 'connected' ? (
              <Wifi className="w-4 h-4 text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Stream</div>
              <div
                className={`text-xs font-mono font-bold uppercase ${
                  streamState === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {streamState}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Poisson Arrival Rate */}
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Arrival Rate</div>
              <div className="text-xs font-mono font-bold text-cyan-300">
                {metrics.currentLambda} <span className="text-[10px] text-slate-500">/sec (λ)</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Peak Bandwidth */}
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Peak Bandwidth</div>
              <div className="text-xs font-mono font-bold text-amber-300">
                {metrics.peakGbps} <span className="text-[10px] text-slate-500">Gbps</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Active Bandwidth */}
          <div className="hidden sm:flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Active Load</div>
              <div className="text-xs font-mono font-bold text-red-300">
                {metrics.activeGbps} <span className="text-[10px] text-slate-500">Gbps</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Total Events Counter */}
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Intercepted</div>
              <div className="text-xs font-mono font-bold text-purple-300">
                {metrics.totalReceived.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Audio toggle button */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute radar audio' : 'Enable radar audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Real-Time Attack Feed Panel (Bottom-Left) */}
      <aside className="absolute bottom-4 left-4 z-20 pointer-events-none w-80 md:w-96">
        <div className="glass-panel rounded-xl overflow-hidden pointer-events-auto border border-cyan-500/20 shadow-2xl">
          {/* Header */}
          <div className="px-3 py-2 bg-slate-900/70 border-b border-cyan-500/15 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
                Live Attack Trajectories
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-950/80 text-red-400 rounded border border-red-500/30">
                {recentArcs.length} active
              </span>
            </div>
            <button
              onClick={() => setFeedCollapsed(!feedCollapsed)}
              className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            >
              {feedCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Body */}
          {!feedCollapsed && (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {recentArcs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  Synthesizing threat vectors from upstream feeds...
                </div>
              ) : (
                recentArcs
                  .slice()
                  .reverse()
                  .map((arc) => {
                    const isSelected = selectedAttack?.meta.id === arc.meta.id;
                    return (
                      <div
                        key={arc.meta.id}
                        onClick={() => onSelectAttack(isSelected ? null : arc)}
                        className={`p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/60 border border-cyan-400/50'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          {/* Origin -> Target */}
                          <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                              {arc.meta.src}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                              {arc.meta.dst}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans truncate max-w-[100px]">
                              {arc.meta.targetIndustry}
                            </span>
                          </div>

                          {/* Volume Gbps Badge */}
                          <div
                            className="text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-sm"
                            style={{
                              backgroundColor: `${arc.color}20`,
                              color: arc.color,
                              border: `1px solid ${arc.color}50`,
                            }}
                          >
                            {arc.meta.volumeGbps} Gbps
                          </div>
                        </div>

                        {/* Vector & IP info */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-slate-300">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: arc.color }}
                            />
                            {arc.meta.vector}
                          </span>
                          <span className="text-slate-500 truncate max-w-[140px]">
                            {arc.meta.asn || arc.meta.srcIp}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </aside>

      {/* 3. Top Origin & Target Telemetry Panel (Top-Right / Middle-Right) */}
      <div className="absolute top-20 right-4 z-20 pointer-events-none hidden lg:block w-72">
        <div className="glass-panel rounded-xl p-3 border border-cyan-500/20 pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/15 mb-2.5">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              Geo Probability Matrix
            </span>
            <button
              onClick={() => setTelemetryCollapsed(!telemetryCollapsed)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {telemetryCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!telemetryCollapsed && (
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              {/* Top Targets */}
              <div>
                <div className="text-[10px] text-red-400 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Top Targets
                </div>
                <div className="space-y-1">
                  {metrics.topTargets.slice(0, 4).map(([country, count], i) => (
                    <div
                      key={country}
                      className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded font-mono text-[10px]"
                    >
                      <span className="text-slate-300">
                        #{i + 1} {country}
                      </span>
                      <span className="text-red-400 font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Origins */}
              <div>
                <div className="text-[10px] text-cyan-400 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Crosshair className="w-3 h-3" /> Top Origins
                </div>
                <div className="space-y-1">
                  {metrics.topOrigins.slice(0, 4).map(([country, count], i) => (
                    <div
                      key={country}
                      className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded font-mono text-[10px]"
                    >
                      <span className="text-slate-300">
                        #{i + 1} {country}
                      </span>
                      <span className="text-cyan-400 font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Threat Inspector Modal / Card (when an arc is selected) */}
      {selectedAttack && (
        <div className="absolute top-20 left-4 z-30 pointer-events-auto w-84 glass-panel-glow rounded-xl p-4 border border-cyan-400/60 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-3">
            <div className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedAttack.color }}
              />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                {selectedAttack.meta.id}
              </span>
            </div>
            <button
              onClick={() => onSelectAttack(null)}
              className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Attack Vector:</span>
              <span className="text-slate-200 font-bold" style={{ color: selectedAttack.color }}>
                {selectedAttack.meta.vector}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Layer / Protocol:</span>
              <span className="text-slate-200">{selectedAttack.meta.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Bandwidth Volume:</span>
              <span className="text-amber-400 font-bold">{selectedAttack.meta.volumeGbps} Gbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Origin Country:</span>
              <span className="text-slate-200">
                {selectedAttack.meta.srcCountryName || selectedAttack.meta.src} ({selectedAttack.meta.src})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Country:</span>
              <span className="text-red-300 font-semibold">
                {selectedAttack.meta.dstCountryName || selectedAttack.meta.dst} ({selectedAttack.meta.dst})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Sector:</span>
              <span className="text-cyan-300">{selectedAttack.meta.targetIndustry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Source Node IP:</span>
              <span className="text-slate-300">{selectedAttack.meta.srcIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Autonomous System:</span>
              <span className="text-slate-300 truncate max-w-[160px]">{selectedAttack.meta.asn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Botnet Profile:</span>
              <span className="text-orange-400">{selectedAttack.meta.botnet}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThreatHUD;
