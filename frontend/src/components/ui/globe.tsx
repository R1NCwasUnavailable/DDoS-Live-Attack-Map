import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeGlobe from 'three-globe';
import countriesData from '../../data/globe.json';
import type { ThreatArc, ThreatRing, ThreatPoint } from '../../hooks/useThreatStream';

export interface GlobeProps {
  arcs: ThreatArc[];
  rings: ThreatRing[];
  points: ThreatPoint[];
  hoveredArcId?: string | null;
  cameraPreset?: string;
  showGraticule?: boolean;
  isRotating?: boolean;
  rotationSpeed?: number;
  onArcClick?: (arc: ThreatArc) => void;
}

// Direction 2: Precision Signal Beam Color Assignment (Section 2)
function getVectorBeamColor(arc: ThreatArc): string {
  const vol = arc.meta?.volumeGbps || 0;
  if (vol > 85) return '#FF3B30'; // Razor Crimson: Peaks > 85 Gbps
  if (arc.meta?.protocol?.includes('L7')) return '#FFFFFF'; // Pure White: Application-layer HTTP DDoS
  return '#00F0FF'; // Pure Cyan: Transport layer floods (SYN, UDP, DNS)
}

// Build fine celestial graticule mesh (Section 3)
function createGraticuleMesh(radius: number): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
  });

  // Parallels (Latitude lines every 15 degrees)
  for (let lat = -75; lat <= 75; lat += 15) {
    const phi = (lat * Math.PI) / 180;
    const r = radius * Math.cos(phi);
    const y = radius * Math.sin(phi);
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i * 2 * Math.PI) / segments;
      points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geom, material));
  }

  // Meridians (Longitude lines every 30 degrees)
  for (let lon = 0; lon < 360; lon += 30) {
    const theta = (lon * Math.PI) / 180;
    const points: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const phi = (-Math.PI / 2) + (i * Math.PI) / segments;
      const x = radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geom, material));
  }

  return group;
}

