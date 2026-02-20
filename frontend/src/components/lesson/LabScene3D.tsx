import { useMemo, useRef, useState } from 'react';
import { Box, IconButton, Paper, Slider, Stack, Tooltip, Typography } from '@mui/material';
import { Environment, OrbitControls, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import * as THREE from 'three';
import SafeCanvas from '../SafeCanvas';
import { levelAtDistanceDb, sourceLevelAtObserver, sumLevelsEnergyDb } from '../../formulas/noise';
import { classifyEmZone, wavelengthM } from '../../formulas/emi';
import FastForwardIcon from '@mui/icons-material/FastForward';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';

type LampType = 'incandescent' | 'fluorescent' | 'led';

interface LabSceneProps {
  lessonId: 1 | 2 | 3 | 4 | 5;
  lightState: {
    lampType: LampType;
    intensityCd: number;
    heightM: number;
    sensorOffsetM: number;
  };
  noiseState: {
    sourceA: number;
    sourceB: number;
    sourceC: number;
    sourceAX: number;
    sourceBX: number;
    sourceCX: number;
    observerX: number;
    barrierMass: number;
    sourceAOn: boolean;
    sourceBOn: boolean;
    sourceCOn: boolean;
  };
  emiState: {
    frequencyHz: number;
    distanceM: number;
    eVpm: number;
    hApm: number;
  };
}

/* ─────────────── Reusable room furniture ─────────────── */

function LabRoom({ width = 12, depth = 8, height = 3.2 }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#706b63" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>
      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#d4cec4" />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#dad4ca" />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color="#dad4ca" />
      </mesh>
    </group>
  );
}

function LabDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.04, 0.65]} />
        <meshStandardMaterial color="#b8956a" roughness={0.6} />
      </mesh>
      {[[-0.62, 0, -0.28], [0.62, 0, -0.28], [-0.62, 0, 0.28], [0.62, 0, 0.28]].map((leg, i) => (
        <mesh key={i} position={[leg[0], 0.36, leg[2]]} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color="#7d5c4f" />
        </mesh>
      ))}
    </group>
  );
}

function LabChair({ position }: { position: [number, number, number] }) {
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
    </group>
  );
}

function Cabinet({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.8, 1.8, 0.5]} />
      <meshStandardMaterial color="#8b7355" roughness={0.7} />
    </mesh>
  );
}

