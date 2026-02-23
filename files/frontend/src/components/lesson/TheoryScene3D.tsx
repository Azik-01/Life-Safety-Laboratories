import { useRef, useMemo, useState, useCallback } from 'react';
import { Box, Paper, Slider, Stack, Typography } from '@mui/material';
import { Environment, OrbitControls, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SafeCanvas from '../SafeCanvas';
import type { TheorySimulatorType } from '../../types/theme';

/* ─────────────── Reusable scene furniture ─────────────── */

function Room({ width = 10, depth = 8, height = 3.2, wallColor = '#e8e0d6' }: {
  width?: number; depth?: number; height?: number; wallColor?: string;
}) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#8a8578" roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f2ec" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  );
}

function Desk({ position = [0, 0, 0] as [number, number, number], width = 1.2, depth = 0.6 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial color="#b8956a" roughness={0.6} />
      </mesh>
      {[[-0.5, 0, -0.22], [0.5, 0, -0.22], [-0.5, 0, 0.22], [0.5, 0, 0.22]].map((leg, i) => (
        <mesh key={i} position={[leg[0] * (width / 1.2), 0.36, leg[2]]} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color="#7d5c4f" />
        </mesh>
      ))}
    </group>
  );
}

function Chair({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      <mesh position={[0, 0.72, -0.18]} castShadow>
        <boxGeometry args={[0.4, 0.56, 0.04]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {[[-0.16, 0, -0.16], [0.16, 0, -0.16], [-0.16, 0, 0.16], [0.16, 0, 0.16]].map((leg, i) => (
        <mesh key={i} position={[leg[0], 0.21, leg[2]]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.42, 6]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────── Light-Flux Scene ─────────────── */

function LightFluxScene({ intensity, solidAngle }: { intensity: number; solidAngle: number }) {
  const coneRef = useRef<THREE.Mesh>(null);
  const flux = intensity * solidAngle;
  const coneAngle = Math.min(Math.PI * 0.45, solidAngle * 0.4);

  useFrame((_, delta) => {
    if (coneRef.current) {
      coneRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <>
      <Room width={6} depth={5} height={3} />
      <Desk position={[0, 0, 0.5]} />
      {/* Lamp body */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial emissive="#ffd39b" emissiveIntensity={Math.min(2, flux / 1000)} color="#ffd39b" />
      </mesh>
      {/* Light cone visualization */}
      <mesh ref={coneRef} position={[0, 1.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[Math.tan(coneAngle) * 1.8, 1.8, 24, 1, true]} />
        <meshBasicMaterial color="#ffd39b" transparent opacity={0.12 + flux / 8000} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color="#ffd39b" intensity={flux / 400} distance={8} decay={2} castShadow />
      {/* Labels */}
      <Text fontSize={0.14} color="#ffeedd" position={[0, 2.8, 0]}>
        {`I = ${intensity} кд`}
      </Text>
      <Text fontSize={0.12} color="#bbddff" position={[0, 0.85, 0.5]}>
        {`Φ = ${flux.toFixed(0)} лм`}
      </Text>
    </>
  );
}

/* ─────────────── Illuminance Scene ─────────────── */

function IlluminanceScene({ flux, area }: { flux: number; area: number }) {
  const illuminance = area > 0 ? flux / area : 0;
  const gridSize = Math.sqrt(area);

  return (
    <>
      <Room width={8} depth={6} height={3} />
      {/* Work surface with illuminance coloring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          color={illuminance > 500 ? '#fffde0' : illuminance > 200 ? '#e8e0b0' : '#888070'}
          roughness={0.8}
        />
      </mesh>
      {/* Grid lines to show area */}
      {Array.from({ length: Math.ceil(gridSize) + 1 }).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[-gridSize / 2 + i, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.01, gridSize]} />
            <meshBasicMaterial color="#555" />
          </mesh>
          <mesh position={[0, 0.02, -gridSize / 2 + i]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.01, gridSize]} />
            <meshBasicMaterial color="#555" />
          </mesh>
        </group>
      ))}
      {/* Light source above */}
      <pointLight position={[0, 2.8, 0]} color="#fff5e0" intensity={flux / 500} distance={6} decay={2} castShadow />
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial emissive="#ffeebb" emissiveIntensity={1} />
      </mesh>
      <Text fontSize={0.16} color="#ffeedd" position={[0, 0.4, gridSize / 2 + 0.3]}>
        {`E = ${illuminance.toFixed(0)} лк`}
      </Text>
      <Text fontSize={0.1} color="#aabbcc" position={[gridSize / 2 + 0.1, 0.2, 0]}>
        {`S = ${area.toFixed(1)} м²`}
      </Text>
    </>
  );
}

/* ─────────────── Pulsation Scene ─────────────── */

function PulsationScene({ eMax, eMin, eAvg }: { eMax: number; eMin: number; eAvg: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const kp = eAvg > 0 ? ((eMax - eMin) / (2 * eAvg)) * 100 : 0;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!lightRef.current) return;
    // Simulate pulsation at 100 Hz (scaled for visibility)
    const t = timeRef.current * 8; // visible pulsation
    const frac = (Math.sin(t) + 1) / 2;
    const intensity = (eMin + frac * (eMax - eMin)) / 200;
    lightRef.current.intensity = Math.max(0.1, intensity);
  });

  return (
    <>
      <Room width={8} depth={6} height={3} />
      <Desk position={[-1.5, 0, 0.5]} />
      <Desk position={[1.5, 0, 0.5]} />
      <Chair position={[-1.5, 0, 1.2]} />
      <Chair position={[1.5, 0, 1.2]} />
      {/* Fluorescent lamp */}
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.12]} />
        <meshStandardMaterial emissive="#f0fff0" emissiveIntensity={0.5} color="#e8f8e8" />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.8, 0]} color="#f0fff0" intensity={eAvg / 200} distance={6} decay={2} castShadow />
      {/* Rotating object to demonstrate stroboscopic effect */}
      <RotatingWheel position={[0, 1.2, -1]} />
      <Text fontSize={0.14} color={kp > 10 ? '#ff6b6b' : '#9be37d'} position={[0, 0.5, 2]}>
        {`Kп = ${kp.toFixed(1)}%`}
      </Text>
      <Text fontSize={0.1} color="#aaa" position={[0, 0.3, 2]}>
        {kp > 10 ? '⚠ Повышенная пульсация!' : '✓ Норма'}
      </Text>
    </>
  );
}