export const Globe = ({
  arcs,
  rings,
  points,
  hoveredArcId,
  cameraPreset = 'GLOBAL',
  showGraticule = true,
  isRotating = true,
  rotationSpeed = 0.0022,
  onArcClick,
}: GlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<ThreeGlobe | null>(null);
  const graticuleRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Target camera vector and transition state
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 320));
  const isTransitioningRef = useRef<boolean>(false);

  // Rotation ref to avoid stale closures in animate()
  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  const rotationSpeedRef = useRef(rotationSpeed);
  rotationSpeedRef.current = rotationSpeed;

  useEffect(() => {
    isTransitioningRef.current = true;
    switch (cameraPreset) {
      case 'NA':
        targetCamPosRef.current.set(-130, 110, 220);
        break;
      case 'EMEA':
        targetCamPosRef.current.set(30, 150, 230);
        break;
      case 'APAC':
        targetCamPosRef.current.set(210, 70, 210);
        break;
      case 'GLOBAL':
      default:
        targetCamPosRef.current.set(0, 0, 320);
        break;
    }
  }, [cameraPreset]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup (Absolute void black)
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup (FOV 45, pos [0, 0, 320])
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 320);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Smooth user interaction without freezing globe rotation)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 460;
    controls.autoRotate = false; // We rotate the globe and its graticule directly
    controls.rotateSpeed = 0.8;
    controlsRef.current = controls;

    // 5. Minimalist Optical Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.28);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(300, 300, 300);
    scene.add(keyLight);

    // 6. ThreeGlobe: Pure Vector Wireframe Configuration (Section 3.1 & 3.2)
    const globe = new ThreeGlobe({
      waitForGlobeReady: true,
      animateIn: true,
    })
      // Disable solid continent hex grid dots
      .hexPolygonsData([])
      // Render hollow continental vector boundaries (Section 3.2)
      .polygonsData((countriesData as any).features || [])
      .polygonCapColor(() => 'rgba(0, 0, 0, 0)') // Transparent landmass fill
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor(() => 'rgba(255, 255, 255, 0.24)') // Crisp vector hairline stroke
      .polygonAltitude(0.005)
      // Tight, razor-thin white limb boundary (Section 3.1)
      .showAtmosphere(true)
      .atmosphereColor('#ffffff')
      .atmosphereAltitude(0.08);

    // Core sphere: Pure Void Black
    const globeMaterial = globe.globeMaterial() as THREE.MeshStandardMaterial;
    globeMaterial.color = new THREE.Color('#000000');
    globeMaterial.emissive = new THREE.Color('#000000');
    globeMaterial.emissiveIntensity = 0.0;
    globeMaterial.roughness = 0.95;
    globeMaterial.metalness = 0.0;

    // 7. Trajectory Arcs: Razor-thin vector beams (Section 3.2)
    globe
      .arcStroke(0.65)
      .arcDashLength(0.2)
      .arcDashGap(1.8)
      .arcDashAnimateTime(1400)
      .arcAltitude((d: any) => {
        const dist = Math.hypot(d.endLat - d.startLat, d.endLng - d.startLng);
        return Math.min(0.42, Math.max(0.1, (dist / 180) * 0.36));
      })
      .arcsTransitionDuration(0);

    // 8. Origin Coordinates (Sub-pixel micro marker)
    globe
      .pointColor((d: any) => (d.meta?.volumeGbps > 85 ? '#FF3B30' : '#00F0FF'))
      .pointAltitude(0.01)
      .pointRadius(0.28)
      .pointsTransitionDuration(0);

    // 9. Target Coordinates (Big Dynamic Vector Ripple Waves)
    globe
      .ringColor((d: any) => (t: number) => {
        const alpha = Math.max(0, (1 - t) * 0.95);
        const vol = d.meta?.volumeGbps || 0;
        if (vol > 85) return `rgba(255, 59, 48, ${alpha})`;
        if (d.color?.includes('00F0FF') || d.meta?.protocol?.includes('L4')) {
          return `rgba(0, 240, 255, ${alpha})`;
        }
        return `rgba(255, 255, 255, ${alpha})`;
      })
      .ringMaxRadius((d: any) => d.maxR || 18)
      .ringPropagationSpeed((d: any) => d.propagationSpeed || 3.4)
      .ringRepeatPeriod((d: any) => d.repeatPeriod || 600);

    scene.add(globe);
    globeInstanceRef.current = globe;

    // 10. Celestial Graticule Cage (Section 3)
    const graticule = createGraticuleMesh(100.15);
    scene.add(graticule);
    graticuleRef.current = graticule;

    // 11. Click Handler
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleDblClick = (event: MouseEvent) => {
      if (!onArcClick || !rendererRef.current) return;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(globe.children, true);
      if (intersects.length > 0 && arcs.length > 0) {
        onArcClick(arcs[arcs.length - 1]);
      }
    };
    renderer.domElement.addEventListener('dblclick', handleDblClick);

    // 12. Continuous Celestial Orbit Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Rotate the 3D globe and graticule continuously around the Y axis
      if (isRotatingRef.current) {
        if (globeInstanceRef.current) {
          globeInstanceRef.current.rotation.y += rotationSpeedRef.current;
        }
        if (graticuleRef.current) {
          graticuleRef.current.rotation.y += rotationSpeedRef.current;
        }
      }

      // Smooth camera position interpolation on preset transition
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.05);
        if (camera.position.distanceTo(targetCamPosRef.current) < 1.2) {
          isTransitioningRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 13. Window Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('dblclick', handleDblClick);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  // Toggle graticule visibility
  useEffect(() => {
    if (graticuleRef.current) {
      graticuleRef.current.visible = showGraticule;
    }
  }, [showGraticule]);

  // Update Arcs with Razor Vector Beams & Hover Isolation
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    const globe = globeInstanceRef.current;

    globe.arcColor((d: any) => {
      const beamColor = getVectorBeamColor(d);
      if (!hoveredArcId) return [beamColor, '#ffffff'];
      if (d.meta?.id === hoveredArcId) return ['#ffffff', beamColor];
      return 'rgba(255, 255, 255, 0.04)'; // Dimmed unlit path
    });

    globe.arcStroke((d: any) => {
      if (!hoveredArcId) return 0.65;
      if (d.meta?.id === hoveredArcId) return 1.8;
      return 0.15;
    });

    globe.arcsData(arcs);
  }, [arcs, hoveredArcId]);

  // Update Points
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    globeInstanceRef.current.pointsData(points);
  }, [points]);

  // Update Rings
  useEffect(() => {
    if (!globeInstanceRef.current) return;
    globeInstanceRef.current.ringsData(rings);
  }, [rings]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-black">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default Globe;
