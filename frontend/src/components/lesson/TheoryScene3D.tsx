import { useRef, useMemo, useEffect } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { OrbitControls, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SafeCanvas from '../SafeCanvas';
import type { TheorySimulatorType } from '../../types/theme';

/* ─── Scene title map ─── */
export const sceneTitle: Record<TheorySimulatorType, string> = {
  'light-flux': 'Распространение светового потока от источника',
  'light-illuminance': 'Как освещённость зависит от площади поверхности',
  'light-brightness': 'Яркость и слепящее действие источника',
  'light-pulsation': 'Пульсация света и стробоскопический эффект',
  'light-room-index': 'Индекс помещения — зависимость от размеров',
  'light-specific-power': 'Расположение светильников в помещении',
  'light-multi-source': 'Управление отдельными светильниками в помещении',
  'noise-distance': 'Ослабление шума с расстоянием от источника',
  'noise-barrier': 'Звукоизоляция: отражение звука преградой',
  'noise-sum': 'Суммирование шума от нескольких источников',
  'noise-reflection': 'Отражение звуковых волн от стены',
  'emi-spectrum': 'Длина электромагнитной волны и частота',
  'emi-wave': 'Плотность потока энергии (ППЭ) электромагнитного поля',
  'emi-ppe-zones': 'Зоны вокруг источника ЭМИ (ближняя / промежуточная / дальняя)',
};

/* ─── Bold label helper ─── */
function Label({
  children,
  position,
  color = '#000',
  size = 0.18,
}: {
  children: string;
  position: [number, number, number];
  color?: string;
  size?: number;
}) {
  return (
    <Text
      fontSize={size}
      color={color}
      position={position}
      outlineWidth={size * 0.15}
      outlineColor="#111111"
      fontWeight={700}
      anchorX="center"
      anchorY="middle"
    >
      {children}
    </Text>
  );
}

/* ─────────────── Reusable scene furniture ─────────────── */

function Room({ width = 10, depth = 8, height = 3.2, wallColor = '#d9d0c4' }: {
  width?: number; depth?: number; height?: number; wallColor?: string;
}) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#6e6259" roughness={0.8} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f0ece4" />
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
        <meshStandardMaterial color="#a07850" roughness={0.5} />
      </mesh>
      {[[-0.5, 0, -0.22], [0.5, 0, -0.22], [-0.5, 0, 0.22], [0.5, 0, 0.22]].map((leg, i) => (
        <mesh key={i} position={[leg[0] * (width / 1.2), 0.36, leg[2]]} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color="#6b4530" />
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
    if (coneRef.current) coneRef.current.rotation.y += delta * 0.3;
  });

  return (
    <>
      <Room width={6} depth={5} height={3} />
      <Desk position={[0, 0, 0.5]} />
      {/* Lamp body */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial emissive="#ffe066" emissiveIntensity={Math.min(3, flux / 600)} color="#ffe066" />
      </mesh>
      {/* Light cone visualization — from lamp downward to desk */}
      <mesh ref={coneRef} position={[0, 1.5, 0]}>
        <coneGeometry args={[Math.tan(coneAngle) * 1.8, 1.8, 12, 1, true]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.18 + flux / 4000} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color="#ffe066" intensity={flux / 250} distance={8} decay={2} castShadow />
      {/* Bold labels */}
      <Label position={[0, 2.85, 0]} color="#c46900" size={0.18}>{`I = ${intensity} кд`}</Label>
      <Label position={[0, 0.85, 0.6]} color="#0050a0" size={0.16}>{`Φ = I·ω = ${flux.toFixed(0)} лм`}</Label>
      <Label position={[1.2, 2.2, 0]} color="#555" size={0.12}>{`ω = ${solidAngle.toFixed(2)} ср`}</Label>
    </>
  );
}

/* ─────────────── Illuminance Scene ─────────────── */

function IlluminanceScene({ flux, area }: { flux: number; area: number }) {
  const illuminance = area > 0 ? flux / area : 0;
  const gridSize = Math.sqrt(area);
  // Dramatic color change: dark when low, bright yellow when high
  const t = Math.min(1, illuminance / 800);
  const surfaceColor = new THREE.Color().lerpColors(new THREE.Color('#2a1a0a'), new THREE.Color('#fffde0'), t);

  return (
    <>
      <Room width={8} depth={6} height={3} />
      {/* Work surface with dramatic illuminance coloring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.7} />
      </mesh>
      {/* Grid lines to show area */}
      {Array.from({ length: Math.ceil(gridSize) + 1 }).map((_, i) => (
        <group key={`grid-${i}`}>
          <mesh position={[-gridSize / 2 + i, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.015, gridSize]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0.02, -gridSize / 2 + i]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.015, gridSize]} />
            <meshBasicMaterial color="#333" />
          </mesh>
        </group>
      ))}
      {/* Light source — brighter and more visible */}
      <pointLight position={[0, 2.8, 0]} color="#fff5e0" intensity={flux / 300} distance={6} decay={2} castShadow />
      <mesh position={[0, 2.8, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial emissive="#ffe066" emissiveIntensity={Math.min(3, flux / 1500)} />
      </mesh>
      <Label position={[0, 0.5, gridSize / 2 + 0.4]} color="#004080" size={0.2}>{`E = ${illuminance.toFixed(0)} лк`}</Label>
      <Label position={[gridSize / 2 + 0.2, 0.25, 0]} color="#006030" size={0.14}>{`S = ${area.toFixed(1)} м²`}</Label>
      <Label position={[0, 2.3, 0.5]} color="#804000" size={0.13}>{`Φ = ${flux} лм`}</Label>
      {/* Norm indicator */}
      <Label position={[0, 0.25, gridSize / 2 + 0.4]} color={illuminance >= 300 ? '#006600' : '#cc0000'} size={0.12}>
        {illuminance >= 300 ? '✓ Норма ≥ 300 лк' : '✗ Ниже нормы 300 лк'}
      </Label>
    </>
  );
}

/* ─────────────── Pulsation Scene ─────────────── */

function PulsationScene({ eMax, eMin, eAvg }: { eMax: number; eMin: number; eAvg: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const wheelRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const kp = eAvg > 0 ? ((eMax - eMin) / (2 * eAvg)) * 100 : 0;
  // Pulsation frequency: higher kp = more visible flicker
  const pulsationFreq = 4 + kp * 0.3;  // visible range

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (lightRef.current) {
      // Strong visible pulsation proportional to Kp
      const t = timeRef.current * pulsationFreq;
      const frac = (Math.sin(t * Math.PI * 2) + 1) / 2;
      const minI = eMin / 150;
      const maxI = eMax / 150;
      lightRef.current.intensity = minI + frac * (maxI - minI);
    }
    // Stroboscopic effect: wheel spins at frequency that beats with pulsation
    if (wheelRef.current) {
      // Spin at a speed that creates visible stroboscopic illusion when kp is high
      const rpm = pulsationFreq * 0.98; // Slightly detuned from puls. freq
      wheelRef.current.rotation.z += delta * rpm * Math.PI * 2;
    }
  });

  return (
    <>
      <Room width={8} depth={6} height={3} />
      <Desk position={[-1.5, 0, 0.5]} />
      <Desk position={[1.5, 0, 0.5]} />
      {/* Fluorescent lamp — large, bright */}
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[2.0, 0.06, 0.15]} />
        <meshStandardMaterial emissive="#e0ffe0" emissiveIntensity={kp > 10 ? 0.8 : 1.2} color="#d0f0d0" />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.8, 0]} color="#f0fff0" intensity={eAvg / 150} distance={6} decay={2} castShadow />
      {/* STROBOSCOPIC WHEEL — large, high-contrast black-white sectors */}
      <group ref={wheelRef} position={[0, 1.5, -1]}>
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 0.06, 16]} />
          <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <mesh key={i} position={[0.35 * Math.cos(angle), 0.35 * Math.sin(angle), 0.035]}>
              <boxGeometry args={[0.12, 0.25, 0.02]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#000000'} />
            </mesh>
          );
        })}
      </group>
      <Label position={[-2, 2.5, 2]} color={kp > 10 ? '#cc0000' : '#006600'} size={0.2}>{`Kп = ${kp.toFixed(1)}%`}</Label>
      <Label position={[-2, 2.2, 2]} color="#333" size={0.13}>
        {kp > 10 ? '⚠ Повышенная пульсация! Стробоскоп!' : '✓ Пульсация в норме'}
      </Label>
      <Label position={[0, 0.9, -1]} color="#555" size={0.1}>{'← Вращающийся диск'}</Label>
    </>
  );
}

