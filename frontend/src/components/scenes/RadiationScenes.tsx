/**
 * 3D scenes for Lab 6 — Радиация и УВЧ
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Mesh } from 'three';
import * as THREE from 'three';

/* ─── radiationTypes: alpha, beta, gamma rays stopped by materials ─── */
export function RadiationTypesScene() {
  const alphaRef = useRef<Mesh>(null!);
  const betaRef = useRef<Mesh>(null!);
  const gammaRef = useRef<Mesh>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    const cycle = t.current % 4;
    // Alpha — stopped by paper
    if (alphaRef.current) {
      const x = -5 + cycle * 2;
      alphaRef.current.position.x = Math.min(x, -2.5);
      alphaRef.current.visible = cycle < 2;
    }
    // Beta — stopped by aluminium
    if (betaRef.current) {
      const x = -5 + cycle * 2.5;
      betaRef.current.position.x = Math.min(x, 0);
      betaRef.current.visible = cycle < 2.5;
    }
    // Gamma — penetrates further, stopped by lead
    if (gammaRef.current) {
      const x = -5 + cycle * 3;
      gammaRef.current.position.x = Math.min(x, 2.5);
    }
  });

  return (
    <>
      {/* Source */}
      <mesh position={[-5, 2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#76ff03" emissive="#76ff03" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[-5, 3.3, 0]} fontSize={0.2} color="#76ff03">
        Источник ИИ
      </Text>

      {/* Particles */}
      <mesh ref={alphaRef} position={[-5, 2.5, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#f44336" />
      </mesh>
      <mesh ref={betaRef} position={[-5, 2, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#2196f3" />
      </mesh>
      <mesh ref={gammaRef} position={[-5, 1.5, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffeb3b" />
      </mesh>

      {/* Labels for particles */}
      <Text position={[-5, 3, -1]} fontSize={0.15} color="#f44336">α (альфа)</Text>
      <Text position={[-5, 2.5, -1]} fontSize={0.15} color="#2196f3">β (бета)</Text>
      <Text position={[-5, 2, -1]} fontSize={0.15} color="#ffeb3b">γ (гамма)</Text>

      {/* Paper barrier */}
      <mesh position={[-2.5, 2, 0]}>
        <boxGeometry args={[0.05, 3, 2]} />
        <meshStandardMaterial color="#fff9c4" />
      </mesh>
      <Text position={[-2.5, 3.8, 0]} fontSize={0.15} color="#fff9c4">
        Бумага
      </Text>

      {/* Aluminium barrier */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.15, 3, 2]} />
        <meshStandardMaterial color="#b0bec5" metalness={0.7} roughness={0.3} />
      </mesh>
      <Text position={[0, 3.8, 0]} fontSize={0.15} color="#b0bec5">
        Алюминий
      </Text>

      {/* Lead barrier */}
      <mesh position={[2.5, 2, 0]}>
        <boxGeometry args={[0.4, 3, 2]} />
        <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.1} />
      </mesh>
      <Text position={[2.5, 3.8, 0]} fontSize={0.15} color="#78909c">
        Свинец
      </Text>

      <Text position={[0, 5, 0]} fontSize={0.22} color="#fff">
        Проникающая способность излучений
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a2027" />
      </mesh>
    </>
  );
}

/* ─── radiationShielding: dose vs distance / time / shielding ─── */
export function RadiationShieldingScene() {
  const personRef = useRef<Mesh>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    // Person moves closer/further demonstrating distance protection
    if (personRef.current) {
      personRef.current.position.x = 2 + Math.sin(t.current * 0.5) * 2;
    }
  });

  return (
    <>
      {/* Radioactive source */}
      <group position={[-3, 1.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#76ff03" emissive="#76ff03" emissiveIntensity={0.4} />
        </mesh>
        {/* Radiation symbol */}
        <Text position={[0, 1.2, 0]} fontSize={0.4} color="#ffeb3b">
          ☢
        </Text>
      </group>

      {/* Shield options */}
      <mesh position={[-0.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.5, 2.5, 2]} />
        <meshStandardMaterial color="#607d8b" metalness={0.8} />
      </mesh>
      <Text position={[-0.5, 3.2, 0]} fontSize={0.16} color="#90a4ae">
        Экран (Pb)
      </Text>

      {/* Person moving */}
      <group>
        <mesh ref={personRef} position={[3, 1, 0]}>
          <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
          <meshStandardMaterial color="#ffab91" />
        </mesh>
      </group>

      {/* Distance arrows */}
      <Text position={[1.5, 0.3, 2]} fontSize={0.16} color="#fff">
        ← Защита расстоянием →
      </Text>

      {/* Info */}
      <Text position={[0, 5, 0]} fontSize={0.2} color="#fff">
        Методы защиты от ИИ
      </Text>
      <Text position={[0, 4.4, 0]} fontSize={0.16} color="#aaa">
        1) Количество 2) Время 3) Экран 4) Расстояние
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a2027" />
      </mesh>
    </>
  );
}

/* ─── antennaPattern: antenna radiating field, strength decreasing with distance ─── */
export function AntennaPatternScene() {
  const wavesRef = useRef<THREE.Group>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    if (wavesRef.current) {
      wavesRef.current.children.forEach((child, i) => {
        const r = ((t.current * 0.3 + i * 0.1) % 1) * 8;
        child.scale.set(r, r, r);
        const mat = (child as Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.6 - r / 10);
      });
    }
  });

  return (
    <>
      {/* Tower */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.05, 0.15, 6, 8]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[1.5, 0.1, 0.1]} />
        <meshStandardMaterial color="#b0bec5" />
      </mesh>
      <mesh position={[0, 6.3, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshStandardMaterial color="#b0bec5" />
      </mesh>

      {/* Expanding waves from antenna */}
      <group ref={wavesRef} position={[0, 5.5, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i}>
            <torusGeometry args={[1, 0.01, 8, 64]} />
            <meshBasicMaterial color="#ff9800" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>

      {/* Distance markers */}
      {[2, 4, 6].map((r) => (
        <group key={r}>
          <mesh position={[r, 0.05, 0]}>
            <boxGeometry args={[0.05, 0.1, 0.5]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <Text position={[r, 0.5, 0]} fontSize={0.15} color="#aaa">
            {`r=${r * 50}м`}
          </Text>
        </group>
      ))}

      <Text position={[0, 7.5, 0]} fontSize={0.22} color="#fff">
        E = √(30PG) × F(Δ) × K / R
      </Text>
      <Text position={[0, 7, 0]} fontSize={0.16} color="#aaa">
        R = √(r² + H²)
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a2027" />
      </mesh>
    </>
  );
}
