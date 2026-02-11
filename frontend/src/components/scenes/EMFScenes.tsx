/**
 * 3D scenes for Lab 5 — Защита от ЭМИ
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh, Group } from 'three';

/* ─── emWave: animated electromagnetic wave (E and B oscillating) ─── */
export function EMWaveScene() {
  const eFieldRef = useRef<Group>(null!);
  const bFieldRef = useRef<Group>(null!);
  const t = useRef(0);

  const points = 60;
  const positions = useMemo(() => {
    const e = new Float32Array(points * 3);
    const b = new Float32Array(points * 3);
    for (let i = 0; i < points; i++) {
      e[i * 3] = (i / points) * 10 - 5;
      b[i * 3] = (i / points) * 10 - 5;
    }
    return { e, b };
  }, []);

  useFrame((_, d) => {
    t.current += d;
    if (eFieldRef.current) {
      const line = eFieldRef.current.children[0] as Mesh;
      const geo = line.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * 10 - 5;
        pos.setXYZ(i, x, Math.sin(x * 2 - t.current * 3) * 1.5, 0);
      }
      pos.needsUpdate = true;
    }
    if (bFieldRef.current) {
      const line = bFieldRef.current.children[0] as Mesh;
      const geo = line.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position;
      for (let i = 0; i < points; i++) {
        const x = (i / points) * 10 - 5;
        pos.setXYZ(i, x, 0, Math.sin(x * 2 - t.current * 3) * 1.5);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <>
      {/* E-field (vertical oscillation - red) */}
      <group ref={eFieldRef} position={[0, 2.5, 0]}>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions.e, 3]}
              count={points}
              array={positions.e}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f44336" linewidth={2} />
        </line>
      </group>

      {/* B-field (horizontal oscillation - blue) */}
      <group ref={bFieldRef} position={[0, 2.5, 0]}>
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions.b, 3]}
              count={points}
              array={positions.b}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#2196f3" linewidth={2} />
        </line>
      </group>

      {/* Direction arrow */}
      <mesh position={[5.5, 2.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.4, 12]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      <Text position={[3, 4.5, 0]} fontSize={0.25} color="#f44336">
        E (электрическое)
      </Text>
      <Text position={[3, 0.3, 2]} fontSize={0.25} color="#2196f3">
        B (магнитное)
      </Text>
      <Text position={[0, 5.5, 0]} fontSize={0.22} color="#fff">
        Электромагнитная волна
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
    </>
  );
}

/* ─── emfShield: wave attenuated by shield ─── */
export function EMFShieldScene() {
  const wavesRef = useRef<Group>(null!);
  const attRef = useRef<Group>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    if (wavesRef.current) {
      wavesRef.current.children.forEach((child, i) => {
        const r = ((t.current * 0.4 + i * 0.12) % 1) * 3;
        child.scale.set(r, r, r);
        (child as Mesh).material && ((child as Mesh).material as THREE.MeshBasicMaterial).opacity !== undefined &&
          ((child as Mesh).material as THREE.MeshBasicMaterial).opacity != null &&
          (((child as Mesh).material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - r / 3));
      });
    }
    if (attRef.current) {
      attRef.current.children.forEach((child, i) => {
        const r = ((t.current * 0.4 + i * 0.12) % 1) * 1.5;
        child.scale.set(r, r, r);
        (child as Mesh).material && ((child as Mesh).material as THREE.MeshBasicMaterial).opacity !== undefined &&
          (((child as Mesh).material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.25 - r / 6));
      });
    }
  });

  return (
    <>
      {/* EM source */}
      <mesh position={[-4, 2.5, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 16]} />
        <meshStandardMaterial color="#ff7043" emissive="#ff7043" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[-4, 4, 0]} fontSize={0.18} color="#ff7043">
        Источник ЭМП
      </Text>

      {/* Incident waves */}
      <group ref={wavesRef} position={[-4, 2.5, 0]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1, 0.015, 8, 64]} />
            <meshBasicMaterial color="#ff7043" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Metal shield */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.3, 4, 4]} />
        <meshStandardMaterial color="#78909c" metalness={0.9} roughness={0.2} />
      </mesh>
      <Text position={[0, 5, 0]} fontSize={0.2} color="#78909c">
        Экран (сталь / медь)
      </Text>
      <Text position={[0, -0.5, 0]} fontSize={0.16} color="#aaa">
        δ = L / (8.69 × √(π·f·μₐ·γ))
      </Text>

      {/* Attenuated waves */}
      <group ref={attRef} position={[0.5, 2.5, 0]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[1, 0.008, 8, 64]} />
            <meshBasicMaterial color="#66bb6a" transparent opacity={0.2} />
          </mesh>
        ))}
      </group>

      {/* Person */}
      <mesh position={[4, 1.5, 0]}>
        <capsuleGeometry args={[0.25, 1, 8, 16]} />
        <meshStandardMaterial color="#ffab91" />
      </mesh>
      <mesh position={[4, 2.5, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffab91" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
    </>
  );
}

/* ─── emfProtection: multiple protection methods overview ─── */
export function EMFProtectionScene() {
  const t = useRef(0);
  const shieldRef = useRef<Mesh>(null!);

  useFrame((_, d) => {
    t.current += d;
    if (shieldRef.current) {
      shieldRef.current.material && ((shieldRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.2 + 0.1 * Math.sin(t.current * 2));
    }
  });

  return (
    <>
      {/* Source */}
      <mesh position={[-4, 2, 0]}>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
        <meshStandardMaterial color="#ff7043" emissive="#ff5722" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[-4, 3.5, 0]} fontSize={0.16} color="#ff7043" anchorX="center">
        Излучатель
      </Text>

      {/* Distance marker */}
      <Text position={[-1.5, 0.3, 0]} fontSize={0.18} color="#ffeb3b" anchorX="center">
        Защита расстоянием →
      </Text>

      {/* Shield */}
      <mesh ref={shieldRef} position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 3.5, 3.5]} />
        <meshStandardMaterial color="#78909c" metalness={0.8} roughness={0.3} emissive="#90a4ae" emissiveIntensity={0.2} />
      </mesh>
      <Text position={[0, 4.2, 0]} fontSize={0.16} color="#90a4ae" anchorX="center">
        Экранирование
      </Text>

      {/* Worker with protective gear */}
      <group position={[3, 0, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[0.25, 1, 8, 16]} />
          <meshStandardMaterial color="#1565c0" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ffab91" />
        </mesh>
        {/* Visor */}
        <mesh position={[0, 2.5, 0.2]}>
          <boxGeometry args={[0.35, 0.15, 0.05]} />
          <meshStandardMaterial color="#1a237e" transparent opacity={0.6} />
        </mesh>
        <Text position={[0, 3.5, 0]} fontSize={0.16} color="#42a5f5" anchorX="center">
          СИЗ
        </Text>
      </group>

      {/* Time protection */}
      <Text position={[0, 5.5, 0]} fontSize={0.2} color="#fff" anchorX="center">
        Методы защиты от ЭМП
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
    </>
  );
}
