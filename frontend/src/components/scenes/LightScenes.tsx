/**
 * 3D scenes for Labs 1 & 2 — Производственное освещение
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Mesh, Group, PointLight as TPointLight } from 'three';

/* ─── pointLightDemo: shows a point source emitting light radially ─── */
export function PointLightDemoScene() {
  const bulb = useRef<Mesh>(null!);
  const light = useRef<TPointLight>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    const pulse = 0.6 + 0.4 * Math.sin(t.current * 2);
    if (light.current) light.current.intensity = pulse * 60;
    if (bulb.current) {
      bulb.current.scale.setScalar(0.8 + 0.2 * pulse);
    }
  });

  return (
    <>
      {/* Glowing bulb */}
      <mesh ref={bulb} position={[0, 3, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial color="#fff9c4" />
      </mesh>
      <pointLight ref={light} position={[0, 3, 0]} castShadow intensity={60} color="#fff9c4" distance={20} />

      {/* Radial lines to show emission */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 2, 3, Math.sin(angle) * 2]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color="#fff9c4" transparent opacity={0.5} />
          </mesh>
        );
      })}

      {/* Objects illuminated */}
      <mesh position={[-2, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#42a5f5" />
      </mesh>
      <mesh position={[2, 0.5, -1]} castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#66bb6a" />
      </mesh>
      <mesh position={[0, 0.4, 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
        <meshStandardMaterial color="#ffa726" />
      </mesh>

      <Text position={[0, 5.5, 0]} fontSize={0.3} color="#fff">
        Ф = I × ω (лм)
      </Text>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── inverseSqLaw: light moves closer/further, showing E = I/r² ─── */
export function InverseSqLawScene() {
  const groupRef = useRef<Group>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    const dist = 2 + 3 * (0.5 + 0.5 * Math.sin(t.current * 0.5));
    if (groupRef.current) groupRef.current.position.y = dist;
  });

  const plates = [0, 1, 2, 3, 4].map((i) => {
    const y = 1 + i * 1.5;
    const size = 0.3 + i * 0.3;
    return (
      <group key={i}>
        <mesh position={[0, y, 0]} receiveShadow>
          <boxGeometry args={[size * 2, 0.05, size * 2]} />
          <meshStandardMaterial color={`hsl(${200 - i * 30}, 70%, ${70 - i * 10}%)`} />
        </mesh>
        <Text position={[size + 0.5, y, 0]} fontSize={0.15} color="#aaa">
          {`r=${(y).toFixed(1)}м`}
        </Text>
      </group>
    );
  });

  return (
    <>
      <group ref={groupRef} position={[0, 5, 0]}>
        <pointLight intensity={80} castShadow color="#fff9c4" distance={20} />
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#fff9c4" />
        </mesh>
      </group>
      {plates}
      <Text position={[0, 8, 0]} fontSize={0.25} color="#fff">
        E = I / r²
      </Text>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── lightingTypes: room with window (natural) + lamp (artificial) ─── */
export function LightingTypesScene() {
  const sunRef = useRef<Group>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    if (sunRef.current) {
      sunRef.current.position.x = -6 + Math.sin(t.current * 0.3) * 2;
      sunRef.current.position.y = 6 + Math.cos(t.current * 0.3);
    }
  });

  return (
    <>
      {/* Room walls */}
      <mesh position={[0, 2.5, -4]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 8]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      <mesh position={[5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 8]} />
        <meshStandardMaterial color="#90a4ae" />
      </mesh>

      {/* Window (opening in left wall) */}
      <mesh position={[-4.85, 3, 0]}>
        <boxGeometry args={[0.1, 2, 2.5]} />
        <meshBasicMaterial color="#e3f2fd" transparent opacity={0.3} />
      </mesh>

      {/* Sunlight through window */}
      <group ref={sunRef} position={[-6, 6, 0]}>
        <directionalLight intensity={2} castShadow color="#fff8e1" />
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ffeb3b" />
        </mesh>
      </group>

      {/* Ceiling lamp */}
      <mesh position={[0, 4.8, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 0.15, 32]} />
        <meshStandardMaterial color="#b0bec5" />
      </mesh>
      <pointLight position={[0, 4.6, 0]} intensity={30} castShadow color="#fff3e0" />

      {/* Desk */}
      <mesh position={[0, 0.75, -1]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>

      {/* Labels */}
      <Text position={[-4, 5, 2]} fontSize={0.2} color="#fff">
        Естественное
      </Text>
      <Text position={[0, 5.5, 0]} fontSize={0.2} color="#fff">
        Искусственное
      </Text>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>
    </>
  );
}

/* ─── stroboscopic: rotating wheel under flickering light ─── */
export function StroboscopicScene() {
  const wheelRef = useRef<Mesh>(null!);
  const lightRef = useRef<TPointLight>(null!);
  const t = useRef(0);

  useFrame((_, d) => {
    t.current += d;
    // Continuous wheel rotation
    if (wheelRef.current) wheelRef.current.rotation.z += d * 8;
    // Flickering light at ~8 Hz to create stroboscopic effect
    if (lightRef.current) {
      const flicker = Math.sin(t.current * 50) > 0 ? 50 : 2;
      lightRef.current.intensity = flicker;
    }
  });

  return (
    <>
      <pointLight ref={lightRef} position={[0, 4, 2]} castShadow color="#e0e0e0" />

      {/* Rotating wheel with spokes */}
      <group position={[0, 2.5, 0]}>
        <mesh ref={wheelRef} castShadow>
          <torusGeometry args={[1.2, 0.08, 16, 64]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        {/* Spokes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[0, 0, 0]} rotation={[0, 0, angle]}>
              <boxGeometry args={[2.4, 0.04, 0.04]} />
              <meshStandardMaterial color="#bdbdbd" />
            </mesh>
          );
        })}
        {/* Mark on the rim to track rotation */}
        <mesh position={[1.2, 0, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#f44336" emissive="#f44336" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <Text position={[0, 5, 0]} fontSize={0.25} color="#fff">
        Стробоскопический эффект (мерцание 100 Гц)
      </Text>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}

/* ─── luminaireLayout: room with grid of ceiling luminaires ─── */
export function LuminaireLayoutScene() {
  const rows = 3;
  const cols = 4;
  const luminaires: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -3 + c * 2;
      const z = -2 + r * 2;
      luminaires.push(
        <group key={`${r}-${c}`} position={[x, 4.5, z]}>
          <mesh>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#e0e0e0" emissive="#fff9c4" emissiveIntensity={0.5} />
          </mesh>
          <pointLight intensity={8} distance={6} position={[0, -0.1, 0]} color="#fff3e0" />
        </group>
      );
    }
  }

  return (
    <>
      {/* Room */}
      <mesh position={[0, 4.7, 0]} receiveShadow>
        <boxGeometry args={[10, 0.1, 8]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>
      <mesh position={[0, 2.5, -4]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#90a4ae" />
      </mesh>
      {luminaires}
      <Text position={[0, 5.5, 0]} fontSize={0.25} color="#fff">
        {`N = ${rows}×${cols} = ${rows * cols} светильников`}
      </Text>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>
    </>
  );
}

/* ─── luminaireCalc: visual formula with 3D room ─── */
export function LuminaireCalcScene() {
  return (
    <>
      <mesh position={[0, 2.5, -3]}>
        <boxGeometry args={[8, 5, 0.2]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>
      <mesh position={[-4, 2.5, 0]}>
        <boxGeometry args={[0.2, 5, 6]} />
        <meshStandardMaterial color="#607d8b" />
      </mesh>
      {/* Luminaires row */}
      {[-2, 0, 2].map((x) => (
        <group key={x} position={[x, 4.5, 0]}>
          <mesh>
            <boxGeometry args={[1.4, 0.06, 0.3]} />
            <meshStandardMaterial color="#e0e0e0" emissive="#fff9c4" emissiveIntensity={0.6} />
          </mesh>
          <pointLight intensity={12} distance={6} color="#fff3e0" />
        </group>
      ))}
      <Text position={[0, 6, 0]} fontSize={0.22} color="#90caf9" anchorX="center">
        {`N = (Eн×S×Kз×z) / (n×Фл×η)`}
      </Text>
      <Text position={[0, 5.4, 0]} fontSize={0.18} color="#aaa" anchorX="center">
        Индекс помещения: i = LB / (Hp(L+B))
      </Text>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>
    </>
  );
}

/* ─── lampTypes: comparison of different lamps ─── */
export function LampTypesScene() {
  const t = useRef(0);
  const fluorRef = useRef<TPointLight>(null!);

  useFrame((_, d) => {
    t.current += d;
    // Slight flicker for fluorescent
    if (fluorRef.current) {
      fluorRef.current.intensity = 20 + Math.sin(t.current * 100) * 3;
    }
  });

  const lamps = [
    { x: -3, label: 'Накаливания\n~15 лм/Вт', color: '#ffcc80', intensity: 15 },
    { x: 0, label: 'Люминесцентная\n~70 лм/Вт', color: '#e0f7fa', intensity: 20 },
    { x: 3, label: 'Галогенная\n~22 лм/Вт', color: '#fff8e1', intensity: 18 },
  ];

  return (
    <>
      {lamps.map((lamp, i) => (
        <group key={i} position={[lamp.x, 3.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color={lamp.color} />
          </mesh>
          <pointLight
            ref={i === 1 ? fluorRef : undefined}
            intensity={lamp.intensity}
            distance={5}
            color={lamp.color}
            castShadow
          />
          {/* Shade */}
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.5, 0.3, 32, 1, true]} />
            <meshStandardMaterial color="#616161" side={2} />
          </mesh>
          <Text position={[0, -0.8, 0]} fontSize={0.18} color="#fff" anchorX="center" textAlign="center">
            {lamp.label}
          </Text>
        </group>
      ))}

      {/* Table surface */}
      <mesh position={[0, 1.5, 0]} receiveShadow>
        <boxGeometry args={[9, 0.1, 3]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
    </>
  );
}