function Computer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.35, 0.28, 0.02]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.14, 0.005]}>
        <planeGeometry args={[0.32, 0.24]} />
        <meshStandardMaterial emissive="#446688" emissiveIntensity={0.3} color="#335577" />
      </mesh>
      <mesh position={[0, -0.02, 0.04]} castShadow>
        <boxGeometry args={[0.08, 0.03, 0.08]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

/* ─────────────── Lesson 1: Lighting Investigation ─────────────── */

function LightInvestigationScene({ state, timeScale }: { state: LabSceneProps['lightState']; timeScale: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const sensorGlowRef = useRef<THREE.Mesh>(null);

  const color = state.lampType === 'incandescent'
    ? '#ffd39b'
    : state.lampType === 'fluorescent'
      ? '#f0fff8'
      : '#d8ecff';

  const flickerHz = state.lampType === 'fluorescent' ? 100 : state.lampType === 'incandescent' ? 10 : 0;
  const pulsationDepth = state.lampType === 'fluorescent' ? 0.35 : state.lampType === 'incandescent' ? 0.12 : 0;

  const distance = Math.sqrt(state.heightM * state.heightM + state.sensorOffsetM * state.sensorOffsetM);
  const illuminance = state.intensityCd / Math.max(0.2, distance * distance);

  useFrame((_, delta) => {
    timeRef.current += delta * timeScale;
    if (!lightRef.current) return;
    const base = state.intensityCd / 120;
    if (flickerHz <= 0 || pulsationDepth <= 0) {
      lightRef.current.intensity = base;
    } else {
      const flicker = 1 - pulsationDepth + pulsationDepth * Math.sin(timeRef.current * flickerHz * 0.5);
      lightRef.current.intensity = base * flicker;
    }
    if (sensorGlowRef.current) {
      const glow = Math.min(1, illuminance / 500);
      (sensorGlowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
    }
  });

  return (
    <>
      <LabRoom width={14} depth={10} height={3.5} />
      {/* Desks with computers */}
      {[[-3, 0, 1], [-1, 0, 1], [1, 0, 1], [3, 0, 1], [-3, 0, -2], [-1, 0, -2], [1, 0, -2], [3, 0, -2]].map((pos, i) => (
        <group key={`desk-${i}`}>
          <LabDesk position={pos as [number, number, number]} />
          <LabChair position={[pos[0], 0, pos[2] + 0.7] as [number, number, number]} />
          <Computer position={[pos[0], 0.75, pos[2] - 0.1] as [number, number, number]} />
        </group>
      ))}
      <Cabinet position={[-6, 0.9, -4]} />
      <Cabinet position={[6, 0.9, -4]} />

      {/* Main luminaire */}
      <mesh position={[0, state.heightM + 0.05, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.18]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={0.7} color={color} />
      </mesh>
      <mesh position={[0, state.heightM, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={1} color={color} />
      </mesh>
      <pointLight
        ref={lightRef}
        castShadow
        color={color}
        distance={12}
        decay={2}
        position={[0, state.heightM, 0]}
        intensity={state.intensityCd / 120}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      {/* Lux sensor on desk */}
      <mesh ref={sensorGlowRef} position={[state.sensorOffsetM, 0.78, 1]} castShadow>
        <boxGeometry args={[0.2, 0.04, 0.15]} />
        <meshStandardMaterial color="#42a5f5" emissive="#42a5f5" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[state.sensorOffsetM, 0.82, 1]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 8]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.2} />
      </mesh>
      <Text fontSize={0.14} color="#42a5f5" position={[state.sensorOffsetM, 1.1, 1]}>
        {`E = ${illuminance.toFixed(0)} лк`}
      </Text>
      <Text fontSize={0.1} color="#aaa" position={[state.sensorOffsetM, 0.95, 1]}>
        {`r = ${distance.toFixed(2)} м`}
      </Text>

      {/* Additional ceiling luminaires (dimmer) */}
      {[[-3.5, 0], [3.5, 0], [-3.5, -3], [3.5, -3]].map(([x, z], i) => (
        <group key={`extra-light-${i}`}>
          <mesh position={[x, 3.4, z]}>
            <boxGeometry args={[0.8, 0.03, 0.12]} />
            <meshStandardMaterial emissive={color} emissiveIntensity={0.2} color="#ddd" />
          </mesh>
          <pointLight position={[x, 3.35, z]} color={color} intensity={0.4} distance={5} decay={2} />
        </group>
      ))}
    </>
  );
}

/* ─────────────── Lesson 2: Lighting Calculation ─────────────── */

function LightCalculationScene({ state, timeScale }: { state: LabSceneProps['lightState']; timeScale: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);

  const color = state.lampType === 'incandescent'
    ? '#ffd39b'
    : state.lampType === 'fluorescent'
      ? '#f0fff8'
      : '#d8ecff';

  useFrame((_, delta) => {
    timeRef.current += delta * timeScale;
    if (!lightRef.current) return;
    lightRef.current.intensity = state.intensityCd / 100;
  });

  // Show room index visualization
  const roomL = 14;
  const roomB = 10;
  const hp = Math.max(0.5, state.heightM - 0.3);
  const idx = (roomL * roomB) / (hp * (roomL + roomB));

  // Calculate luminaire grid
  const nRows = Math.max(1, Math.round(Math.sqrt(state.intensityCd / 200)));
  const nCols = Math.max(1, Math.round(nRows * 1.4));

  return (
    <>
      <LabRoom width={roomL} depth={roomB} height={state.heightM + 0.5} />
      {/* Luminaire grid */}
      {Array.from({ length: nRows }).map((_, row) =>
        Array.from({ length: nCols }).map((_, col) => {
          const x = -roomL / 2 + (roomL / (nCols + 1)) * (col + 1);
          const z = -roomB / 2 + (roomB / (nRows + 1)) * (row + 1);
          return (
            <group key={`lum-${row}-${col}`}>
              <mesh position={[x, state.heightM + 0.45, z]}>
                <boxGeometry args={[0.6, 0.03, 0.12]} />
                <meshStandardMaterial emissive={color} emissiveIntensity={0.5} color="#eee" />
              </mesh>
              <pointLight position={[x, state.heightM + 0.4, z]} color={color} intensity={state.intensityCd / 300} distance={state.heightM + 2} decay={2} />
            </group>
          );
        }),
      )}
      {/* Dimension lines */}
      <mesh position={[0, 0.03, roomB / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomL, 0.04]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
      <Text fontSize={0.2} color="#e74c3c" position={[0, 0.2, roomB / 2 + 0.5]}>
        {`L = ${roomL} м`}
      </Text>
      <mesh position={[roomL / 2 + 0.2, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[roomB, 0.04]} />
        <meshBasicMaterial color="#3498db" />
      </mesh>
      <Text fontSize={0.2} color="#3498db" position={[roomL / 2 + 0.5, 0.2, 0]}>
        {`B = ${roomB} м`}
      </Text>
      {/* Height marker */}
      <mesh position={[-roomL / 2 + 0.3, state.heightM / 2 + 0.25, -roomB / 2 + 0.2]}>
        <boxGeometry args={[0.02, state.heightM, 0.02]} />
        <meshBasicMaterial color="#2ecc71" />
      </mesh>
      <Text fontSize={0.15} color="#2ecc71" position={[-roomL / 2 + 0.8, state.heightM / 2, -roomB / 2 + 0.2]}>
        {`Hp = ${hp.toFixed(2)} м`}
      </Text>
      {/* Info overlay */}
      <Text fontSize={0.2} color="#ffd43b" position={[0, 0.5, 0]}>
        {`i = ${idx.toFixed(3)} | N = ${nRows * nCols} свет.`}
      </Text>
      {/* Desks */}
      {[[-3, 0, 1], [0, 0, 1], [3, 0, 1], [-3, 0, -2], [0, 0, -2], [3, 0, -2]].map((pos, i) => (
        <LabDesk key={`desk-${i}`} position={pos as [number, number, number]} />
      ))}
    </>
  );
}

/* ─────────────── Lesson 3: Noise Investigation ─────────────── */

function NoiseWave({ x, z, color, speed = 0.6, timeScale = 1 }: { x: number; z: number; color: string; speed?: number; timeScale?: number }) {
  const ref = useRef<Mesh>(null);
  const timeRef = useRef((Math.abs(x) * 0.37) % 3);

  useFrame((_, delta) => {
    timeRef.current += delta * speed * timeScale;
    if (!ref.current) return;
    const t = timeRef.current % 2.5;
    const scale = 0.2 + t;
    const opacity = Math.max(0.03, 0.45 - t * 0.16);
    ref.current.scale.set(scale, scale, scale);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
  });

  return (
    <mesh ref={ref} position={[x, 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[1, 0.018, 8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  );
}

function NoiseInvestigationScene({ state, timeScale }: { state: LabSceneProps['noiseState']; timeScale: number }) {
  const contributions = [
    state.sourceAOn ? sourceLevelAtObserver({
      levelAt1mDb: state.sourceA,
      distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceAX)),
      barrierMassPerM2: state.barrierMass,
    }) : Number.NEGATIVE_INFINITY,
    state.sourceBOn ? sourceLevelAtObserver({
      levelAt1mDb: state.sourceB,
      distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceBX)),
      barrierMassPerM2: state.barrierMass,
    }) : Number.NEGATIVE_INFINITY,
    state.sourceCOn ? sourceLevelAtObserver({
      levelAt1mDb: state.sourceC,
      distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceCX)),
      barrierMassPerM2: state.barrierMass,
    }) : Number.NEGATIVE_INFINITY,
  ].filter((value) => Number.isFinite(value));

  const total = contributions.length > 0 ? sumLevelsEnergyDb(contributions as number[]) : 0;

  const sources = [
    { x: state.sourceAX, z: -2, level: state.sourceA, active: state.sourceAOn, color: '#ff5722', label: 'Станок A' },
    { x: state.sourceBX, z: 0, level: state.sourceB, active: state.sourceBOn, color: '#ff9800', label: 'Станок B' },
    { x: state.sourceCX, z: 2, level: state.sourceC, active: state.sourceCOn, color: '#ffc107', label: 'Компрессор' },
  ];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      {/* Factory walls */}
      <mesh position={[0, 2, -5.8]}>
        <boxGeometry args={[20, 4, 0.2]} />
        <meshStandardMaterial color="#8a8478" />
      </mesh>
      <mesh position={[-9.8, 2, 0]}>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#8a8478" />
      </mesh>
      <mesh position={[9.8, 2, 0]}>
        <boxGeometry args={[0.2, 4, 12]} />
        <meshStandardMaterial color="#8a8478" />
      </mesh>

      {/* Sound barrier wall */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.35, 3, 8]} />
        <meshStandardMaterial color="#95a5a6" roughness={0.5} metalness={0.1} />
      </mesh>
      <Text fontSize={0.14} color="#bdc3c7" position={[0, 3.2, 0]}>
        {`Преграда G=${state.barrierMass} кг/м²`}
      </Text>

      {/* Sources */}
      {sources.map((source, index) => (
        <group key={`src-${index}`}>
          {/* Machine body */}
          <mesh position={[source.x, 0.7, source.z]} castShadow>
            <boxGeometry args={[1.0, 1.2, 0.9]} />
            <meshStandardMaterial color={source.active ? '#666' : '#444'} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Machine top detail */}
          <mesh position={[source.x, 1.4, source.z]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 0.2, 8]} />
            <meshStandardMaterial color={source.active ? source.color : '#555'} />
          </mesh>
          {/* Vibration indicator */}
          {source.active && (
            <VibrationIndicator position={[source.x, 0.7, source.z]} intensity={source.level / 100} timeScale={timeScale} />
          )}
          <Text fontSize={0.13} color={source.active ? source.color : '#666'} position={[source.x, 1.9, source.z]}>
            {`${source.label}`}
          </Text>
          <Text fontSize={0.11} color={source.active ? '#fff' : '#666'} position={[source.x, 1.7, source.z]}>
            {`${source.level} дБ`}
          </Text>
          {source.active && <NoiseWave x={source.x} z={source.z} color={source.color} speed={source.level / 120} timeScale={timeScale} />}
        </group>
      ))}

      {/* Observer with sound level meter */}
      <group position={[state.observerX, 0, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffd6b6" />
        </mesh>
        {/* Sound level meter in hand */}
        <mesh position={[0.25, 1.2, 0.15]} castShadow>
          <boxGeometry args={[0.08, 0.15, 0.04]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <Text fontSize={0.18} color={total > 80 ? '#ff6b6b' : '#9be37d'} position={[0, 2.1, 0]}>
          {`LΣ = ${total.toFixed(1)} дБ`}
        </Text>
        <Text fontSize={0.1} color="#aaa" position={[0, 1.95, 0]}>
          {total > 80 ? '⚠ Превышение ПДУ!' : '✓ В норме'}
        </Text>
      </group>

      {/* Ceiling lights */}
      <pointLight position={[-4, 3.5, 0]} color="#fff5e0" intensity={1} distance={8} decay={2} />
      <pointLight position={[4, 3.5, 0]} color="#fff5e0" intensity={1} distance={8} decay={2} />
    </>
  );
}

function VibrationIndicator({ position, intensity, timeScale }: { position: [number, number, number]; intensity: number; timeScale: number }) {
  const ref = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta * timeScale;
    if (!ref.current) return;
    const vibAmount = intensity * 0.02;
    ref.current.position.x = position[0] + Math.sin(timeRef.current * 30) * vibAmount;
    ref.current.position.y = position[1] + Math.sin(timeRef.current * 25 + 1) * vibAmount * 0.5;
  });

  return <group ref={ref} position={position} />;
}

