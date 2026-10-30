import { X, Radio } from 'lucide-react';
import type { ThreatArc, ThreatStreamMetrics } from '../../hooks/useThreatStream';

interface PhosphorSectorDockProps {
  metrics: ThreatStreamMetrics;
  selectedAttack: ThreatArc | null;
  onClearSelectedAttack: () => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

const PROTOCOL_CONFIG = [
  { name: 'SYN Flood', label: 'SYN_FLOOD', layer: 'TCP/L4' },
  { name: 'UDP Amplification', label: 'UDP_AMPLIF', layer: 'UDP/L4' },
  { name: 'HTTP Flood / DDoS', label: 'HTTP_DDOS', layer: 'HTTP/L7' },
  { name: 'DNS Amplification', label: 'DNS_REFLECT', layer: 'DNS/L4' },
];

const INDUSTRIES_MOCK = [
  { name: 'TELECOM', pct: 38 },
  { name: 'FIN_SERVICES', pct: 31 },
  { name: 'GOV_DEFENSE', pct: 22 },
  { name: 'GAMING_MEDIA', pct: 9 },
];

export const PhosphorSectorDock = ({
  metrics,
  selectedAttack,
  onClearSelectedAttack,
  activeFilter,
  onSelectFilter,
}: PhosphorSectorDockProps) => {
  const totalVectorCount = Object.values(metrics.protocolStats).reduce((a, b) => a + b, 0) || 1;
  const maxTargetCount = metrics.topTargets[0]?.[1] || 1;

  // Render ASCII '#' hash bar
  const renderHashBar = (current: number, max: number) => {
    const totalSlots = 18;
    const filled = Math.max(1, Math.round((current / max) * totalSlots));
    const empty = totalSlots - filled;
    return `[${'#'.repeat(filled)}${'.'.repeat(empty)}]`;
  };

  // Render Block '█' bar
  const renderBlockBar = (pct: number) => {
    const totalSlots = 16;
    const filled = Math.max(1, Math.round((pct / 100) * totalSlots));
    const empty = totalSlots - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  };

  return (
    <aside className="w-80 md:w-92 h-full bg-[#041009]/95 border-l border-[#22c55e]/40 p-3 font-mono flex flex-col justify-between shadow-[0_0_15px_rgba(34,197,94,0.15)] select-none z-20 relative">
      <div className="flex-1 flex flex-col overflow-y-auto space-y-4 pr-1">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#22c55e]/30 pb-1.5 shrink-0">
          <span className="text-[11px] font-bold tracking-wider text-[#4ade80] flex items-center gap-1.5 font-phosphor">
            <Radio className="w-3.5 h-3.5 text-[#22c55e]" />
            [02] SECTOR_ATTACK_DENSITY
          </span>
          <span className="text-[9px] text-[#15803d]">[FREQ_MATRIX]</span>
        </div>

        {/* 1. Sector Attack Density (ASCII Hash Bars) */}
        <div>
          <div className="text-[10px] text-[#16a34a] uppercase font-bold mb-1.5">
            // TOP TARGET REGIONS
          </div>
          <div className="space-y-1 bg-[#030b06] p-2 border border-[#22c55e]/25">
            {metrics.topTargets.length === 0 ? (
              <div className="text-[9px] text-[#15803d] font-mono py-1">[ AWAITING_PINGS ]</div>
            ) : (
              metrics.topTargets.slice(0, 5).map(([country, count]) => {
                const pct = Math.round((count / totalVectorCount) * 100);
                return (
                  <div key={country} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="w-7 text-[#4ade80] font-bold">{country}:</span>
                    <span className="text-[#22c55e] font-mono tracking-tighter">
                      {renderHashBar(count, maxTargetCount)}
                    </span>
                    <span className="text-[#86efac] font-bold tabular-nums text-right w-9">
                      {pct}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Protocol Breakdown (Block Bars) */}
        <div>
          <div className="text-[10px] text-[#16a34a] uppercase font-bold mb-1.5 flex items-center justify-between">
            <span>// PROTOCOL SPECTRUM</span>
            {activeFilter !== 'ALL' && (
              <button
                onClick={() => onSelectFilter('ALL')}
                className="text-[9px] text-[#86efac] hover:underline cursor-pointer"
              >
                [RESET]
              </button>
            )}
          </div>

          <div className="space-y-1 bg-[#030b06] p-2 border border-[#22c55e]/25">
            {PROTOCOL_CONFIG.map((p) => {
              const count = metrics.protocolStats[p.name] || 0;
              const pct = Math.round((count / totalVectorCount) * 100);
              const isSelected = activeFilter === p.name;

              return (
                <div
                  key={p.name}
                  onClick={() => onSelectFilter(isSelected ? 'ALL' : p.name)}
                  className={`p-1 transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-[#22c55e]/20 border-[#4ade80] text-[#86efac]'
                      : 'border-transparent hover:bg-[#22c55e]/10 text-[#22c55e]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold">{p.label}</span>
                    <span className="text-[9px] text-[#15803d]">[{p.layer}]</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] tracking-tight">
                    <span className="text-[#4ade80]">{renderBlockBar(pct)}</span>
                    <span className="font-bold tabular-nums text-[#86efac]">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Target Industry Sectors */}
        <div>
          <div className="text-[10px] text-[#16a34a] uppercase font-bold mb-1.5">
            // TARGETED INDUSTRY VERTICALS
          </div>
          <div className="space-y-1 bg-[#030b06] p-2 border border-[#22c55e]/25 text-[10px]">
            {INDUSTRIES_MOCK.map((ind) => (
              <div key={ind.name} className="flex justify-between items-center text-[#22c55e]">
                <span>{ind.name.padEnd(14, '.')}</span>
                <span className="text-[#86efac] font-bold tabular-nums">{ind.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Threat Intercept Dossier (Section 5) */}
        {selectedAttack && (
          <div className="bg-[#030b06] border border-[#22c55e] p-2.5 space-y-1.5 shadow-[0_0_12px_rgba(34,197,94,0.2)]">
            <div className="flex items-center justify-between border-b border-[#22c55e]/40 pb-1">
              <span className="text-[10px] font-bold text-[#86efac] uppercase font-phosphor">
                DOSSIER // {selectedAttack.meta.id}
              </span>
              <button
                onClick={onClearSelectedAttack}
                className="text-[#22c55e] hover:text-[#86efac] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1 text-[10px] font-mono text-[#22c55e]">
              <div className="flex justify-between">
                <span className="text-[#15803d]">VECTOR:</span>
                <span className="text-[#4ade80] font-bold">{selectedAttack.meta.vector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#15803d]">VOLUMETRIC:</span>
                <span className="text-[#f59e0b] font-bold font-phosphor-amber">
                  {selectedAttack.meta.volumeGbps.toFixed(1)} GBPS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#15803d]">ROUTE:</span>
                <span className="text-[#86efac]">
                  {selectedAttack.meta.src} =&gt; {selectedAttack.meta.dst} ({selectedAttack.meta.targetIndustry})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#15803d]">SOURCE IP:</span>
                <span className="text-[#86efac]">{selectedAttack.meta.srcIp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#15803d]">ASN:</span>
                <span className="truncate max-w-[130px] text-[#4ade80]">{selectedAttack.meta.asn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#15803d]">BOTNET:</span>
                <span className="text-[#f59e0b] font-bold">{selectedAttack.meta.botnet}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="border-t border-[#22c55e]/30 pt-2 text-[9px] text-[#16a34a] flex justify-between uppercase shrink-0 mt-2">
        <span>RADAR_DEFCON: LEVEL_1</span>
        <span>SCAN: 360_SWEEP</span>
      </div>
    </aside>
  );
};

export default PhosphorSectorDock;