/* ─────────────── Room Index Scene ─────────────── */

function RoomIndexScene({ length, width, height }: { length: number; width: number; height: number }) {
  const hp = Math.max(0.5, height - 0.3);
  const idx = (length * width) / (hp * (length + width));

  return (
    <>
      <Room width={length} depth={width} height={height} wallColor="#c8c0b4" />
      {/* Dimension arrows — thick, vivid */}
      <mesh position={[0, 0.04, width / 2 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.06]} />
        <meshBasicMaterial color="#cc2200" />
      </mesh>
      <Label position={[0, 0.2, width / 2 + 0.4]} color="#cc2200" size={0.16}>{`L = ${length.toFixed(1)} м`}</Label>
      <mesh position={[length / 2 + 0.2, 0.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[width, 0.06]} />
        <meshBasicMaterial color="#0055cc" />
      </mesh>
      <Label position={[length / 2 + 0.5, 0.2, 0]} color="#0055cc" size={0.16}>{`B = ${width.toFixed(1)} м`}</Label>
      {/* Height line */}
      <mesh position={[-length / 2 + 0.15, height / 2, -width / 2 + 0.08]}>
        <boxGeometry args={[0.03, height, 0.03]} />
        <meshBasicMaterial color="#00aa44" />
      </mesh>
      <Label position={[-length / 2 + 0.6, height / 2, -width / 2 + 0.2]} color="#00aa44" size={0.13}>{`H = ${height.toFixed(1)} м`}</Label>
      {/* Hp line */}
      <mesh position={[-length / 2 + 0.35, (hp + 0.3) / 2 + 0.15, -width / 2 + 0.08]}>
        <boxGeometry args={[0.025, hp, 0.025]} />
        <meshBasicMaterial color="#cc8800" />
      </mesh>
      <Label position={[-length / 2 + 0.85, hp / 2 + 0.2, -width / 2 + 0.2]} color="#cc8800" size={0.13}>{`Hp = ${hp.toFixed(2)} м`}</Label>
      {/* Luminaires grid */}
      {Array.from({ length: 3 }).map((_, i) =>
        Array.from({ length: 2 }).map((_, j) => (
          <mesh key={`lum-${i}-${j}`} position={[-length / 3 + i * (length / 3), height - 0.05, -width / 4 + j * (width / 2)]}>
            <boxGeometry args={[0.5, 0.04, 0.12]} />
            <meshStandardMaterial emissive="#ffe066" emissiveIntensity={0.8} color="#eee" />
          </mesh>
        )),
      )}
      <pointLight position={[0, height - 0.1, 0]} color="#fff5e0" intensity={3} distance={height + 2} decay={2} />
      <Label position={[0, 0.5, 0]} color="#000080" size={0.24}>{`i = ${idx.toFixed(3)}`}</Label>
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
      const t = (timeRef.current * 1.2 + i * 0.6) % 3;
      mesh.scale.set(0.3 + t * 1.5, 0.3 + t * 1.5, 0.3 + t * 1.5);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.02, 0.5 - t * 0.15);
    });
  });

  // Sound bar indicator — dramatic, from green to red
  const danger = Math.min(1, Math.max(0, (levelAtR - 40) / 80));

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#2d3a42" roughness={0.8} />
      </mesh>
      {/* Noise source machine — vivid red */}
      <mesh position={[-5, 0.9, 0]} castShadow>
        <boxGeometry args={[1.4, 1.8, 1.2]} />
        <meshStandardMaterial color="#cc2222" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-5, 2.0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.7, 8]} />
        <meshStandardMaterial color="#777" metalness={0.8} />
      </mesh>
      <Label position={[-5, 2.6, 0]} color="#cc0000" size={0.2}>{`L₁ = ${level} дБ`}</Label>
      <Label position={[-5, -0.1, 1.2]} color="#555" size={0.11}>{'Источник шума'}</Label>
      {/* Sound waves — bigger, more visible */}
      <group ref={waveRef} position={[-5, 1.2, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[1, 0.025, 6, 24]} />
            <meshBasicMaterial color="#ff6644" transparent opacity={0.35} />
          </mesh>
        ))}
      </group>
      {/* Distance line — thick yellow */}
      <mesh position={[-5 + distance / 2, 0.04, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[distance, 0.06]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
      <Label position={[-5 + distance / 2, 0.3, 2.3]} color="#806600" size={0.15}>{`R = ${distance.toFixed(1)} м`}</Label>
      {/* Observer with level bar */}
      <group position={[-5 + distance, 0, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.55, 8, 16]} />
          <meshStandardMaterial color="#2266cc" />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        {/* Level indicator bar next to person */}
        <mesh position={[0.5, 0.5 + danger * 1, 0]}>
          <boxGeometry args={[0.15, danger * 2, 0.15]} />
          <meshStandardMaterial color={danger > 0.66 ? '#cc0000' : danger > 0.33 ? '#ff8800' : '#00aa44'} />
        </mesh>
        <Label position={[0, 2, 0]} color={levelAtR > 80 ? '#cc0000' : '#006600'} size={0.18}>{`LR = ${levelAtR.toFixed(1)} дБ`}</Label>
        <Label position={[0, -0.1, 0.8]} color="#555" size={0.1}>{'Рабочее место'}</Label>
      </group>
      <Label position={[-1, 3.5, 0]} color="#333" size={0.12}>{'Формула: LR = L₁ − 20·lg(R) − 8 дБ'}</Label>
    </>
  );
}