function RotatingWheel({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 12;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 24]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]} position={[0.2 * Math.cos((i * Math.PI) / 3), 0.2 * Math.sin((i * Math.PI) / 3), 0.03]}>
          <boxGeometry args={[0.06, 0.35, 0.02]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#fff' : '#222'} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────── Room Index Scene ─────────────── */

function RoomIndexScene({ length, width, height }: { length: number; width: number; height: number }) {
  const hp = Math.max(0.5, height - 0.3);
  const idx = (length * width) / (hp * (length + width));

  return (
    <>
      <Room width={length} depth={width} height={height} wallColor="#d4cec4" />
      {/* Measurement arrows */}
      <mesh position={[0, 0.03, width / 2 + 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.04]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <Text fontSize={0.12} color="#e74c3c" position={[0, 0.15, width / 2 + 0.3]}>
        {`L = ${length.toFixed(1)} м`}
      </Text>
      <mesh position={[length / 2 + 0.15, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[width, 0.04]} />
        <meshBasicMaterial color="#3498db" />
      </mesh>
      <Text fontSize={0.12} color="#3498db" position={[length / 2 + 0.4, 0.15, 0]}>
        {`B = ${width.toFixed(1)} м`}
      </Text>
      {/* Height line */}
      <mesh position={[-length / 2 + 0.15, height / 2, -width / 2 + 0.08]}>
        <boxGeometry args={[0.02, height, 0.02]} />
        <meshBasicMaterial color="#2ecc71" />
      </mesh>
      <Text fontSize={0.1} color="#2ecc71" position={[-length / 2 + 0.5, height / 2, -width / 2 + 0.2]}>
        {`H = ${height.toFixed(1)} м`}
      </Text>
      {/* Hp line */}
      <mesh position={[-length / 2 + 0.3, (hp + 0.3) / 2 + 0.15, -width / 2 + 0.08]}>
        <boxGeometry args={[0.015, hp, 0.015]} />
        <meshBasicMaterial color="#f39c12" />
      </mesh>
      <Text fontSize={0.1} color="#f39c12" position={[-length / 2 + 0.7, hp / 2 + 0.2, -width / 2 + 0.2]}>
        {`Hp = ${hp.toFixed(2)} м`}
      </Text>
      {/* Luminaires grid */}
      {Array.from({ length: 3 }).map((_, i) =>
        Array.from({ length: 2 }).map((_, j) => (
          <mesh key={`lum-${i}-${j}`} position={[-length / 3 + i * (length / 3), height - 0.05, -width / 4 + j * (width / 2)]}>
            <boxGeometry args={[0.5, 0.03, 0.1]} />
            <meshStandardMaterial emissive="#fff5e0" emissiveIntensity={0.6} color="#eee" />
          </mesh>
        )),
      )}
      <pointLight position={[0, height - 0.1, 0]} color="#fff5e0" intensity={2} distance={height + 2} decay={2} />
      <Text fontSize={0.18} color="#ffeedd" position={[0, 0.5, 0]}>
        {`i = ${idx.toFixed(3)}`}
      </Text>
    </>
  );
}

/* ─────────────── Noise Distance Scene ─────────────── */

function NoiseDistanceScene({ level, distance }: { level: number; distance: number }) {
  const levelAtR = level - 20 * Math.log10(Math.max(0.5, distance)) - 8;
  const waveRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!waveRef.current) return;
    waveRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const t = (timeRef.current * 0.8 + i * 0.5) % 3;
      mesh.scale.set(0.3 + t, 0.3 + t, 0.3 + t);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.02, 0.4 - t * 0.12);
    });
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#3f4e55" roughness={0.9} />
      </mesh>
      {/* Noise source machine */}
      <mesh position={[-4, 0.8, 0]} castShadow>
        <boxGeometry args={[1.2, 1.6, 1.0]} />
        <meshStandardMaterial color="#c0392b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-4, 1.8, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      <Text fontSize={0.15} color="#ff8a65" position={[-4, 2.3, 0]}>
        {`L₁ = ${level} дБ`}
      </Text>
      {/* Sound waves */}
      <group ref={waveRef} position={[-4, 1.2, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[1, 0.015, 8, 32]} />
            <meshBasicMaterial color="#ff8a65" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
      {/* Distance line */}
      <mesh position={[-4 + distance / 2, 0.03, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[distance, 0.03]} />
        <meshBasicMaterial color="#ffd43b" />
      </mesh>
      <Text fontSize={0.12} color="#ffd43b" position={[-4 + distance / 2, 0.2, 1.8]}>
        {`R = ${distance.toFixed(1)} м`}
      </Text>
      {/* Observer */}
      <group position={[-4 + distance, 0, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.18, 0.5, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffd6b6" />
        </mesh>
        <Text fontSize={0.14} color={levelAtR > 80 ? '#ff6b6b' : '#9be37d'} position={[0, 1.9, 0]}>
          {`LR = ${levelAtR.toFixed(1)} дБ`}
        </Text>
      </group>
    </>
  );
}

/* ─────────────── Noise Barrier Scene ─────────────── */

function NoiseBarrierScene({ mass, levelBefore }: { mass: number; levelBefore: number }) {
  const N = 14.5 + 15 * Math.log10(Math.max(10, mass));
  const levelAfter = levelBefore - N;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#3f4e55" />
      </mesh>
      {/* Source */}
      <mesh position={[-3, 1, 0]} castShadow>
        <boxGeometry args={[0.9, 1.4, 0.8]} />
        <meshStandardMaterial color="#e74c3c" />
      </mesh>
      <Text fontSize={0.13} color="#ff8a65" position={[-3, 2, 0]}>
        {`L = ${levelBefore} дБ`}
      </Text>
      {/* Barrier wall */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.25, 3, 4]} />
        <meshStandardMaterial color="#95a5a6" roughness={0.7} />
      </mesh>
      <Text fontSize={0.12} color="#bdc3c7" position={[0, 3.2, 0]}>
        {`G = ${mass} кг/м²`}
      </Text>
      <Text fontSize={0.1} color="#ffd43b" position={[0, 2.8, 0]}>
        {`N = ${N.toFixed(1)} дБ`}
      </Text>
      {/* Observer */}
      <group position={[3, 0, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.18, 0.5, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffd6b6" />
        </mesh>
        <Text fontSize={0.14} color={levelAfter > 80 ? '#ff6b6b' : '#9be37d'} position={[0, 1.9, 0]}>
          {`L′ = ${levelAfter.toFixed(1)} дБ`}
        </Text>
      </group>
      {/* Arrows showing reduction */}
      <mesh position={[-1.5, 1.5, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.02]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <mesh position={[1.5, 1.5, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.02]} />
        <meshBasicMaterial color="#2ecc71" />
      </mesh>
    </>
  );
}

/* ─────────────── Noise Sum Scene ─────────────── */

function NoiseSumScene({ l1, l2, l3 }: { l1: number; l2: number; l3: number }) {
  const energy = [l1, l2, l3].reduce((acc, l) => acc + 10 ** (l / 10), 0);
  const total = 10 * Math.log10(energy);
  const waveRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    waveRefs.forEach((ref, idx) => {
      if (!ref.current) return;
      ref.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = (timeRef.current * 0.6 + i * 0.4 + idx * 1.1) % 2.5;
        mesh.scale.set(0.3 + t, 0.3 + t, 0.3 + t);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.02, 0.35 - t * 0.14);
      });
    });
  });

  const sources = [
    { x: -3, z: -2, level: l1, color: '#e74c3c', label: 'Ист.1' },
    { x: -3, z: 0, level: l2, color: '#f39c12', label: 'Ист.2' },
    { x: -3, z: 2, level: l3, color: '#e67e22', label: 'Ист.3' },
  ];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#3f4e55" />
      </mesh>
      {sources.map((src, idx) => (
        <group key={idx}>
          <mesh position={[src.x, 0.7, src.z]} castShadow>
            <boxGeometry args={[0.7, 1.0, 0.6]} />
            <meshStandardMaterial color={src.color} />
          </mesh>
          <Text fontSize={0.12} color={src.color} position={[src.x, 1.5, src.z]}>
            {`${src.label}: ${src.level} дБ`}
          </Text>
          <group ref={waveRefs[idx]} position={[src.x, 0.8, src.z]}>
            {[0, 1].map((i) => (
              <mesh key={i} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.8, 0.012, 8, 24]} />
                <meshBasicMaterial color={src.color} transparent opacity={0.25} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {/* Observer */}
      <group position={[3, 0, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffd6b6" />
        </mesh>
        <Text fontSize={0.16} color={total > 80 ? '#ff6b6b' : '#9be37d'} position={[0, 2.1, 0]}>
          {`LΣ = ${total.toFixed(1)} дБ`}
        </Text>
      </group>
    </>
  );
}

/* ─────────────── EMI Spectrum Scene ─────────────── */

function EmiSpectrumScene({ frequency }: { frequency: number }) {
  const c = 299792458;
  const lambda = c / Math.max(1e3, frequency);
  const waveRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!waveRef.current) return;
    waveRef.current.position.x = -((timeRef.current * 2) % 8);
  });

  const scaledLambda = Math.min(3, Math.max(0.05, Math.log10(lambda + 1) + 2));

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 6]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      {/* Wave visualization */}
      <group ref={waveRef}>
        {Array.from({ length: 40 }).map((_, i) => {
          const x = i * scaledLambda * 0.5;
          const y = 1.5 + Math.sin((i / (scaledLambda * 2)) * Math.PI * 2) * 0.8;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color={frequency < 3e7 ? '#74c0fc' : frequency < 3e11 ? '#ffd43b' : '#ff6b6b'} />
            </mesh>
          );
        })}
      </group>
      {/* Lambda bracket */}
      <mesh position={[2, 0.5, 0]}>
        <boxGeometry args={[scaledLambda, 0.02, 0.02]} />
        <meshBasicMaterial color="#51cf66" />
      </mesh>
      <Text fontSize={0.14} color="#51cf66" position={[2, 0.2, 0]}>
        {`λ = ${lambda.toExponential(2)} м`}
      </Text>
      <Text fontSize={0.12} color="#74c0fc" position={[2, 2.8, 0]}>
        {`f = ${(frequency / 1e6).toFixed(2)} МГц`}
      </Text>
      <Text fontSize={0.1} color="#ddd" position={[2, 2.5, 0]}>
        {frequency < 3e7 ? 'Радиоволны' : frequency < 3e11 ? 'Микроволны' : 'ИК и выше'}
      </Text>
    </>
  );
}