/* ─────────────── Lesson 4: Noise Calculation ─────────────── */

function NoiseCalculationScene({ state, timeScale }: { state: LabSceneProps['noiseState']; timeScale: number }) {
  // Same physics but different visual emphasis - shows calculation workspace
  const levels = [
    state.sourceAOn ? levelAtDistanceDb(state.sourceA, Math.max(0.8, Math.abs(state.observerX - state.sourceAX))) : Number.NEGATIVE_INFINITY,
    state.sourceBOn ? levelAtDistanceDb(state.sourceB, Math.max(0.8, Math.abs(state.observerX - state.sourceBX))) : Number.NEGATIVE_INFINITY,
    state.sourceCOn ? levelAtDistanceDb(state.sourceC, Math.max(0.8, Math.abs(state.observerX - state.sourceCX))) : Number.NEGATIVE_INFINITY,
  ].filter((v) => Number.isFinite(v)) as number[];
  const totalWithout = levels.length > 0 ? sumLevelsEnergyDb(levels) : 0;

  const levelsWithBarrier = [
    state.sourceAOn ? sourceLevelAtObserver({ levelAt1mDb: state.sourceA, distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceAX)), barrierMassPerM2: state.barrierMass }) : Number.NEGATIVE_INFINITY,
    state.sourceBOn ? sourceLevelAtObserver({ levelAt1mDb: state.sourceB, distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceBX)), barrierMassPerM2: state.barrierMass }) : Number.NEGATIVE_INFINITY,
    state.sourceCOn ? sourceLevelAtObserver({ levelAt1mDb: state.sourceC, distanceM: Math.max(0.8, Math.abs(state.observerX - state.sourceCX)), barrierMassPerM2: state.barrierMass }) : Number.NEGATIVE_INFINITY,
  ].filter((v) => Number.isFinite(v)) as number[];
  const totalWith = levelsWithBarrier.length > 0 ? sumLevelsEnergyDb(levelsWithBarrier) : 0;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      {/* Technical room with visible measurement grid */}
      {/* Grid on floor */}
      {Array.from({ length: 21 }).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[-10 + i, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.01, 12]} />
            <meshBasicMaterial color="#555" transparent opacity={0.3} />
          </mesh>
          {i <= 12 && (
            <mesh position={[0, 0.005, -6 + i]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <planeGeometry args={[0.01, 20]} />
              <meshBasicMaterial color="#555" transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      ))}

      {/* Sources with distance markers */}
      {[
        { x: state.sourceAX, level: state.sourceA, on: state.sourceAOn, color: '#ff5722' },
        { x: state.sourceBX, level: state.sourceB, on: state.sourceBOn, color: '#ff9800' },
        { x: state.sourceCX, level: state.sourceC, on: state.sourceCOn, color: '#ffc107' },
      ].map((src, i) => (
        <group key={`calc-src-${i}`}>
          <mesh position={[src.x, 0.6, -3 + i * 3]} castShadow>
            <boxGeometry args={[0.8, 1.0, 0.7]} />
            <meshStandardMaterial color={src.on ? '#666' : '#444'} metalness={0.5} />
          </mesh>
          <Text fontSize={0.12} color={src.color} position={[src.x, 1.4, -3 + i * 3]}>
            {`L${i + 1} = ${src.level} дБ`}
          </Text>
          {/* Distance line to observer */}
          {src.on && (
            <mesh position={[(src.x + state.observerX) / 2, 0.03, -3 + i * 3 + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[Math.abs(state.observerX - src.x), 0.02]} />
              <meshBasicMaterial color={src.color} transparent opacity={0.5} />
            </mesh>
          )}
          {src.on && <NoiseWave x={src.x} z={-3 + i * 3} color={src.color} speed={0.5} timeScale={timeScale} />}
        </group>
      ))}

      {/* Barrier */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.3, 3, 8]} />
        <meshStandardMaterial color="#7f8c8d" />
      </mesh>

      {/* Observer */}
      <group position={[state.observerX, 0, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffd6b6" />
        </mesh>
        <Text fontSize={0.15} color="#ffd43b" position={[0, 2.2, 0]}>
          {`Без преграды: ${totalWithout.toFixed(1)} дБ`}
        </Text>
        <Text fontSize={0.15} color={totalWith > 80 ? '#ff6b6b' : '#9be37d'} position={[0, 2.0, 0]}>
          {`С преградой: ${totalWith.toFixed(1)} дБ`}
        </Text>
      </group>

      <pointLight position={[0, 3.5, 0]} color="#fff5e0" intensity={1.5} distance={10} decay={2} />
    </>
  );
}