/* ─────────────── Noise Barrier Scene ─────────────── */

function NoiseBarrierScene({ mass, levelBefore }: { mass: number; levelBefore: number }) {
  const N = 14.5 * Math.log10(Math.max(10, mass)) + 15;
  const levelAfter = levelBefore - N;
  const reductionPct = ((levelBefore - levelAfter) / levelBefore) * 100;

  const incomingRef = useRef<THREE.Group>(null);
  const reflectedRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    // Incoming waves: expand from source (-4) toward barrier (0)
    if (incomingRef.current) {
      incomingRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = (timeRef.current * 0.9 + i * 0.7) % 3;
        const x = -4 + t * 1.4;
        mesh.position.x = x;
        const scale = 0.4 + t * 0.35;
        mesh.scale.set(scale, scale, scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.03, 0.5 - t * 0.14);
      });
    }
    // Reflected waves: bounce back from barrier (0) toward source
    if (reflectedRef.current) {
      reflectedRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = (timeRef.current * 0.7 + i * 0.7) % 3;
        const x = 0.4 - t * 1.2;
        mesh.position.x = x;
        const scale = 0.25 + t * 0.2;
        mesh.scale.set(scale, scale, scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        // Reflected waves are weaker — opacity depends on mass (heavier barrier = more reflection)
        const reflStrength = Math.min(1, N / 40);
        mat.opacity = Math.max(0.02, 0.35 * reflStrength - t * 0.1);
      });
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#2d3a42" />
      </mesh>
      {/* Source — large red machine */}
      <mesh position={[-4, 1.2, 0]} castShadow>
        <boxGeometry args={[1.2, 2.0, 1.0]} />
        <meshStandardMaterial color="#cc2222" metalness={0.4} />
      </mesh>
      <Label position={[-4, 2.6, 0]} color="#cc0000" size={0.18}>{`L = ${levelBefore} дБ`}</Label>
      <Label position={[-4, -0.1, 1]} color="#555" size={0.1}>{'Источник шума'}</Label>
      {/* Animated incoming sound waves — red, expanding */}
      <group ref={incomingRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`inc-${i}`} position={[-4 + i * 0.8, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.5, 0.02, 6, 16]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>
      {/* Barrier wall — thick, prominent */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.35, 3.6, 5]} />
        <meshStandardMaterial color="#778899" roughness={0.6} />
      </mesh>
      <Label position={[0, 3.8, 0]} color="#334455" size={0.15}>{`Преграда: G = ${mass} кг/м²`}</Label>
      <Label position={[0, 3.4, 0]} color="#cc8800" size={0.15}>{`N = 14.5·lg(${mass})+15 = ${N.toFixed(1)} дБ`}</Label>
      {/* Animated reflected waves — blue, bouncing back from barrier */}
      <group ref={reflectedRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={`refl-${i}`} position={[-i * 0.6, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.35, 0.015, 6, 16]} />
            <meshBasicMaterial color="#4488ff" transparent opacity={0.25} />
          </mesh>
        ))}
      </group>
      {/* Weakened transmitted waves after barrier — green, smaller */}
      {[1, 2].map((i) => (
        <mesh key={`after-${i}`} position={[0.5 + i * 0.6, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2 + i * 0.08, 0.012, 6, 16]} />
          <meshBasicMaterial color="#44bb44" transparent opacity={Math.max(0.05, 0.2 - N / 200)} />
        </mesh>
      ))}
      {/* Observer */}
      <group position={[4, 0, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.55, 8, 16]} />
          <meshStandardMaterial color="#2266cc" />
        </mesh>
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        <Label position={[0, 2.1, 0]} color={levelAfter > 80 ? '#cc0000' : '#006600'} size={0.18}>{`L′ = ${levelAfter.toFixed(1)} дБ`}</Label>
      </group>
      {/* Legend */}
      <Label position={[-2.5, 3.2, 2.5]} color="#cc0000" size={0.11}>{'→ Падающий звук'}</Label>
      <Label position={[-2.5, 2.9, 2.5]} color="#0044cc" size={0.11}>{'← Отражённый звук'}</Label>
      <Label position={[2.5, 2.9, 2.5]} color="#228822" size={0.11}>{'→ Прошедший звук'}</Label>
      <Label position={[0, 0.3, 3]} color="#444" size={0.12}>{`Снижение: ${reductionPct.toFixed(0)}%`}</Label>
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
        const t = (timeRef.current * 0.8 + i * 0.5 + idx * 1.2) % 3;
        const scale = 0.3 + t * 1.5;
        mesh.scale.set(scale, scale, scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.02, 0.45 - t * 0.14);
      });
    });
  });

  const sources = [
    { x: -4, z: -2.5, level: l1, color: '#cc2222', label: 'Источник 1' },
    { x: -4, z: 0, level: l2, color: '#dd8800', label: 'Источник 2' },
    { x: -4, z: 2.5, level: l3, color: '#cc6600', label: 'Источник 3' },
  ];

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#2d3a42" />
      </mesh>
      {sources.map((src, idx) => (
        <group key={idx}>
          <mesh position={[src.x, 0.8, src.z]} castShadow>
            <boxGeometry args={[0.9, 1.2, 0.7]} />
            <meshStandardMaterial color={src.color} metalness={0.3} />
          </mesh>
          <Label position={[src.x, 1.8, src.z]} color={src.color} size={0.14}>{`${src.label}: ${src.level} дБ`}</Label>
          <group ref={waveRefs[idx]} position={[src.x, 1, src.z]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[1, 0.018, 6, 16]} />
                <meshBasicMaterial color={src.color} transparent opacity={0.3} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      {/* Observer */}
      <group position={[4, 0, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 8, 16]} />
          <meshStandardMaterial color="#2266cc" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        <Label position={[0, 2.3, 0]} color={total > 80 ? '#cc0000' : '#006600'} size={0.22}>{`LΣ = ${total.toFixed(1)} дБ`}</Label>
        <Label position={[0, -0.2, 1]} color="#555" size={0.1}>{'Суммарный уровень на рабочем месте'}</Label>
      </group>
      <Label position={[0, 3.5, 0]} color="#333" size={0.12}>{'LΣ = 10·lg(10^(L₁/10) + 10^(L₂/10) + 10^(L₃/10))'}</Label>
    </>
  );
}

/* ─────────────── Sound Reflection Scene ─────────────── */

function NoiseReflectionScene({ level }: { level: number }) {
  const waveRef = useRef<THREE.Group>(null);
  const reflectedRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    // Incoming waves
    if (waveRef.current) {
      waveRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = (timeRef.current * 1.0 + i * 0.5) % 3;
        const x = -4 + t * 2.5;
        mesh.position.x = x;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.05, 0.45 - t * 0.12);
      });
    }
    // Reflected waves
    if (reflectedRef.current) {
      reflectedRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = (timeRef.current * 0.8 + i * 0.5) % 3;
        const x = 3.5 - t * 2;
        mesh.position.x = x;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0.02, 0.3 - t * 0.1);
      });
    }
  });

  const reflected = Math.max(0, level * 0.7); // ~70% energy reflected

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#2d3a42" />
      </mesh>
      {/* Source */}
      <mesh position={[-5, 1.2, 0]} castShadow>
        <boxGeometry args={[1, 1.6, 0.8]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>
      <Label position={[-5, 2.4, 0]} color="#cc0000" size={0.16}>{`L = ${level} дБ`}</Label>
      {/* Wall */}
      <mesh position={[3.5, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 4, 6]} />
        <meshStandardMaterial color="#8899aa" roughness={0.5} />
      </mesh>
      <Label position={[3.5, 4.3, 0]} color="#445566" size={0.14}>{'Стена (твёрдая поверхность)'}</Label>
      {/* Incoming waves — red */}
      <group ref={waveRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-4 + i, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.6, 0.02, 6, 16]} />
            <meshBasicMaterial color="#ff4444" transparent opacity={0.35} />
          </mesh>
        ))}
      </group>
      {/* Reflected waves — blue */}
      <group ref={reflectedRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[3 - i, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.4, 0.015, 6, 16]} />
            <meshBasicMaterial color="#4488ff" transparent opacity={0.25} />
          </mesh>
        ))}
      </group>
      {/* Labels */}
      <Label position={[-2, 3, 0]} color="#cc0000" size={0.13}>{'→ Падающий звук'}</Label>
      <Label position={[1, 3, 0]} color="#0044cc" size={0.13}>{'← Отражённый звук'}</Label>
      <Label position={[-1, 0.3, 3]} color="#333" size={0.12}>{`Отражённый: ~${reflected.toFixed(0)} дБ`}</Label>
      <Label position={[-1, 0, 3]} color="#555" size={0.1}>{'Звукоизоляция = отражение + поглощение'}</Label>
    </>
  );
}