/* ─────────────── EMI Zones Scene ─────────────── */

function EmiZonesScene({ frequency, distance }: { frequency: number; distance: number }) {
  const c = 299792458;
  const lambda = c / Math.max(1e3, frequency);
  const near = lambda / (2 * Math.PI);
  const far = 2 * lambda;
  const zone = distance < near ? 'near' : distance < far ? 'intermediate' : 'far';

  const maxRadius = Math.min(8, far);
  const nearR = Math.min(7, near);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0d1b2a" />
      </mesh>
      {/* Source antenna */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 2.5, 12]} />
        <meshStandardMaterial color="#f25f5c" emissive="#a42f2d" emissiveIntensity={0.5} />
      </mesh>
      {/* Near zone sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.max(0.15, nearR), 32, 32]} />
        <meshStandardMaterial color="#ff6b6b" transparent opacity={0.15} />
      </mesh>
      <Text fontSize={0.12} color="#ff6b6b" position={[nearR + 0.2, 2.5, 0]}>
        Ближняя
      </Text>
      {/* Far zone sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.max(0.3, maxRadius), 32, 32]} />
        <meshStandardMaterial color="#74c0fc" transparent opacity={0.08} wireframe />
      </mesh>
      <Text fontSize={0.12} color="#74c0fc" position={[maxRadius + 0.2, 2.5, 0]}>
        Дальняя
      </Text>
      {/* Observer */}
      <mesh position={[Math.min(distance, 9), 1.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={zone === 'near' ? '#ff6b6b' : zone === 'intermediate' ? '#ffd43b' : '#51cf66'} />
      </mesh>
      <Text fontSize={0.14} color="#fff" position={[Math.min(distance, 9), 2.2, 0]}>
        {zone === 'near' ? 'Ближняя зона' : zone === 'intermediate' ? 'Промежуточная' : 'Дальняя зона'}
      </Text>
      <Text fontSize={0.1} color="#bbb" position={[Math.min(distance, 9), 1, 0]}>
        {`r = ${distance.toFixed(2)} м`}
      </Text>
    </>
  );
}