/* ─────────────── Lesson 5: EMI ─────────────── */

function EmiScene({ state, timeScale }: { state: LabSceneProps['emiState']; timeScale: number }) {
  const lambda = wavelengthM(Math.max(1e3, state.frequencyHz));
  const near = lambda / (2 * Math.PI);
  const far = 2 * lambda;
  const zone = classifyEmZone(Math.max(0.01, state.distanceM), lambda);
  const ppe = state.eVpm * state.hApm;
  const waveRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta * timeScale;
    if (!waveRef.current) return;
    waveRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const t = (timeRef.current * 0.8 + i * 0.8) % 4;
      const scale = 0.3 + t * 0.5;
      mesh.scale.set(scale, scale, scale);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.02, 0.3 - t * 0.07);
    });
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#12202e" roughness={0.9} />
      </mesh>
      {/* Antenna/source */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#555" metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.2, 2.6, 12]} />
        <meshStandardMaterial color="#c0392b" emissive="#a42f2d" emissiveIntensity={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial emissive="#ff3333" emissiveIntensity={2} />
      </mesh>

      {/* EM waves expanding */}
      <group ref={waveRef} position={[0, 1.5, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ff6b6b" transparent opacity={0.15} wireframe />
          </mesh>
        ))}
      </group>

      {/* Near zone sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.min(8, Math.max(0.15, near)), 24, 24]} />
        <meshStandardMaterial color="#ff4444" transparent opacity={0.1} />
      </mesh>
      {near < 8 && (
        <Text fontSize={0.14} color="#ff6b6b" position={[Math.min(7, near) + 0.3, 2.5, 0]}>
          Ближняя
        </Text>
      )}

      {/* Far zone sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.min(10, Math.max(0.3, far)), 24, 24]} />
        <meshStandardMaterial color="#4488ff" transparent opacity={0.06} wireframe />
      </mesh>
      {far < 10 && (
        <Text fontSize={0.14} color="#74c0fc" position={[Math.min(9, far) + 0.3, 2.5, 0]}>
          Дальняя
        </Text>
      )}

      {/* Measurement probe at distance */}
      <group position={[Math.min(state.distanceM, 10), 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.25, 0.08]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
          <meshStandardMaterial color="#888" metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={zone === 'near' ? '#ff6b6b' : zone === 'intermediate' ? '#ffd43b' : '#51cf66'} emissive={zone === 'near' ? '#ff0000' : zone === 'intermediate' ? '#ffaa00' : '#00cc44'} emissiveIntensity={0.8} />
        </mesh>
        <Text fontSize={0.15} color="#fff" position={[0, 2.3, 0]}>
          {zone === 'near' ? 'Ближняя зона' : zone === 'intermediate' ? 'Промежуточная' : 'Дальняя зона'}
        </Text>
        <Text fontSize={0.11} color="#bbb" position={[0, 2.1, 0]}>
          {`r = ${state.distanceM.toFixed(2)} м`}
        </Text>
        <Text fontSize={0.11} color="#ffd43b" position={[0, 0.8, 0]}>
          {`ППЭ = ${ppe.toFixed(3)} Вт/м²`}
        </Text>
      </group>

      {/* Distance line */}
      <mesh position={[Math.min(state.distanceM, 10) / 2, 0.03, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[Math.min(state.distanceM, 10), 0.03]} />
        <meshBasicMaterial color="#ffd43b" />
      </mesh>

      <pointLight position={[5, 5, 5]} color="#aab" intensity={0.5} />
    </>
  );
}

/* ─────────────── Main Component with Time Control ─────────────── */

export default function LabScene3D(props: LabSceneProps) {
  const [timeScale, setTimeScale] = useState(1);

  const sceneInfo = useMemo(() => {
    if (props.lessonId === 1) {
      const distance = Math.sqrt(
        props.lightState.heightM * props.lightState.heightM
        + props.lightState.sensorOffsetM * props.lightState.sensorOffsetM
      );
      const illuminance = props.lightState.intensityCd / Math.max(0.2, distance * distance);
      return {
        headline: `Исследование: E = ${illuminance.toFixed(1)} лк | Лампа: ${props.lightState.lampType === 'incandescent' ? 'накаливания' : props.lightState.lampType === 'fluorescent' ? 'люминесцентная' : 'LED'}`,
      };
    }
    if (props.lessonId === 2) {
      const hp = Math.max(0.5, props.lightState.heightM - 0.3);
      const idx = (14 * 10) / (hp * (14 + 10));
      return {
        headline: `Расчёт: i = ${idx.toFixed(3)} | Hp = ${hp.toFixed(2)} м`,
      };
    }
    if (props.lessonId === 3) {
      const contributions = [
        props.noiseState.sourceAOn ? sourceLevelAtObserver({ levelAt1mDb: props.noiseState.sourceA, distanceM: Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceAX)), barrierMassPerM2: props.noiseState.barrierMass }) : Number.NEGATIVE_INFINITY,
        props.noiseState.sourceBOn ? sourceLevelAtObserver({ levelAt1mDb: props.noiseState.sourceB, distanceM: Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceBX)), barrierMassPerM2: props.noiseState.barrierMass }) : Number.NEGATIVE_INFINITY,
        props.noiseState.sourceCOn ? sourceLevelAtObserver({ levelAt1mDb: props.noiseState.sourceC, distanceM: Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceCX)), barrierMassPerM2: props.noiseState.barrierMass }) : Number.NEGATIVE_INFINITY,
      ].filter((v) => Number.isFinite(v)) as number[];
      const total = contributions.length > 0 ? sumLevelsEnergyDb(contributions) : 0;
      return { headline: `Исследование шума: LΣ = ${total.toFixed(1)} дБ (с преградой)` };
    }
    if (props.lessonId === 4) {
      const levels = [
        props.noiseState.sourceAOn ? levelAtDistanceDb(props.noiseState.sourceA, Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceAX))) : Number.NEGATIVE_INFINITY,
        props.noiseState.sourceBOn ? levelAtDistanceDb(props.noiseState.sourceB, Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceBX))) : Number.NEGATIVE_INFINITY,
        props.noiseState.sourceCOn ? levelAtDistanceDb(props.noiseState.sourceC, Math.max(0.8, Math.abs(props.noiseState.observerX - props.noiseState.sourceCX))) : Number.NEGATIVE_INFINITY,
      ].filter((v) => Number.isFinite(v)) as number[];
      const total = levels.length > 0 ? sumLevelsEnergyDb(levels) : 0;
      return { headline: `Расчёт шума: LΣ без преграды = ${total.toFixed(1)} дБ` };
    }
    const lambda = wavelengthM(Math.max(1e3, props.emiState.frequencyHz));
    const zone = classifyEmZone(Math.max(0.01, props.emiState.distanceM), lambda);
    const ppe = props.emiState.eVpm * props.emiState.hApm;
    return {
      headline: `ЭМИ: λ = ${lambda.toExponential(2)} м | ППЭ = ${ppe.toFixed(3)} Вт/м² | зона: ${zone === 'near' ? 'ближняя' : zone === 'intermediate' ? 'промежуточная' : 'дальняя'}`,
    };
  }, [props]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">
          Лабораторная 3D-сцена
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Замедлить">
            <IconButton size="small" onClick={() => setTimeScale((s) => Math.max(0.1, s * 0.5))}>
              <SlowMotionVideoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'center' }}>
            ×{timeScale.toFixed(1)}
          </Typography>
          <Tooltip title="Ускорить">
            <IconButton size="small" onClick={() => setTimeScale((s) => Math.min(10, s * 2))}>
              <FastForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {sceneInfo.headline}
      </Typography>
      <Box sx={{ height: { xs: 320, md: 420 }, borderRadius: 1, overflow: 'hidden' }}>
        <SafeCanvas shadows camera={{ position: props.lessonId === 5 ? [8, 5, 10] : [8, 5, 8], fov: 46 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 3]} intensity={0.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          {props.lessonId === 1 && <LightInvestigationScene state={props.lightState} timeScale={timeScale} />}
          {props.lessonId === 2 && <LightCalculationScene state={props.lightState} timeScale={timeScale} />}
          {props.lessonId === 3 && <NoiseInvestigationScene state={props.noiseState} timeScale={timeScale} />}
          {props.lessonId === 4 && <NoiseCalculationScene state={props.noiseState} timeScale={timeScale} />}
          {props.lessonId === 5 && <EmiScene state={props.emiState} timeScale={timeScale} />}
          <OrbitControls enablePan={false} />
          <Environment preset="city" />
        </SafeCanvas>
      </Box>
    </Paper>
  );
}