/* ─────────────── Specific Power Scene ─────────────── */

function SpecificPowerScene({ area, width, lampPower, density }: {
  area: number; width: number; lampPower: number; density: number;
}) {
  const length = area / Math.max(1, width);
  const specificPower = 40 * width;
  const lampsPerLuminaire = Math.max(1, Math.round(density / 40));
  const numLuminaires = Math.max(1, Math.round((specificPower * area) / (lampPower * lampsPerLuminaire)));
  const capped = Math.min(numLuminaires, 36); // visual cap
  const cols = Math.max(1, Math.round(Math.sqrt(capped * (length / width))));
  const rows = Math.max(1, Math.ceil(capped / cols));

  const luminaires = useMemo(() => {
    const result: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (result.length >= capped) break;
        const x = -length / 2 + (c + 0.5) * (length / cols);
        const z = -width / 2 + (r + 0.5) * (width / rows);
        result.push([x, z]);
      }
    }
    return result;
  }, [rows, cols, capped, length, width]);

  const totalPower = numLuminaires * lampPower * lampsPerLuminaire;
  const h = 3.0;

  return (
    <>
      <Room width={Math.max(4, length + 1)} depth={Math.max(4, width + 1)} height={h} wallColor="#d0c8b8" />
      {/* Desk + worker in center */}
      <Desk position={[0, 0, 0]} width={1.4} depth={0.7} />
      {/* Worker */}
      <mesh position={[0, 0.85, 0.6]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 8, 12]} />
        <meshStandardMaterial color="#2266cc" />
      </mesh>
      <mesh position={[0, 1.5, 0.6]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#ffcc99" />
      </mesh>
      {/* Luminaire grid */}
      {luminaires.map(([x, z], i) => (
        <group key={`lum-${i}`}>
          <mesh position={[x, h - 0.06, z]}>
            <boxGeometry args={[0.6, 0.04, 0.14]} />
            <meshStandardMaterial emissive="#ffe066" emissiveIntensity={0.9} color="#eee" />
          </mesh>
          <pointLight position={[x, h - 0.1, z]} color="#fff5e0" intensity={lampPower / 250} distance={h + 1} decay={2} />
        </group>
      ))}
      {/* Dimension arrows */}
      <mesh position={[0, 0.04, width / 2 + 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.05]} />
        <meshBasicMaterial color="#cc2200" />
      </mesh>
      <Label position={[0, 0.18, width / 2 + 1]} color="#cc2200" size={0.14}>{`L = ${length.toFixed(1)} м`}</Label>
      <mesh position={[length / 2 + 0.6, 0.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[width, 0.05]} />
        <meshBasicMaterial color="#0055cc" />
      </mesh>
      <Label position={[length / 2 + 0.9, 0.18, 0]} color="#0055cc" size={0.14}>{`B = ${width.toFixed(1)} м`}</Label>
      {/* Labels */}
      <Label position={[0, 0.4, -width / 2 + 0.3]} color="#000080" size={0.16}>{`N = ${numLuminaires} светильников`}</Label>
      <Label position={[0, 0.15, -width / 2 + 0.3]} color="#555" size={0.11}>{`P удельная = ${specificPower.toFixed(0)} Вт/м²`}</Label>
      <Label position={[0, -0.05, -width / 2 + 0.3]} color="#555" size={0.1}>{`P общая = ${totalPower.toFixed(0)} Вт`}</Label>
    </>
  );
}