/* ─────────────── Brightness Scene ─────────────── */

function BrightnessScene({ intensity, area }: { intensity: number; area: number }) {
  const B = area > 0 ? intensity / area : 0;
  const isBlinding = B > 2000;

  return (
    <>
      <Room width={6} depth={5} height={3} />
      <Desk position={[0, 0, 0.5]} />
      <Chair position={[0, 0, 1.2]} />
      {/* Light source with variable brightness */}
      <mesh position={[0, 2.2, -1]}>
        <boxGeometry args={[Math.sqrt(area), Math.sqrt(area) * 0.6, 0.05]} />
        <meshStandardMaterial
          emissive={isBlinding ? '#fff5c0' : '#ffd39b'}
          emissiveIntensity={Math.min(3, B / 500)}
          color="#ffeedd"
        />
      </mesh>
      <pointLight position={[0, 2.2, -0.8]} color="#ffd39b" intensity={Math.min(8, B / 200)} distance={6} decay={2} castShadow />
      {/* Eyes indicator */}
      <Text fontSize={0.16} color={isBlinding ? '#ff6b6b' : '#9be37d'} position={[0, 0.5, 2]}>
        {isBlinding ? '⚠ Блёскость!' : '✓ Комфортно'}
      </Text>
      <Text fontSize={0.12} color="#ffeedd" position={[0, 0.3, 2]}>
        {`B = ${B.toFixed(0)} кд/м²`}
      </Text>
    </>
  );
}

