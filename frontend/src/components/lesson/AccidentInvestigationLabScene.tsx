import { Billboard, Text as DreiText } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type Stage =
  | 'firstAid'
  | 'preventHazard'
  | 'preserveScene'
  | 'notify'
  | 'commission'
  | 'investigation'
  | 'report';

export interface AccidentInvestigationLabSceneProps {
  state: {
    stage: Stage;
    severity: 'light' | 'heavyOrFatal';
  };
  timeScale: number;
}

function Label({
  position,
  children,
  color = '#ffffff',
  size = 0.11,
}: {
  position: [number, number, number];
  children: string;
  color?: string;
  size?: number;
}) {
  return (
    <Billboard position={position} follow>
      <DreiText
        fontWeight={700}
        outlineWidth={size * 0.16}
        outlineColor="#141414"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0]}
        fontSize={size}
        color={color}
        maxWidth={6}
      >
        {children}
      </DreiText>
    </Billboard>
  );
}

function Arrow({
  from,
  to,
  color = '#90a4ae',
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}) {
  const { position, quaternion, height } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const h = Math.max(0.01, dir.length());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: mid, quaternion: q, height: h };
  }, [from, to]);

  return (
    <group>
      <mesh position={position} quaternion={quaternion}>
        <cylinderGeometry args={[0.035, 0.035, height, 10]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={to} quaternion={quaternion}>
        <coneGeometry args={[0.08, 0.18, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

function StepNode({
  id,
  title,
  position,
  active,
}: {
  id: string;
  title: string;
  position: [number, number, number];
  active: boolean;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.9, 0.55, 0.55]} />
        <meshStandardMaterial
          color={active ? '#ffee58' : '#e0e0e0'}
          emissive={active ? '#ffc107' : '#000000'}
          emissiveIntensity={active ? 0.22 : 0}
          roughness={0.65}
        />
      </mesh>
      <Label position={[0, 0.45, 0]} color={active ? '#ffffff' : '#f5f5f5'} size={0.11}>
        {title}
      </Label>
      <Label position={[-0.96, -0.35, 0]} color="#ffffff" size={0.09}>
        {id}
      </Label>
    </group>
  );
}

export default function AccidentInvestigationLabScene({ state, timeScale }: AccidentInvestigationLabSceneProps) {
  const pulse = useRef(0);
  useFrame((_, d) => {
    pulse.current += d * timeScale;
  });

  const nodes = useMemo(
    () =>
      [
        { stage: 'firstAid' as const, id: '1', title: 'Первая помощь', p: [-3.2, 1.8, 0] as [number, number, number] },
        { stage: 'preventHazard' as const, id: '2', title: 'Предотвратить опасность', p: [0, 1.8, 0] as [number, number, number] },
        { stage: 'preserveScene' as const, id: '3', title: 'Зафиксировать обстановку', p: [3.2, 1.8, 0] as [number, number, number] },
        { stage: 'notify' as const, id: '4', title: 'Уведомления', p: [-3.2, 0.4, 0] as [number, number, number] },
        { stage: 'commission' as const, id: '5', title: 'Комиссия', p: [0, 0.4, 0] as [number, number, number] },
        { stage: 'investigation' as const, id: '6', title: 'Материалы расследования', p: [3.2, 0.4, 0] as [number, number, number] },
        { stage: 'report' as const, id: '7', title: 'Итоги и акты', p: [0, -0.55, 0] as [number, number, number] },
      ] as const,
    [],
  );

  const isActive = (s: Stage) => state.stage === s;
  const deadlineDays = state.severity === 'light' ? 3 : 15;
  const deadlineColor = state.severity === 'light' ? '#c8e6c9' : '#ffcdd2';
  const deadlineText = state.severity === 'light' ? 'Лёгкий случай: 3 дня' : 'Тяжёлый/смертельный: 15 дней';

  const glow = 0.12 + 0.1 * (Math.sin(pulse.current * 2.2) * 0.5 + 0.5);
  const yLift = 0.9;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#eceff1" roughness={0.98} />
      </mesh>

      <group position={[0, yLift, 0]}>
        {nodes.map((n) => (
          <StepNode key={n.stage} id={n.id} title={n.title} position={n.p} active={isActive(n.stage)} />
        ))}

        {/* arrows — логический порядок 1→2→3→4→5→6→7 */}
        <Arrow from={[-2.2, 1.8, 0]} to={[-0.95, 1.8, 0]} />
        <Arrow from={[0.95, 1.8, 0]} to={[2.2, 1.8, 0]} />
        {/* 3 → 4 (диагональ к следующей строке) */}
        <Arrow from={[3.2, 1.52, 0]} to={[-3.2, 0.68, 0]} />
        <Arrow from={[-2.2, 0.4, 0]} to={[-0.95, 0.4, 0]} />
        <Arrow from={[0.95, 0.4, 0]} to={[2.2, 0.4, 0]} />
        {/* 6 → 7 (к финальному оформлению) */}
        <Arrow from={[3.2, 0.12, 0]} to={[0, -0.32, 0]} />

        {/* deadline card */}
        <group position={[5.55, 0.9, 0]}>
          {/* Текст вынесен над блоком, чтобы не "влезал" внутрь */}
          <Label position={[0, 1.0, 0]} color="#ffffff" size={0.11}>
            {deadlineText}
          </Label>
          <Label position={[0, 0.72, 0]} color="#ffffff" size={0.1}>
            {`Срок: ${deadlineDays} дней`}
          </Label>
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.85, 0.42]} />
            <meshStandardMaterial
              color={deadlineColor}
              roughness={0.8}
              emissive={deadlineColor}
              emissiveIntensity={glow * 0.25}
            />
          </mesh>
        </group>
      </group>
    </>
  );
}

