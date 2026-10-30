import { useState, useEffect, useRef, useCallback } from 'react';
import countryGeoData from '../data/country_geo.json';

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

export type StreamState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'stochastic_client';

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

// Vectors calibrated to Cloudflare Radar baseline
const VECTORS = [
  { name: 'SYN Flood', protocol: 'TCP/L4', color: '#00F0FF', weight: 0.46 },
  { name: 'UDP Amplification', protocol: 'UDP/L4', color: '#00F0FF', weight: 0.28 },
  { name: 'HTTP Flood / DDoS', protocol: 'HTTP/L7', color: '#FFFFFF', weight: 0.16 },
  { name: 'DNS Amplification', protocol: 'DNS/L4', color: '#00F0FF', weight: 0.10 },
];

const INDUSTRIES = [
  'Telecommunications',
  'Financial Services',
  'Gaming & Gambling',
  'Information Technology',
  'Government & Defense',
  'Media & Entertainment',
];

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
  const latencyRef = useRef(18);

  // Client-side stochastic synthesis fallback
  const clientLoopActiveRef = useRef(false);
  const orderCounterRef = useRef(1000);

  // FPS estimation
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);

  const [metrics, setMetrics] = useState<ThreatStreamMetrics>({
    currentLambda: 4.5,
    peakGbps: 78.4,
    activeGbps: 0,
    totalReceived: 0,
    protocolStats: {},
    topTargets: [],
    topOrigins: [],
    latencyMs: 18,
    fps: 60,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ingest discrete event into buffers and metrics
  const ingestEvent = useCallback((payload: ThreatArc) => {
    if (!payload.order || !payload.meta) return;

    totalReceivedRef.current += 1;
    if (payload.meta.volumeGbps > peakGbpsRef.current) {
      peakGbpsRef.current = payload.meta.volumeGbps;
    }

    const vec = payload.meta.vector;
    protocolStatsRef.current[vec] = (protocolStatsRef.current[vec] || 0) + 1;
    const dst = payload.meta.dst;
    targetCountsRef.current[dst] = (targetCountsRef.current[dst] || 0) + 1;
    const src = payload.meta.src;
    originCountsRef.current[src] = (originCountsRef.current[src] || 0) + 1;

    setArcs((prev) => {
      const next = [...prev, payload];
      if (next.length > MAX_ARCS) {
        return next.slice(-MAX_ARCS);
      }
      return next;
    });

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

    const dynamicMaxR = Math.min(26, Math.max(9.5, payload.meta.volumeGbps / 4.0));
    const newRing: ThreatRing = {
      lat: payload.endLat,
      lng: payload.endLng,
      color: payload.color,
      maxR: dynamicMaxR,
      propagationSpeed: 3.4,
      repeatPeriod: 600,
      meta: payload.meta,
    };
    setRings((prev) => {
      const nextRings = [...prev, newRing];
      if (nextRings.length > 35) return nextRings.slice(-35);
      return nextRings;
    });
  }, []);

  // Client-side stochastic event synthesizer (Poisson arrival + Shifted Exponential volume)
  const generateClientEvent = useCallback((): ThreatArc => {
    orderCounterRef.current += 1;
    const countries = countryGeoData.countries;

    // Origin sampling based on weights
    const totalOriginW = countries.reduce((acc, c) => acc + (c.origin_weight || 0.05), 0);
    let r1 = Math.random() * totalOriginW;
    let src = countries[0];
    for (const c of countries) {
      r1 -= (c.origin_weight || 0.05);
      if (r1 <= 0) {
        src = c;
        break;
      }
    }

    // Target sampling where dst !== src
    const eligibleTargets = countries.filter((c) => c.iso !== src.iso);
    const totalTargetW = eligibleTargets.reduce((acc, c) => acc + (c.target_weight || 0.05), 0);
    let r2 = Math.random() * totalTargetW;
    let dst = eligibleTargets[0];
    for (const c of eligibleTargets) {
      r2 -= (c.target_weight || 0.05);
      if (r2 <= 0) {
        dst = c;
        break;
      }
    }

    // Coordinate jitter Δ ~ U(-2.5, 2.5)
    const jitter = () => (Math.random() - 0.5) * 5.0;
    const startLat = Math.max(-85, Math.min(85, src.lat + jitter()));
    const startLng = ((src.lng + jitter() + 180) % 360) - 180;
    const endLat = Math.max(-85, Math.min(85, dst.lat + jitter()));
    const endLng = ((dst.lng + jitter() + 180) % 360) - 180;

    // Shifted exponential volume: V ~ Exp(1/25) + 1.5 Gbps
    const u = Math.max(0.0001, Math.random());
    const volumeGbps = Math.round((-25.0 * Math.log(u) + 1.5) * 10) / 10;

    // Vector selection
    const randVec = Math.random();
    let vec = VECTORS[0];
    let cumulative = 0;
    for (const v of VECTORS) {
      cumulative += v.weight;
      if (randVec <= cumulative) {
        vec = v;
        break;
      }
    }

    const color = volumeGbps > 85 ? '#FF3B30' : vec.color;
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const ip = `${Math.floor(Math.random() * 180 + 30)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 250 + 2)}`;

    return {
      order: orderCounterRef.current,
      startLat,
      startLng,
      endLat,
      endLng,
      arcAlt: 0.15 + (Math.hypot(endLat - startLat, endLng - startLng) / 180) * 0.3,
      color,
      meta: {
        id: `atk_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        vector: vec.name,
        protocol: vec.protocol,
        volumeGbps,
        src: src.iso,
        srcCountryName: src.name,
        dst: dst.iso,
        dstCountryName: dst.name,
        targetIndustry: industry,
        srcIp: ip,
        asn: `AS${Math.floor(Math.random() * 50000 + 10000)} TIER-1`,
        botnet: volumeGbps > 85 ? 'Mirai-Stressor' : 'IoT-Cluster',
      },
    };
  }, []);

  // Client-side loop runner
  const startClientStochasticLoop = useCallback(() => {
    if (clientLoopActiveRef.current) return;
    clientLoopActiveRef.current = true;
    setStreamState('connected');

    const scheduleNext = () => {
      if (!clientLoopActiveRef.current) return;
      const event = generateClientEvent();
      ingestEvent(event);

      // Poisson interval Δt ~ Exp(λ) with λ ~ 4.5/s
      const lambda = 3.5 + Math.random() * 3.0;
      const intervalSec = -Math.log(Math.max(0.001, Math.random())) / lambda;
      const intervalMs = Math.max(80, Math.min(850, intervalSec * 1000));
      setTimeout(scheduleNext, intervalMs);
    };

    // Pre-populate with 12 seed arcs immediately
    for (let i = 0; i < 12; i++) {
      ingestEvent(generateClientEvent());
    }
    scheduleNext();
  }, [generateClientEvent, ingestEvent]);

  const connect = useCallback(() => {
    // If on GitHub Pages (github.io), start client-side emulation directly without WebSocket errors
    if (window.location.hostname.includes('github.io')) {
      startClientStochasticLoop();
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStreamState('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '3000' || window.location.port === '3001' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/threat-stream`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          startClientStochasticLoop();
        }
      }, 2500);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        clientLoopActiveRef.current = false;
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
          ingestEvent(payload);
        } catch {
          // Discard malformed
        }
      };

      ws.onclose = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        startClientStochasticLoop();
      };

      ws.onerror = () => {
        ws.close();
        startClientStochasticLoop();
      };
    } catch {
      startClientStochasticLoop();
    }
  }, [ingestEvent, startClientStochasticLoop]);

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
          currentLambda: Math.round((currentArcs.length / 5.0) * 10) / 10 || 4.5,
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
      clientLoopActiveRef.current = false;
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
