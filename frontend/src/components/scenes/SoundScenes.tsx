/**
 * 3D scenes for Lab 3 — Шум и вибрация
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh, Group } from 'three';

/* ─── soundWaves: concentric rings expanding from a source ─── */
export function SoundWavesScene() {
  const ringsRef = useRef<Group>(null!);
  const t = useRef(0);

  const ringCount = 8;
  const ringData = useMemo(
    () => Array.from({ length: ringCount }, (_, i) => ({ phase: i / ringCount })),
    []
  );

  useFrame((_, d) => {
    t.current += d;
    if (!ringsRef.current) return;
    ringsRef.current.children.forEach((child, i) => {
      const phase = ringData[i].phase;
      const r = ((t.current * 0.6 + phase) % 1) * 6;
      const opacity = 1 - r / 6;
      child.scale.set(r, r, r);
      const mat = (child as Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, opacity);
    });
  });

  return (
    <>
      {/* Speaker source */}
      <mesh position={[-4, 2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
      <mesh position={[-3.5, 2, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial color="#212121" />
      </mesh>

      {/* Expanding rings */}
      <group ref={ringsRef} position={[-3.5, 2, 0]}>
        {ringData.map((_, i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1, 0.02, 8, 64]} />
            <meshBasicMaterial color="#64b5f6" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Ear / receiver */}
      <mesh position={[4, 2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffab91" />
      </mesh>
      <Text position={[4, 3, 0]} fontSize={0.2} color="#fff">
        Приёмник
      </Text>

      <Text position={[0, 5, 0]} fontSize={0.25} color="#fff">
        L = 20 × lg(P/P₀) дБ
      </Text>
      <Text position={[0, 4.4, 0]} fontSize={0.18} color="#aaa">
        P₀ = 2×10⁻⁵ Па — порог слышимости
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── noiseLevels: visual dB scale with objects ─── */
export function NoiseLevelsScene() {
  const levels = [
    { db: 20, label: 'Шёпот', color: '#4caf50', h: 0.4 },
    { db: 50, label: 'Тихий офис', color: '#8bc34a', h: 1.0 },
    { db: 70, label: 'Пылесос', color: '#ffeb3b', h: 1.4 },
    { db: 85, label: 'Шумный цех', color: '#ff9800', h: 1.7 },
    { db: 100, label: 'Отбойный молоток', color: '#f44336', h: 2.0 },
    { db: 130, label: 'Реактивный двигатель', color: '#b71c1c', h: 2.6 },
  ];

  return (
    <>
      {levels.map((l, i) => (
        <group key={i} position={[-3.5 + i * 1.4, 0, 0]}>
          <mesh position={[0, l.h / 2, 0]} castShadow>
            <boxGeometry args={[0.8, l.h, 0.8]} />
            <meshStandardMaterial color={l.color} />
          </mesh>
          <Text position={[0, l.h + 0.3, 0]} fontSize={0.15} color="#fff" anchorX="center">
            {`${l.db} дБ`}
          </Text>
          <Text position={[0, -0.3, 0]} fontSize={0.12} color="#aaa" anchorX="center" textAlign="center">
            {l.label}
          </Text>
        </group>
      ))}

      <Text position={[0, 4.5, 0]} fontSize={0.22} color="#fff">
        Шкала уровней шума
      </Text>
      <Text position={[0, 4, 0]} fontSize={0.16} color="#ef5350">
        Болевой порог: 140 дБ
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── soundBarrier: sound wave hitting a wall, partial transmission ─── */
export function SoundBarrierScene() {
  const incidentRef = useRef<Group>(null!);
  const transmittedRef = useRef<Group>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    // Incident wave rings (left side)
    if (incidentRef.current) {
      incidentRef.current.children.forEach((child, i) => {
        const r = ((t.current * 0.5 + i * 0.15) % 1) * 3;
        child.scale.set(r, r, r);
        const mat = (child as Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.8 - r / 3);
      });
    }
    // Transmitted (much weaker)
    if (transmittedRef.current) {
      transmittedRef.current.children.forEach((child, i) => {
        const r = ((t.current * 0.5 + i * 0.15) % 1) * 2;
        child.scale.set(r, r, r);
        const mat = (child as Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.3 - r / 4);
      });
    }
  });

  return (
    <>
      {/* Source */}
      <mesh position={[-4, 2, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial color="#ef5350" />
      </mesh>
      <Text position={[-4, 3, 0]} fontSize={0.18} color="#ef5350">
        Источник 90 дБ
      </Text>

      {/* Incident waves */}
      <group ref={incidentRef} position={[-4, 2, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1, 0.015, 8, 64]} />
            <meshBasicMaterial color="#ef5350" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Wall / barrier */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.6, 4, 4]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      <Text position={[0, 4.5, 0]} fontSize={0.2} color="#fff">
        Звукоизоляция (стена)
      </Text>

      {/* Transmitted waves (weaker) */}
      <group ref={transmittedRef} position={[0.5, 2, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1, 0.01, 8, 64]} />
            <meshBasicMaterial color="#66bb6a" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>

      {/* Receiver */}
      <mesh position={[4, 2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffab91" />
      </mesh>
      <Text position={[4, 3, 0]} fontSize={0.18} color="#66bb6a">
        ~50 дБ
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── vibrationDemo: spring-mass system with resonance ─── */
export function VibrationDemoScene() {
  const massRef = useRef<Mesh>(null!);
  const springRef = useRef<Mesh>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    // Oscillating mass (underdamped resonance)
    const amp = 1.5 * Math.exp(-0.1 * (t.current % 10)) * Math.sin(t.current * 4);
    const y = 2.5 + amp;
    if (massRef.current) massRef.current.position.y = y;
    if (springRef.current) {
      springRef.current.position.y = (4.5 + y) / 2;
      springRef.current.scale.y = (4.5 - y) / 2;
    }
  });

  return (
    <>
      {/* Ceiling mount */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color="#616161" />
      </mesh>

      {/* Spring (simplified as stretched cylinder) */}
      <mesh ref={springRef} position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
        <meshStandardMaterial color="#fdd835" wireframe />
      </mesh>

      {/* Mass */}
      <mesh ref={massRef} position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#42a5f5" />
      </mesh>

      {/* Second system for comparison */}
      <mesh position={[3, 4.5, 0]}>
        <boxGeometry args={[2, 0.2, 0.5]} />
        <meshStandardMaterial color="#616161" />
      </mesh>

      <Text position={[-2, 5.5, 0]} fontSize={0.2} color="#42a5f5">
        Резонанс — max амплитуда
      </Text>
      <Text position={[0, 0.5, 0]} fontSize={0.18} color="#aaa">
        ν = 1/T, Затухание от трения
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}
