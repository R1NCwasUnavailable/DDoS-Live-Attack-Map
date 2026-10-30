import { useState, useEffect, useRef, useCallback } from 'react';

export interface ThreatMeta {
  id: string;
  timestamp: number;
  vector: string;
  protocol: string;
  volumeGbps: number;
  src: string;
  srcCountryName?: string;
  dst: string;
  dstCountryName?: string;
  targetIndustry?: string;
  srcIp?: string;
  asn?: string;
  botnet?: string;
}

export interface ThreatArc {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
  meta: ThreatMeta;
}

export interface ThreatRing {
  lat: number;
  lng: number;
  color: string;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  meta?: ThreatMeta;
}

export interface ThreatPoint {
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
  meta: ThreatMeta;
}

export type StreamState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ThreatStreamMetrics {
  currentLambda: number;
  peakGbps: number;
  activeGbps: number;
  totalReceived: number;
  protocolStats: Record<string, number>;
  topTargets: [string, number][];
  topOrigins: [string, number][];
  latencyMs: number;
  fps: number;
}

const MAX_ARCS = 35;

export function useThreatStream(filterCategory: string = 'ALL') {
  const [arcs, setArcs] = useState<ThreatArc[]>([]);
  const [rings, setRings] = useState<ThreatRing[]>([]);
  const [points, setPoints] = useState<ThreatPoint[]>([]);
  const [streamState, setStreamState] = useState<StreamState>('connecting');
  const [selectedAttack, setSelectedAttack] = useState<ThreatArc | null>(null);
  const [hoveredArcId, setHoveredArcId] = useState<string | null>(null);

  const totalReceivedRef = useRef(0);
  const peakGbpsRef = useRef(78.4);
  const protocolStatsRef = useRef<Record<string, number>>({});
  const targetCountsRef = useRef<Record<string, number>>({});
  const originCountsRef = useRef<Record<string, number>>({});
  const lastPingTimeRef = useRef(Date.now());
  const latencyRef = useRef(24);

  // FPS estimation
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);

  const [metrics, setMetrics] = useState<ThreatStreamMetrics>({
    currentLambda: 4.2,
    peakGbps: 78.4,
    activeGbps: 0,
    totalReceived: 0,
    protocolStats: {},
    topTargets: [],
    topOrigins: [],
    latencyMs: 24,
    fps: 60,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStreamState('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '3000' || window.location.port === '3001' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/threat-stream`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStreamState('connected');
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingTimeRef.current = Date.now();
          ws.send('ping');
        }
      }, 5000);
    };

    ws.onmessage = (event) => {
      try {
        const raw = event.data;
        if (raw.includes('"type": "pong"') || raw === 'pong') {
          latencyRef.current = Math.max(8, Date.now() - lastPingTimeRef.current);
          return;
        }

        const payload: ThreatArc = JSON.parse(raw);
        if (!payload.order || !payload.meta) return;

        totalReceivedRef.current += 1;
        if (payload.meta.volumeGbps > peakGbpsRef.current) {
          peakGbpsRef.current = payload.meta.volumeGbps;
        }

        // Stats tracking
        const vec = payload.meta.vector;
        protocolStatsRef.current[vec] = (protocolStatsRef.current[vec] || 0) + 1;
        const dst = payload.meta.dst;
        targetCountsRef.current[dst] = (targetCountsRef.current[dst] || 0) + 1;
        const src = payload.meta.src;
        originCountsRef.current[src] = (originCountsRef.current[src] || 0) + 1;

        // Bounded Rolling Arc Buffer: clamp to MAX_ARCS (35)
        setArcs((prev) => {
          const next = [...prev, payload];
          if (next.length > MAX_ARCS) {
            return next.slice(-MAX_ARCS);
          }
          return next;
        });

        // Origin pinpoint diamond/point marker
        const newPoint: ThreatPoint = {
          lat: payload.startLat,
          lng: payload.startLng,
          color: payload.color,
          radius: 0.35,
          altitude: 0.012,
          meta: payload.meta,
        };
        setPoints((prev) => {
          const nextPoints = [...prev, newPoint];
          if (nextPoints.length > 30) return nextPoints.slice(-30);
          return nextPoints;
        });

        // Prominent, large dynamic impact shockwave ripple
        // maxR scales between 10 degrees and 26 degrees across the globe
        const dynamicMaxR = Math.min(26, Math.max(9.5, payload.meta.volumeGbps / 4.0));
        const newRing: ThreatRing = {
          lat: payload.endLat,
          lng: payload.endLng,
          color: payload.color,
          maxR: dynamicMaxR,
          propagationSpeed: 3.2,
          repeatPeriod: 650,
          meta: payload.meta,
        };
        setRings((prev) => {
          const nextRings = [...prev, newRing];
          if (nextRings.length > 35) return nextRings.slice(-35);
          return nextRings;
        });
      } catch {
        // Silently discard
      }
    };

    ws.onclose = () => {
      setStreamState('reconnecting');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  // Real-time FPS & Telemetry loop
  useEffect(() => {
    connect();

    let animId: number;
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        fpsRef.current = Math.min(60, Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);

    const metricsTimer = setInterval(() => {
      const topT = Object.entries(targetCountsRef.current)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      const topO = Object.entries(originCountsRef.current)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      setArcs((currentArcs) => {
        const sumActiveGbps = currentArcs.reduce((acc, a) => acc + (a.meta?.volumeGbps || 0), 0);
        setMetrics({
          currentLambda: Math.round((currentArcs.length / 5.0) * 10) / 10 || 4.2,
          peakGbps: Math.round(peakGbpsRef.current * 10) / 10,
          activeGbps: Math.round(sumActiveGbps * 10) / 10,
          totalReceived: totalReceivedRef.current,
          protocolStats: { ...protocolStatsRef.current },
          topTargets: topT,
          topOrigins: topO,
          latencyMs: latencyRef.current,
          fps: fpsRef.current,
        });
        return currentArcs;
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(metricsTimer);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Protocol filtering logic
  const filteredArcs = arcs.filter((a) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'L4') return a.meta.protocol.includes('L4');
    if (filterCategory === 'L7') return a.meta.protocol.includes('L7');
    if (filterCategory === 'CRITICAL > 85G') return a.meta.volumeGbps > 85;
    return a.meta.vector === filterCategory;
  });

  return {
    arcs: filteredArcs,
    allArcs: arcs,
    rings,
    points,
    streamState,
    metrics,
    selectedAttack,
    setSelectedAttack,
    hoveredArcId,
    setHoveredArcId,
  };
}