/* ─────────────── Main TheoryScene3D ─────────────── */

interface TheoryScene3DProps {
  type: TheorySimulatorType;
  params: Record<string, number>;
}

export default function TheoryScene3D({ type, params }: TheoryScene3DProps) {
  const scene = useMemo(() => {
    switch (type) {
      case 'light-flux':
        return <LightFluxScene intensity={params.a ?? 500} solidAngle={params.b ?? 1.2} />;
      case 'light-illuminance':
        return <IlluminanceScene flux={params.a ?? 3000} area={Math.max(0.1, params.b ?? 6)} />;
      case 'light-brightness':
        return <BrightnessScene intensity={params.a ?? 500} area={Math.max(0.1, params.b ?? 1)} />;
      case 'light-pulsation':
        return <PulsationScene eMax={params.a ?? 500} eMin={params.b ?? 200} eAvg={Math.max(1, params.c ?? 350)} />;
      case 'light-room-index':
        return <RoomIndexScene length={Math.max(2, (params.a ?? 500) / 50)} width={Math.max(2, params.b ?? 6)} height={Math.max(1, params.c ?? 3)} />;
      case 'noise-distance':
        return <NoiseDistanceScene level={params.a ?? 100} distance={Math.max(0.5, params.b ?? 3)} />;
      case 'noise-barrier':
        return <NoiseBarrierScene mass={Math.max(10, params.a ?? 150)} levelBefore={params.b ?? 90} />;
      case 'noise-sum':
        return <NoiseSumScene l1={params.a ?? 90} l2={params.b ?? 85} l3={params.c ?? 80} />;
      case 'emi-spectrum':
        return <EmiSpectrumScene frequency={Math.max(1e3, (params.a ?? 100) * 1e3)} />;
      case 'emi-ppe-zones':
        return <EmiZonesScene frequency={Math.max(1e3, (params.a ?? 100) * 1e3)} distance={Math.max(0.01, params.b ?? 2)} />;
      case 'emi-wave':
        return <EmiSpectrumScene frequency={Math.max(1e5, 3e8 / Math.max(0.01, params.a ?? 1))} />;
      default:
        return <Room />;
    }
  }, [type, params]);

  return (
    <Paper variant="outlined" sx={{ mt: 1, mb: 1 }}>
      <Typography variant="subtitle2" sx={{ p: 1, pb: 0 }}>
        Интерактивная 3D-визуализация
      </Typography>
      <Box sx={{ height: { xs: 240, md: 320 }, borderRadius: 1, overflow: 'hidden' }}>
        <SafeCanvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
          <ambientLight intensity={0.25} />
          <directionalLight position={[5, 8, 3]} intensity={0.6} castShadow />
          {scene}
          <OrbitControls enablePan={false} />
          <Environment preset="city" />
        </SafeCanvas>
      </Box>
    </Paper>
  );
}