/* ─────────────── Multi-Light Scene ─────────────── */

/**
 * Single corner spotLight sub-component.
 * Works around the R3F limitation that spotLight.target needs an Object3D ref.
 */
function CornerLight({
  cx, cz, color, numLabel, on, intensity, dirT, H,
}: {
  cx: number; cz: number; color: string; numLabel: string;
  on: boolean; intensity: number; dirT: number; H: number;
}) {
  const spotRef = useRef<THREE.SpotLight>(null);

  // Desk / worker head position
  const DX = 0, DY = 0.74, DZ = 0.4;
  // Target: lerp from floor below lamp → desk surface at worker
  const tx = cx + (DX - cx) * dirT;
  const ty = DY * dirT;
  const tz = cz + (DZ - cz) * dirT;
  const lx = cx, ly = H - 0.12, lz = cz;

  // Update SpotLight target whenever params change
  useEffect(() => {
    if (!spotRef.current) return;
    spotRef.current.target.position.set(tx, ty, tz);
    spotRef.current.target.updateMatrixWorld();
  });

  // Cone geometry — compute direction & length from lamp to target
  const [ex, ey, ez, coneLen] = useMemo(() => {
    const dx = tx - lx, dy = ty - ly, dz = tz - lz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const eu = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-dx / len, -dy / len, -dz / len),
      ),
    );
    return [eu.x, eu.y, eu.z, len];
  }, [tx, ty, tz, lx, ly, lz]);

  const midX = (lx + tx) / 2, midY = (ly + ty) / 2, midZ = (lz + tz) / 2;
  const coneRadius = Math.max(0.1, (intensity / 100) * coneLen * 0.3);

  return (
    <group>
      {/* Lamp housing */}
      <mesh position={[lx, ly + 0.04, lz]}>
        <boxGeometry args={[0.45, 0.08, 0.45]} />
        <meshStandardMaterial
          color={on ? '#eee' : '#555'}
          emissive={on ? color : '#222'}
          emissiveIntensity={on ? 0.9 : 0}
        />
      </mesh>
      {/* Glow disk facing down */}
      {on && (
        <mesh position={[lx, ly - 0.01, lz]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Full-length cone from lamp to target */}
      {on && (
        <mesh position={[midX, midY, midZ]} rotation={[ex, ey, ez]}>
          <coneGeometry args={[coneRadius, coneLen, 12, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.12 + intensity / 600}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Impact circle on target surface */}
      {on && dirT > 0.05 && (
        <mesh position={[tx, 0.76, tz]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[coneRadius * 0.6, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
      )}
      {/* SpotLight with proper useRef-controlled target */}
      {on && (
        <spotLight
          ref={spotRef}
          position={[lx, ly, lz]}
          color={color}
          intensity={intensity / 18}
          angle={0.55}
          penumbra={0.4}
          distance={H + 4}
          decay={1.5}
          castShadow={false}
        />
      )}
      {/* Label above lamp */}
      <Label position={[lx, H + 0.2, lz]} color={on ? color : '#888'} size={0.11}>
        {`${numLabel}: ${on ? `${intensity.toFixed(0)}%` : 'ВЫКЛ'}`}
      </Label>
    </group>
  );
}

function MultiLightScene({
  on1, on2, on3, on4,
  int1, int2, int3, int4,
  dir1, dir2, dir3, dir4,
}: {
  on1: boolean; on2: boolean; on3: boolean; on4: boolean;
  int1: number; int2: number; int3: number; int4: number;
  dir1: number; dir2: number; dir3: number; dir4: number;
}) {
  const W = 9, D = 7, H = 3.2;
  // dirN is 0–100 → dirT 0–1 (0 = straight down, 1 = fully aimed at worker)
  const corners: [number, number, string, string][] = [
    [-W / 2 + 0.6, -D / 2 + 0.6, '#ff6644', '1'],
    [W / 2 - 0.6, -D / 2 + 0.6, '#44aaff', '2'],
    [-W / 2 + 0.6, D / 2 - 0.6, '#44cc44', '3'],
    [W / 2 - 0.6, D / 2 - 0.6, '#ffaa00', '4'],
  ];
  const onStates = [on1, on2, on3, on4];
  const intensities = [int1, int2, int3, int4];
  const dirTs = [dir1 / 100, dir2 / 100, dir3 / 100, dir4 / 100];

  // Compute total illuminance at desk from all active lamps
  const totalLux = useMemo(() => {
    const DX = 0, DY = 0.74, DZ = 0.4;
    return corners.reduce((sum, [cx, cz], i) => {
      if (!onStates[i]) return sum;
      const lx = cx, ly = H - 0.12, lz = cz;
      const dx = DX - lx, dy = DY - ly, dz = DZ - lz;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const cosTheta = Math.abs(dy) / r; // angle at horizontal desk surface
      // How well aimed: target xz vs desk xz
      const tx = cx + (DX - cx) * dirTs[i];
      const tz = cz + (DZ - cz) * dirTs[i];
      const aimDist = Math.sqrt((tx - DX) ** 2 + (tz - DZ) ** 2);
      // 0.25 = ambient contribution even when lamp points straight down;
      // rises to 1.0 when lamp is aimed directly at the worker desk
      const aimFactor = 0.25 + 0.75 * Math.max(0, 1 - aimDist / 2);
      // 8 000 cd ≈ realistic max for an office LED panel (100 W equivalent)
      const candela = (intensities[i] / 100) * 8000;
      return sum + (candela * cosTheta * aimFactor) / (r * r);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on1, on2, on3, on4, int1, int2, int3, int4, dir1, dir2, dir3, dir4]);

  const normLux = 300;   // СП 52.13330 — min for computer workstations
  const maxLux  = 750;   // UGR comfort ceiling for VDT work (EN 12464-1)
  const normOk  = totalLux >= normLux;
  const overlit = totalLux > maxLux;
  // 3 zones: dark→norm boundary→comfortable→glare boundary→overlit
  const deskT = Math.min(1, totalLux / maxLux);
  const deskColor = overlit
    ? new THREE.Color().lerpColors(
        new THREE.Color('#fffde0'),
        new THREE.Color('#ffffff'),
        (totalLux - maxLux) / maxLux,
      )
    : new THREE.Color().lerpColors(
        new THREE.Color('#2a1a0a'),
        new THREE.Color('#fffde0'),
        deskT,
      );

  return (
    <>
      <Room width={W} depth={D} height={H} wallColor="#d0c8b8" />
      {/* Illuminated desk surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.73, 0.4]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color={deskColor} roughness={0.5} />
      </mesh>
      <Desk position={[0, 0, 0.4]} width={1.4} depth={0.7} />
      {/* Worker */}
      <mesh position={[0, 0.85, 0.9]} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 6, 10]} />
        <meshStandardMaterial color="#2266cc" />
      </mesh>
      <mesh position={[0, 1.5, 0.9]} castShadow>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color="#ffcc99" />
      </mesh>
      {/* 4 corner spotlights */}
      {corners.map(([cx, cz, color, label], i) => (
        <CornerLight
          key={`cl-${i}`}
          cx={cx} cz={cz} color={color} numLabel={label}
          on={onStates[i]}
          intensity={intensities[i]}
          dirT={dirTs[i]}
          H={H}
        />
      ))}
      {/* ── Illuminance norms panel on back wall ── */}
      <Label position={[0, 2.8, -D / 2 + 0.12]} color="#ffffff" size={0.17}>
        {`E рабочего места = ${totalLux.toFixed(0)} лк`}
      </Label>
      <Label
        position={[0, 2.5, -D / 2 + 0.12]}
        color={overlit ? '#ffaa00' : normOk ? '#44ee44' : '#ff4444'}
        size={0.14}
      >
        {overlit
          ? `⚠ Чрезмерная яркость > ${maxLux} лк!`
          : normOk
          ? `✓ Норма: ${normLux}–${maxLux} лк (СП 52.13330)`
          : `✗ Ниже нормы: нужно ≥ ${normLux} лк`}
      </Label>
      {overlit && (
        <Label position={[0, 2.2, -D / 2 + 0.12]} color="#ffcc44" size={0.10}>
          {'Головная боль · усталость глаз · слезотечение'}
        </Label>
      )}
      <Label position={[0, overlit ? 1.9 : 2.2, -D / 2 + 0.12]} color="#aaccff" size={0.10}>
        {'E = Σ I·cos θ / r²  (закон cos²)'}
      </Label>
      {/* Illuminance status above worker */}
      <Label
        position={[0.5, 1.9, 0.9]}
        color={overlit ? '#ffaa00' : normOk ? '#44ee44' : '#ff4444'}
        size={0.14}
      >
        {`${totalLux.toFixed(0)} лк`}
      </Label>
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
    waveRef.current.position.x = -((timeRef.current * 2.5) % 10);
  });

  const scaledLambda = Math.min(3, Math.max(0.05, Math.log10(lambda + 1) + 2));

  // EMF type classification
  let emfType = 'Радиоволны';
  let waveColor = '#44aaff';
  if (frequency >= 3e11) {
    emfType = 'Инфракрасное излучение';
    waveColor = '#ff4444';
  } else if (frequency >= 3e9) {
    emfType = 'Микроволны (СВЧ)';
    waveColor = '#ffaa00';
  } else if (frequency >= 3e7) {
    emfType = 'Ультракороткие волны (УКВ)';
    waveColor = '#66dd55';
  } else if (frequency >= 3e5) {
    emfType = 'Короткие волны (КВ)';
    waveColor = '#44aaff';
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#0a1628" />
      </mesh>
      {/* Electromagnetic spectrum bar at bottom */}
      {[
        { x: -7, w: 2.5, c: '#2244aa', l: 'Радио' },
        { x: -4.5, w: 2, c: '#44aa44', l: 'УКВ' },
        { x: -2.5, w: 2, c: '#aaaa22', l: 'СВЧ' },
        { x: -0.5, w: 2, c: '#cc4444', l: 'ИК' },
        { x: 1.5, w: 1, c: '#ffffff', l: 'Свет' },
        { x: 2.5, w: 1.5, c: '#8844cc', l: 'УФ' },
        { x: 4, w: 2, c: '#4444cc', l: 'Рентген' },
      ].map((band, i) => (
        <group key={i}>
          <mesh position={[band.x, 0.08, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[band.w, 0.5]} />
            <meshBasicMaterial color={band.c} transparent opacity={0.7} />
          </mesh>
          <Label position={[band.x, 0.15, 4.1]} color={band.c} size={0.09}>{band.l}</Label>
        </group>
      ))}
      {/* Wave visualization — vivid, animated */}
      <group ref={waveRef}>
        {Array.from({ length: 50 }).map((_, i) => {
          const x = i * scaledLambda * 0.5;
          const y = 2.0 + Math.sin((i / (scaledLambda * 2)) * Math.PI * 2) * 1.0;
          return (
            <mesh key={i} position={[x, y, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color={waveColor} />
            </mesh>
          );
        })}
      </group>
      {/* Lambda bracket — thicker */}
      <mesh position={[2, 0.6, -1]}>
        <boxGeometry args={[scaledLambda, 0.04, 0.04]} />
        <meshBasicMaterial color="#00cc66" />
      </mesh>
      <Label position={[2, 0.3, -1]} color="#00cc66" size={0.16}>{`λ = ${lambda.toExponential(2)} м`}</Label>
      <Label position={[2, 3.5, 0]} color={waveColor} size={0.18}>{`f = ${(frequency / 1e6).toFixed(2)} МГц`}</Label>
      <Label position={[2, 3.1, 0]} color="#ffffff" size={0.16}>{emfType}</Label>
      <Label position={[-4, 3.5, 0]} color="#aaa" size={0.11}>{'c = f · λ = 3×10⁸ м/с'}</Label>
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

  // Zone danger colors
  const zoneColor = zone === 'near' ? '#ff2222' : zone === 'intermediate' ? '#ffaa00' : '#22cc44';
  const zoneName = zone === 'near' ? 'БЛИЖНЯЯ ЗОНА (индукция)' : zone === 'intermediate' ? 'ПРОМЕЖУТОЧНАЯ ЗОНА' : 'ДАЛЬНЯЯ ЗОНА (волновая)';

  // Pulsing antenna
  const antennaRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (antennaRef.current) {
      const mat = antennaRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(timeRef.current * 4) * 0.4;
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#0a1628" />
      </mesh>
      {/* Source antenna — pulsing */}
      <mesh ref={antennaRef} position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 2.8, 12]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff2200" emissiveIntensity={0.6} />
      </mesh>
      <Label position={[0, 3.2, 0]} color="#ff4444" size={0.14}>{'Антенна (источник ЭМП)'}</Label>
      {/* Near zone sphere — red, semi-transparent */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.max(0.2, nearR), 16, 16]} />
        <meshStandardMaterial color="#ff4444" transparent opacity={0.18} />
      </mesh>
      <Label position={[nearR + 0.3, 2.8, 0]} color="#ff4444" size={0.14}>{`Ближняя: R < ${near.toFixed(2)} м`}</Label>
      {/* Far zone sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[Math.max(0.4, maxRadius), 16, 16]} />
        <meshStandardMaterial color="#4488ff" transparent opacity={0.1} wireframe />
      </mesh>
      <Label position={[maxRadius + 0.3, 2.8, 0]} color="#4488ff" size={0.14}>{`Дальняя: R > ${far.toFixed(2)} м`}</Label>
      {/* Observer — color changes by zone */}
      <group position={[Math.min(distance, 9), 0, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.22, 0.55, 8, 16]} />
          <meshStandardMaterial color="#2266cc" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#ffcc99" />
        </mesh>
        {/* Danger indicator */}
        <mesh position={[0.5, 1.2, 0]}>
          <boxGeometry args={[0.12, 1.5, 0.12]} />
          <meshStandardMaterial color={zoneColor} emissive={zoneColor} emissiveIntensity={0.3} />
        </mesh>
        <Label position={[0, 2.3, 0]} color={zoneColor} size={0.16}>{zoneName}</Label>
        <Label position={[0, -0.2, 0.8]} color="#aaa" size={0.12}>{`r = ${distance.toFixed(2)} м`}</Label>
      </group>
      <Label position={[0, 4, 0]} color="#888" size={0.11}>{`λ = ${lambda.toExponential(1)} м   f = ${(frequency / 1e6).toFixed(1)} МГц`}</Label>
    </>
  );
}

/* ─────────────── Brightness Scene ─────────────── */

function BrightnessScene({ intensity, area }: { intensity: number; area: number }) {
  const B = area > 0 ? intensity / area : 0;
  const isBlinding = B > 2000;
  const glareLevel = Math.min(1, B / 5000);

  return (
    <>
      <Room width={6} depth={5} height={3} wallColor="#c8c0b0" />
      <Desk position={[0, 0, 0.5]} />
      {/* Light source with dramatic variable brightness */}
      <mesh position={[0, 2.2, -1]}>
        <boxGeometry args={[Math.sqrt(area) * 1.2, Math.sqrt(area) * 0.7, 0.06]} />
        <meshStandardMaterial
          emissive={isBlinding ? '#ffffc0' : '#ffd39b'}
          emissiveIntensity={Math.min(5, B / 300)}
          color="#ffffff"
        />
      </mesh>
      <pointLight position={[0, 2.2, -0.8]} color="#fff5e0" intensity={Math.min(12, B / 150)} distance={8} decay={2} castShadow />
      {/* Glare effect — yellow sphere overlay when blinding */}
      {isBlinding && (
        <mesh position={[0, 1.5, 0.5]}>
          <sphereGeometry args={[glareLevel * 2, 16, 16]} />
          <meshBasicMaterial color="#ffffaa" transparent opacity={glareLevel * 0.3} />
        </mesh>
      )}
      {/* Status — bold indicator */}
      <Label position={[0, 0.6, 2.2]} color={isBlinding ? '#cc0000' : '#006600'} size={0.2}>
        {isBlinding ? '⚠ БЛЁСКОСТЬ!' : '✓ Комфортно'}
      </Label>
      <Label position={[0, 0.3, 2.2]} color="#000066" size={0.16}>{`B = I/S = ${B.toFixed(0)} кд/м²`}</Label>
      <Label position={[0, 0.05, 2.2]} color="#555" size={0.1}>{`I = ${intensity} кд, S = ${area.toFixed(1)} м²`}</Label>
    </>
  );
}

/* ─────────────── Main TheoryScene3D ─────────────── */

interface TheoryScene3DProps {
  type: TheorySimulatorType;
  params: Record<string, number>;
}

export default function TheoryScene3D({ type, params }: TheoryScene3DProps) {
  const title = sceneTitle[type] || 'Интерактивная 3D-визуализация';

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
      case 'light-specific-power':
        return <SpecificPowerScene area={Math.max(10, params.a ?? 50)} width={Math.max(3, params.b ?? 6)} lampPower={Math.max(20, (params.c ?? 3) * 20)} density={params.d ?? 120} />;
      case 'light-multi-source': {
        // intensities come in a-d (0-100), directions in e-h (0-100 = % aimed at worker)
        const i1 = params.a ?? 80, i2 = params.b ?? 80, i3 = params.c ?? 80, i4 = params.d ?? 80;
        const d1 = params.e ?? 80, d2 = params.f ?? 80, d3 = params.g ?? 80, d4 = params.h ?? 80;
        return (
          <MultiLightScene
            on1={i1 > 0} on2={i2 > 0} on3={i3 > 0} on4={i4 > 0}
            int1={Math.abs(i1)} int2={Math.abs(i2)} int3={Math.abs(i3)} int4={Math.abs(i4)}
            dir1={d1} dir2={d2} dir3={d3} dir4={d4}
          />
        );
      }
      case 'noise-distance':
        return <NoiseDistanceScene level={params.a ?? 100} distance={Math.max(0.5, params.b ?? 3)} />;
      case 'noise-barrier':
        return <NoiseBarrierScene mass={Math.max(10, params.a ?? 150)} levelBefore={params.b ?? 90} />;
      case 'noise-sum':
        return <NoiseSumScene l1={params.a ?? 90} l2={params.b ?? 85} l3={params.c ?? 80} />;
      case 'noise-reflection':
        return <NoiseReflectionScene level={params.a ?? 85} />;
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
      <Typography variant="subtitle2" sx={{ p: 1, pb: 0, fontWeight: 700 }}>
        {title}
      </Typography>
      <Box sx={{ height: { xs: 260, md: 340 }, borderRadius: 1, overflow: 'hidden' }}>
        <SafeCanvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 8, 3]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
          />
          {scene}
          <OrbitControls enablePan={false} />
          <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />
        </SafeCanvas>
      </Box>
    </Paper>
  );
}
