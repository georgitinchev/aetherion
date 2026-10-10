"use client";

import { Center, Environment, Float, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

export type HolocronState = "idle" | "channeling";

const MODEL_URL = "/models/holocron.obj";

// The OBJ ships four materials (see holocron.mtl): two big crystal panels
// (.001 outer, .002 inner core) and two bronze filigree frames (.004/.005).
// We swap them for PBR materials: translucent panels let the emissive core
// glow through, and only the core is bright enough to feed the bloom pass.
const panel = new THREE.MeshPhysicalMaterial({
  color: "#0a1a33",
  metalness: 0.1,
  roughness: 0.25,
  emissive: "#0f4aa3",
  emissiveIntensity: 0.7,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const glow = new THREE.MeshStandardMaterial({
  color: "#9fe0ff",
  emissive: "#4cc3ff",
  emissiveIntensity: 2.4,
  toneMapped: false,
});
const frame = new THREE.MeshStandardMaterial({
  color: "#a87532",
  metalness: 1,
  roughness: 0.38,
});
const MATERIALS: Record<string, THREE.Material> = {
  "Material.001": panel,
  "Material.002": glow,
  "Material.004": frame,
  "Material.005": frame,
};

const SPIN = { idle: 0.35, channeling: 2.6 };
const GLOW = { idle: 3.2, channeling: 6 };
const REST_TILT = 0.42;
/** Radians of rotation per pixel dragged. */
const DRAG_SPEED = 0.008;
const MAX_FLICK = 12;

type DragState = {
  active: boolean;
  x: number;
  y: number;
  time: number;
  /** Rotation accumulated since the last frame. */
  dx: number;
  dy: number;
  /** Spin velocity (rad/s) carried over after a flick. */
  momentum: number;
};


function Holocron({ state }: { state: HolocronState }) {
  const source = useLoader(OBJLoader, MODEL_URL);
  const group = useRef<THREE.Group>(null);
  const speed = useRef(SPIN.idle);
  const drag = useRef<DragState>({ active: false, x: 0, y: 0, time: 0, dx: 0, dy: 0, momentum: 0 });
  const canvas = useThree((s) => s.gl.domElement);

  // Grab-and-spin: pointer moves are accumulated here and applied in the frame
  // loop. On release the spin keeps its momentum, then eases back to idle.
  useEffect(() => {
    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      Object.assign(drag.current, { active: true, x: e.clientX, y: e.clientY, time: e.timeStamp, momentum: 0 });
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = (e.clientX - d.x) * DRAG_SPEED;
      const dt = Math.max(e.timeStamp - d.time, 1) / 1000;
      d.dx += dx;
      d.dy += (e.clientY - d.y) * DRAG_SPEED;
      d.momentum = THREE.MathUtils.clamp(dx / dt, -MAX_FLICK, MAX_FLICK);
      Object.assign(d, { x: e.clientX, y: e.clientY, time: e.timeStamp });
    };
    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      // Holding still before letting go means no flick.
      if (e.type === "pointercancel" || e.timeStamp - d.time > 80) d.momentum = 0;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [canvas]);

  const model = useMemo(() => {
    const clone = source.clone(true);
    clone.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const remap = (m: THREE.Material) => MATERIALS[m.name] ?? panel;
      node.material = Array.isArray(node.material) ? node.material.map(remap) : remap(node.material);
    });
    return clone;
  }, [source]);

  useFrame(({ clock, pointer }, delta) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const d = drag.current;
    if (d.active) {
      g.rotation.y += d.dx;
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + d.dy, -1.2, 1.6);
      d.dx = d.dy = 0;
      speed.current = 0;
    } else {
      // Flick momentum fades while the idle spin ramps back up.
      d.momentum = THREE.MathUtils.damp(d.momentum, 0, 2.5, delta);
      speed.current = THREE.MathUtils.damp(speed.current, SPIN[state], 1.2, delta);
      g.rotation.y += (speed.current + d.momentum) * delta;
      // Settle back to the resting tilt, leaning gently towards the cursor.
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, REST_TILT - pointer.y * 0.18, 2, delta);
    }
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, d.active ? 0 : -pointer.x * 0.12, 3, delta);
    const pulse = state === "channeling" ? Math.sin(t * 9) * 1.2 : Math.sin(t * 1.6) * 0.4;
    glow.emissiveIntensity = THREE.MathUtils.damp(glow.emissiveIntensity, GLOW[state] + pulse, 6, delta);
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
      <group ref={group} scale={2.25}>
        <Center>
          <primitive object={model} />
        </Center>
      </group>
    </Float>
  );
}

export default function HolocronScene({ state = "idle" }: { state?: HolocronState }) {
  return (
    <Canvas
      camera={{ position: [0, 0.35, 5.2], fov: 35 }}
      dpr={[1, 1.75]}
      className="holocron-canvas"
      // Vertical swipes keep scrolling the page on touch screens.
      style={{ touchAction: "pan-y" }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={4} distance={3} color="#4cc3ff" />
      <directionalLight position={[3, 4, 2]} intensity={1.4} color="#cfe8ff" />
      <directionalLight position={[-4, -1, -3]} intensity={0.5} color="#ffcf8a" />
      <Suspense fallback={null}>
        <Holocron state={state} />
        {/* Local lightformers instead of an HDRI: no network fetch, cheap reflections. */}
        <Environment resolution={128}>
          <Lightformer form="ring" intensity={2} color="#5cc8ff" position={[0, 3, -4]} scale={4} />
          <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[4, 1, 2]} scale={[2, 4, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#3a6fd8" position={[-4, -1, 1]} scale={[2, 3, 1]} />
        </Environment>
      </Suspense>
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.6} radius={0.8} />
      </EffectComposer>
    </Canvas>
  );
}
