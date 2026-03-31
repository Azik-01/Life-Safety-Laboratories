import { useRef, useMemo, useEffect } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SafeCanvas from '../SafeCanvas';
import type { TheorySimulatorType } from '../../types/theme';
import { waveguideAttenuationPerM } from '../../formulas/shielding';
import { attenuationFactorF, xParameter } from '../../formulas/hfField';
import { pduForFrequencyVpm, RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ, normalizedPatternFactor } from '../../formulas/uhfField';
import { bodyCurrentMA, skinImpedance, totalBodyImpedance, groundPotential, stepVoltage, lesson11TouchEstimate, classifyCurrentDanger } from '../../formulas/electricSafety';
import { lesson12TnLabEstimate, lesson12SingleElectrodeResistanceOhm, lesson12ElectrodeCount } from '../../formulas/electricSafety';

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
  'emi-shield-thickness': 'Экранирование: толщина поглощающего слоя',
  'emi-waveguide': 'Затухание ЭМИ в волноводе',
  'emi-field-attenuation': 'Ослабление поля экраном (дБ)',
  'hf-field-strength': 'Напряжённость ВЧ-поля по Шулейкину',
  'hf-wave-propagation': 'Распространение радиоволн вдоль земли',
  'hf-soil-attenuation': 'Влияние проводимости почвы на затухание',
  'uhf-field-strength': 'Поле УВЧ-передатчика телецентра',
  'uhf-antenna-pattern': 'Диаграмма направленности антенны',
  'radiation-dose': 'ПДУ облучения — зависимость от частоты',
  'electric-current-body': 'Путь тока через тело человека',
  'electric-resistance': 'Эквивалентная схема сопротивления тела',
  'electric-frequency-effect': 'Влияние частоты на импеданс тела',
  'ground-current-spread': 'Растекание тока в грунте от заземлителя',
  'step-voltage': 'Шаговое напряжение между точками грунта',
  'equipotential-zones': 'Эквипотенциальные линии вокруг заземлителя',
  'l11-it-touch': 'ИТ (изолированная нейтраль): касание фазы (нормальный режим)',
  'l11-tn-normal-touch': 'TN (заземлённая нейтраль): касание фазы (нормальный режим)',
  'l11-tn-emergency-touch': 'TN (авария): КЗ L1→земля и касание фазы',
  'l12-tn-fault-modes': 'Занятие 12: КЗ на корпус, повторное заземление, обрыв PEN',
  'l12-earthing-electrodes': 'Занятие 12: Одиночный заземлитель и число электродов',
};

/* ─── Bold label helper ─── */
function Label({
  children,
  position,
  color = '#000',
  size = 0.2,
  depthOffset,
  renderOrder,
  outlineColor = '#0d0d0d',
}: {
  children: string;
  position: [number, number, number];
  color?: string;
  size?: number;
  /** Troika: сдвиг по глубине, чтобы текст не терялся за полупрозрачными мешами */
  depthOffset?: number;
  renderOrder?: number;
  outlineColor?: string;
}) {
  const outlineW = size * 0.18;
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={size}
        color={color}
        position={[0, 0, 0]}
        outlineWidth={outlineW}
        outlineColor={outlineColor}
        fontWeight={700}
        anchorX="center"
        anchorY="middle"
        {...(depthOffset !== undefined ? { depthOffset } : {})}
        {...(renderOrder !== undefined ? { renderOrder } : {})}
      >
        {children}
      </Text>
    </Billboard>
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
        <meshStandardMaterial color="#c4b8a8" roughness={0.8} />
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
      <Label position={[1.2, 2.2, 0]} color="#1976d2" size={0.12}>{`ω = ${solidAngle.toFixed(2)} ср`}</Label>
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
      <Label position={[-2, 2.2, 2]} color="#0d47a1" size={0.13}>
        {kp > 10 ? '⚠ Повышенная пульсация! Стробоскоп!' : '✓ Пульсация в норме'}
      </Label>
      <Label position={[0, 0.9, -1]} color="#1976d2" size={0.1}>{'← Вращающийся диск'}</Label>
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
      <Label position={[-5, -0.1, 1.2]} color="#1976d2" size={0.11}>{'Источник шума'}</Label>
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
        <Label position={[0, -0.1, 0.8]} color="#1976d2" size={0.1}>{'Рабочее место'}</Label>
      </group>
      <Label position={[-1, 3.5, 0]} color="#0d47a1" size={0.12}>{'Формула: LR = L₁ − 20·lg(R) − 8 дБ'}</Label>
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
      <Label position={[-4, -0.1, 1]} color="#1976d2" size={0.1}>{'Источник шума'}</Label>
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
      <Label position={[0, 3.8, 0]} color="#1565c0" size={0.15}>{`Преграда: G = ${mass} кг/м²`}</Label>
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
        <Label position={[0, -0.2, 1]} color="#1976d2" size={0.1}>{'Суммарный уровень на рабочем месте'}</Label>
      </group>
      <Label position={[0, 3.5, 0]} color="#0d47a1" size={0.12}>{'LΣ = 10·lg(10^(L₁/10) + 10^(L₂/10) + 10^(L₃/10))'}</Label>
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
      <Label position={[3.5, 4.3, 0]} color="#1565c0" size={0.14}>{'Стена (твёрдая поверхность)'}</Label>
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
      <Label position={[-1, 0.3, 3]} color="#0d47a1" size={0.12}>{`Отражённый: ~${reflected.toFixed(0)} дБ`}</Label>
      <Label position={[-1, 0, 3]} color="#1976d2" size={0.1}>{'Звукоизоляция = отражение + поглощение'}</Label>
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
      <Label position={[0, 0.15, -width / 2 + 0.3]} color="#1976d2" size={0.11}>{`P удельная = ${specificPower.toFixed(0)} Вт/м²`}</Label>
      <Label position={[0, -0.05, -width / 2 + 0.3]} color="#1976d2" size={0.1}>{`P общая = ${totalPower.toFixed(0)} Вт`}</Label>
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
          color={on ? '#eee' : '#1976d2'}
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

/* ─────────────── EMI Wave Comparison Scene (E vs H) ─────────────── */

function EmiWaveScene({ eField, hField }: { eField: number; hField: number }) {
  const waveRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const ppe = eField * hField;
  const samples = 80;
  const waveLength = 16;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (waveRef.current) {
      waveRef.current.position.x = -((timeRef.current * 2) % waveLength);
    }
  });

  const eAmplitude = Math.min(2.0, eField / 20);
  const hAmplitude = Math.min(2.0, hField / 0.1);

  const ePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * waveLength * 2;
      const y = Math.sin((i / samples) * Math.PI * 8) * eAmplitude;
      pts.push([x, y + 2.0, 0]);
    }
    return pts;
  }, [eAmplitude]);

  const hPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * waveLength * 2;
      const z = Math.sin((i / samples) * Math.PI * 8) * hAmplitude;
      pts.push([x, 2.0, z]);
    }
    return pts;
  }, [hAmplitude]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#0c1a30" />
      </mesh>
      {/* Propagation axis */}
      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[18, 0.02, 0.02]} />
        <meshBasicMaterial color="#555555" />
      </mesh>
      <Label position={[9.5, 2.0, 0]} color="#888" size={0.12}>{'Направление →'}</Label>
      {/* Animated wave group */}
      <group ref={waveRef}>
        {/* E-field wave — vertical (Y-axis), red/orange */}
        {ePoints.map((p, i) => (
          <mesh key={`e-${i}`} position={p}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#ff4422" />
          </mesh>
        ))}
        {/* E-field line segments */}
        {ePoints.slice(0, -1).map((p, i) => {
          const next = ePoints[i + 1];
          const mid: [number, number, number] = [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2, 0];
          const dx = next[0] - p[0];
          const dy = next[1] - p[1];
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          return (
            <mesh key={`el-${i}`} position={mid} rotation={[0, 0, angle]}>
              <boxGeometry args={[len, 0.025, 0.025]} />
              <meshBasicMaterial color="#ff4422" />
            </mesh>
          );
        })}
        {/* H-field wave — horizontal (Z-axis), cyan/blue */}
        {hPoints.map((p, i) => (
          <mesh key={`h-${i}`} position={p}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#22aaff" />
          </mesh>
        ))}
        {/* H-field line segments */}
        {hPoints.slice(0, -1).map((p, i) => {
          const next = hPoints[i + 1];
          const mid: [number, number, number] = [(p[0] + next[0]) / 2, 2.0, (p[2] + next[2]) / 2];
          const dx = next[0] - p[0];
          const dz = next[2] - p[2];
          const len = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dz, dx);
          return (
            <mesh key={`hl-${i}`} position={mid} rotation={[0, -angle, 0]}>
              <boxGeometry args={[len, 0.025, 0.025]} />
              <meshBasicMaterial color="#22aaff" />
            </mesh>
          );
        })}
      </group>
      {/* Labels */}
      <Label position={[-7, 3.8, 0]} color="#ff4422" size={0.18}>{'E — электрическое поле'}</Label>
      <Label position={[-7, 0.3, 0]} color="#22aaff" size={0.18}>{'H — магнитное поле'}</Label>
      <Label position={[4, 4.2, 0]} color="#ffffff" size={0.14}>{`E = ${eField.toFixed(1)} В/м   H = ${hField.toFixed(2)} А/м`}</Label>
      <Label position={[4, 3.8, 0]} color="#ffcc44" size={0.14}>{`ППЭ = E·H = ${ppe.toFixed(2)} Вт/м²`}</Label>
      <Label position={[4, 0.3, 0]} color="#aaa" size={0.1}>{'E ⊥ H — волны перпендикулярны'}</Label>
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
      <Label position={[0, 0.05, 2.2]} color="#1976d2" size={0.1}>{`I = ${intensity} кд, S = ${area.toFixed(1)} м²`}</Label>
    </>
  );
}

/* ─────────────── Shield Thickness Scene (Lab 6) ─────────────── */

/** Полукольца волны: бегущий импульс по яркости + лёгкое «дыхание» (не статичные дуги) */
function EmHalfRingWaves({
  xStart,
  count,
  xStep,
  r0,
  dr,
  tube,
  color,
  opacityScale,
  timeMul = 1,
}: {
  xStart: number;
  count: number;
  xStep: number;
  r0: number;
  dr: number;
  tube: number;
  color: string;
  opacityScale: number;
  timeMul?: number;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime * timeMul;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const travel = t * 2.5 - i * 0.52;
      const wave = 0.5 + 0.5 * Math.sin(travel);
      mat.opacity = opacityScale * (0.18 + 0.72 * wave);
      const breathe = 1 + 0.07 * Math.sin(t * 2.6 + i * 0.85);
      mesh.scale.set(breathe, breathe, breathe);
    });
  });
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[xStart + i * xStep, 1.5, 0]}
          rotation={[0, 0, Math.PI / 2]}
          renderOrder={2}
        >
          <torusGeometry args={[r0 + i * dr, tube, 8, 48, Math.PI]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function ShieldThicknessScene({ thickness, attenuation }: { thickness: number; attenuation: number }) {
  const t = Math.max(0.01, thickness);
  const opac = Math.min(0.95, attenuation / 60);
  const afterOpacity = Math.max(0.08, 0.55 - opac);
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={0.55} />
      {/* EMI source */}
      <mesh position={[-3, 1.5, 0]} renderOrder={1}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff2200" emissiveIntensity={0.8} />
      </mesh>
      <Label
        position={[-3, 2.2, 0]}
        color="#cc0000"
        size={0.16}
        depthOffset={0.02}
        renderOrder={24}
      >
        {'Источник ЭМИ'}
      </Label>
      {/* Волны до экрана — анимированные полукольца */}
      <EmHalfRingWaves
        xStart={-2.05}
        count={4}
        xStep={0.42}
        r0={0.3}
        dr={0.09}
        tube={0.018}
        color="#ff6622"
        opacityScale={0.92}
        timeMul={1}
      />
      {/* Экран: светлее, чуть менее «металл», чтобы не перебивал подписи */}
      <mesh position={[0, 1.5, 0]} renderOrder={0}>
        <boxGeometry args={[t * 10, 3, 2.5]} />
        <meshStandardMaterial
          color="#c8d2dc"
          metalness={0.5}
          roughness={0.42}
          transparent
          opacity={0.78}
          depthWrite
        />
      </mesh>
      <Label
        position={[0, 3.2, 0]}
        color="#0d47a1"
        size={0.15}
        depthOffset={0.025}
        renderOrder={24}
      >
        {`Экран: ${(t * 1000).toFixed(1)} мм`}
      </Label>
      {/* Ослабленные волны за экраном */}
      <EmHalfRingWaves
        xStart={1.15}
        count={2}
        xStep={0.42}
        r0={0.26}
        dr={0.06}
        tube={0.014}
        color="#ff8844"
        opacityScale={afterOpacity}
        timeMul={0.85}
      />
      <Label
        position={[2.5, 2.2, 0]}
        color="#006600"
        size={0.15}
        depthOffset={0.02}
        renderOrder={24}
      >
        {`Ослабление: ${attenuation.toFixed(1)} дБ`}
      </Label>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#c4b8a8" />
      </mesh>
    </>
  );
}

/* ─────────────── Waveguide Scene (Lab 6) ─────────────── */

function WaveguideScene({
  diameterM,
  lengthM,
  epsilon,
  attenuationPerM,
}: {
  diameterM: number;
  lengthM: number;
  epsilon: number;
  attenuationPerM: number;
}) {
  const d = Math.max(0.001, diameterM);
  const lenM = Math.max(0.01, lengthM);
  /* Визуальная длина трубки в юнитах сцены (не 1:1 к метру, чтобы кадр стабильно помещался) */
  const visLen = Math.min(6.5, Math.max(1.5, lenM * 2.8));
  const half = visLen / 2;
  const rVis = Math.max(0.14, Math.min(0.5, d * 42));
  const leftX = -half - 0.35;
  const rightX = half + 0.22;
  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[5, 8, 4]} intensity={0.55} />
      {/* Волновод вдоль X, центр в начале координат */}
      <mesh position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[rVis, rVis, visLen, 40, 1, true]} />
        <meshStandardMaterial color="#b0b8c0" metalness={0.55} roughness={0.38} side={THREE.DoubleSide} />
      </mesh>
      {/* Вход: конус в сторону +X */}
      <mesh position={[leftX, 1.5, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.42, 10]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff2200" emissiveIntensity={0.55} />
      </mesh>
      <Label
        position={[leftX, 1.88, 0]}
        color="#cc0000"
        size={0.13}
        depthOffset={0.02}
        renderOrder={20}
      >
        {'ЭМИ вход'}
      </Label>
      {/* Выход */}
      <mesh position={[rightX, 1.5, 0]}>
        <sphereGeometry args={[0.14, 14, 14]} />
        <meshStandardMaterial color="#2e7d32" emissive="#1b5e20" emissiveIntensity={0.45} />
      </mesh>
      <Label
        position={[rightX, 1.88, 0]}
        color="#006600"
        size={0.12}
        depthOffset={0.02}
        renderOrder={20}
      >
        {'Выход (ослаблен)'}
      </Label>
      {/* Параметры над серединой волновода */}
      <Label position={[0, 2.62, 0]} color="#0d47a1" size={0.14} depthOffset={0.02} renderOrder={20}>
        {`D = ${(d * 1000).toFixed(1)} мм   |   ε = ${epsilon.toFixed(1)}`}
      </Label>
      <Label position={[0, 2.28, 0]} color="#1565c0" size={0.12} depthOffset={0.02} renderOrder={20}>
        {`l ≈ ${(lenM * 1000).toFixed(1)} мм   |   α ≈ ${attenuationPerM.toFixed(0)} дБ/м`}
      </Label>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#c4b8a8" />
      </mesh>
    </>
  );
}

/* ─────────────── EMI Field Attenuation Scene (Lab 6) ─────────────── */

function EmiFieldAttenuationScene({ fieldBefore, fieldAfter }: { fieldBefore: number; fieldAfter: number }) {
  const ratio = fieldBefore > 0 ? fieldAfter / fieldBefore : 1;
  return (
    <>
      <Room width={8} depth={6} height={3} />
      {/* Source side */}
      <pointLight position={[-2, 2, 0]} color="#ff6644" intensity={Math.min(8, fieldBefore / 10)} distance={6} />
      <mesh position={[-2, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial emissive="#ff4422" emissiveIntensity={1} color="#ff6644" />
      </mesh>
      <Label position={[-2, 2.5, 0]} color="#cc0000" size={0.15}>{`E₀ = ${fieldBefore.toFixed(0)} В/м`}</Label>
      {/* Shield wall */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.15, 3, 4]} />
        <meshStandardMaterial color="#777" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Protected side */}
      <pointLight position={[2, 2, 0]} color="#4466ff" intensity={Math.min(3, (fieldAfter / 10))} distance={5} />
      <Label position={[2, 2.5, 0]} color="#0044aa" size={0.15}>{`E = ${fieldAfter.toFixed(1)} В/м`}</Label>
      <Label position={[0, 0.3, 2.5]} color="#006600" size={0.14}>{`Коэфф. ослабления: ${(1 / Math.max(0.001, ratio)).toFixed(1)}`}</Label>
    </>
  );
}

/* ─────────────── HF Field Strength Scene (Lab 7) ─────────────── */

function HfFieldStrengthScene({
  power,
  distance,
  wavelength,
  gain,
}: {
  power: number;
  distance: number;
  wavelength: number;
  gain: number;
}) {
  /* Визуальный масштаб только от d. Линейно d/константа давало огромные скачки на шаге 100 м.
   * Логарифмическая нормализация по диапазону ползунка (100…50000 м): равномернее «ощущается» движение. */
  const dSliderMin = 100;
  const dSliderMax = 50000;
  const dClamped = Math.min(dSliderMax, Math.max(dSliderMin, distance));
  const t =
    (Math.log(dClamped) - Math.log(dSliderMin)) /
    (Math.log(dSliderMax) - Math.log(dSliderMin));
  const vis = 0.55 + t * 9.2;
  const cubeX = vis * 2.35;
  const rings = 5;
  return (
    <>
      {/* Antenna tower */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 3, 8]} />
        <meshStandardMaterial color="#888" metalness={0.6} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <coneGeometry args={[0.25, 0.5, 6]} />
        <meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <Label position={[0, 3.88, 0]} color="#cc0000" size={0.15}>{`P = ${power.toFixed(1)} кВт`}</Label>
      <Label position={[0, 3.58, 0]} color="#1976d2" size={0.11}>
        {`λ = ${wavelength.toFixed(0)} м  ·  Ga = ${gain.toFixed(2)}`}
      </Label>
      {/* Wave rings expanding outward — радиус ∝ d */}
      {Array.from({ length: rings }, (_, i) => (
        <mesh key={i} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[vis * (i + 1), 0.02, 8, 64]} />
          <meshBasicMaterial color="#ff8844" transparent opacity={0.6 / (i + 1)} />
        </mesh>
      ))}
      {/* Measurement point at distance d */}
      <mesh position={[cubeX, 0.5, 0]}>
        <boxGeometry args={[0.3, 1, 0.3]} />
        <meshStandardMaterial color="#2244cc" />
      </mesh>
      <Label position={[cubeX, 1.3, 0]} color="#0022aa" size={0.14}>{`d = ${distance.toFixed(0)} м`}</Label>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#73945c" roughness={0.9} />
      </mesh>
    </>
  );
}

/* ─────────────── HF Wave Propagation Scene (Lab 7) ─────────────── */

function HfWavePropagationScene({ wavelength, distance }: { wavelength: number; distance: number }) {
  const waveLen = Math.max(10, wavelength);
  /* Число визуальных сегментов ∝ d/λ — без жёсткого min(8, …), иначе при большом d/λ шары
   * «упираются» в минимальный шаг и перестают сближаться. Верх — только по производительности. */
  const waveCount = Math.min(36, Math.max(2, Math.round(distance / waveLen)));
  const nSpheres = Math.min(72, waveCount * 2);
  return (
    <>
      {/* Ground surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color="#73945c" roughness={0.9} />
      </mesh>
      {/* Surface wave visualization */}
      {Array.from({ length: nSpheres }, (_, i) => {
        const x = -5 + (i / Math.max(1, nSpheres - 1)) * 10;
        const y = 0.5 + Math.sin(i * Math.PI / 2) * 0.3;
        const fade = i / Math.max(1, nSpheres - 1);
        const opacity = Math.max(0.12, 0.82 - fade * 0.55);
        return (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ff6622" transparent opacity={opacity} />
          </mesh>
        );
      })}
      {/* Antenna */}
      <mesh position={[-5, 1, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 2, 8]} />
        <meshStandardMaterial color="#888" metalness={0.6} />
      </mesh>
      <Label position={[-5, 2.3, 0]} color="#cc0000" size={0.14}>{'Передатчик'}</Label>
      <Label position={[3, 2, 0]} color="#0d47a1" size={0.14}>{`λ = ${waveLen.toFixed(0)} м`}</Label>
      <Label position={[0, 2.5, 0]} color="#0044aa" size={0.14}>{'Поверхностная волна'}</Label>
    </>
  );
}

/* ─────────────── HF Soil Attenuation Scene (Lab 7) ─────────────── */

function HfSoilAttenuationScene({
  sigmaSm,
  wavelengthM,
  distanceM,
}: {
  /** Проводимость почвы σ, См/м (как в формулах: слайдер ×10⁻³) */
  sigmaSm: number;
  wavelengthM: number;
  distanceM: number;
}) {
  const sigma = Math.max(0.0005, sigmaSm);
  const x = xParameter(distanceM, wavelengthM, 7, sigma);
  const F = attenuationFactorF(x);
  const tint = Math.min(1, sigma / 0.035);
  const colorR = Math.round(88 + (1 - tint) * 105);
  const soilColor = `rgb(${colorR}, ${Math.round(colorR * 0.68)}, ${Math.round(colorR * 0.32)})`;
  const qual =
    sigma < 0.004
      ? 'Низкая σ — сухая / слабопроводящая почва'
      : sigma < 0.015
        ? 'Умеренная проводимость'
        : 'Относительно высокая σ';
  return (
    <>
      {/* Soil block — оттенок зависит от σ */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[10, 1, 6]} />
        <meshStandardMaterial color={soilColor} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#849f6a" roughness={0.9} />
      </mesh>
      {/* Конусы вдоль пути волны: яркость ∝ F и затухание по дистанции */}
      {[0, 1, 2, 3, 4].map((i) => {
        const t = i / 4;
        const pathFade = 1 - t * 0.45;
        const opacity = Math.max(0.28, Math.min(0.95, 0.35 + 0.58 * F * pathFade));
        const y = 0.46 + 0.14 * pathFade * F + 0.06 * Math.sin(t * Math.PI);
        return (
          <mesh key={i} position={[-3.6 + i * 1.8, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.11, 0.28, 8]} />
            <meshBasicMaterial color="#ff6622" transparent opacity={opacity} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
      <Label position={[0, 1.72, 0]} color="#90caf9" size={0.13}>
        {`σ = ${(sigma * 1000).toFixed(1)}·10⁻³ См/м (${sigma.toFixed(4)} См/м)`}
      </Label>
      <Label position={[0, 1.42, 0]} color="#b3e5fc" size={0.11}>
        {`λ = ${wavelengthM.toFixed(0)} м   ·   d = ${distanceM.toFixed(0)} м   ·   F ≈ ${F.toFixed(3)}`}
      </Label>
      <Label position={[0, 1.12, 0]} color="#eceff1" size={0.11}>
        {qual}
      </Label>
    </>
  );
}

/* ─────────────── UHF Field Strength Scene (Lab 8) ─────────────── */

function UhfFieldStrengthScene({
  power,
  gain,
  height,
  radius,
}: {
  power: number;
  gain: number;
  height: number;
  radius: number;
}) {
  /* Высота мачты и горизонталь r визуально развязаны: H → только hVis, r → только rVis (как в формулах). */
  const hVis = Math.max(1.35, Math.min(5.2, 0.75 + (height / 520) * 4.45));
  const rVis = Math.max(1.65, Math.min(9.2, 1.5 + (radius / 1950) * 7.7));

  const phaseY = hVis + 0.15;
  const rxH = 0.45;
  const beam = useMemo(() => {
    const start = new THREE.Vector3(0, phaseY, 0);
    const end = new THREE.Vector3(rVis, rxH, 0);
    const len = Math.max(0.05, start.distanceTo(end));
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { mid, quat, len };
  }, [phaseY, rVis, rxH]);

  const deltaDeg = (Math.atan2(height, radius) * 180) / Math.PI;

  return (
    <>
      {/* Пол */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#73945c" roughness={0.9} />
      </mesh>

      {/* Техздание у подножия */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.15, 0.84, 0.95]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.88} />
      </mesh>
      <mesh position={[0.58, 0.5, 0.48]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <meshStandardMaterial color="#5d4037" metalness={0.2} />
      </mesh>
      <mesh position={[-0.55, 0.5, -0.42]} rotation={[0, -0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <meshStandardMaterial color="#5d4037" metalness={0.2} />
      </mesh>

      {/* Несущая мачта (усечённая призма + пояса) */}
      <mesh position={[0, 0.85 + hVis * 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.11, hVis * 0.82, 5]} />
        <meshStandardMaterial color="#78909c" metalness={0.55} roughness={0.42} />
      </mesh>
      {[0.15, 0.42, 0.68].map((t) => (
        <mesh key={t} position={[0, 0.9 + hVis * t, 0]} castShadow>
          <boxGeometry args={[0.62, 0.035, 0.035]} />
          <meshStandardMaterial color="#607d8b" metalness={0.45} />
        </mesh>
      ))}

      {/* Площадка и УВЧ-панели (характерный «телевизионный» контур) */}
      <group position={[0, hVis + 0.05, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.06, 0.52]} />
          <meshStandardMaterial color="#90a4ae" metalness={0.5} roughness={0.4} />
        </mesh>
        {[-0.14, 0, 0.14].map((dz) => (
          <mesh key={dz} position={[0.22, 0.26, dz]} rotation={[0, 0, -0.12]} castShadow>
            <boxGeometry args={[0.05, 0.42, 0.22]} />
            <meshStandardMaterial color="#eeeeee" metalness={0.35} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[-0.18, 0.22, 0]} rotation={[0, Math.PI / 2, 0.25]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.06, 20, 1, true, 0.2, 1.6]} />
          <meshStandardMaterial color="#cfd8dc" metalness={0.6} roughness={0.28} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.18, 0.31, 0.26]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#e53935" emissive="#c62828" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-0.2, 0.31, -0.24]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#e53935" emissive="#c62828" emissiveIntensity={0.8} />
        </mesh>
      </group>

      <Label position={[0.05, hVis + 0.90, 0]} color="#ffcdd2" size={0.12}>{`P = ${power.toFixed(0)} Вт`}</Label>
      <Label position={[0.05, hVis + 0.70, 0]} color="#b3e5fc" size={0.1}>{`G = ${gain.toFixed(1)} · H = ${height.toFixed(0)} м`}</Label>

      {/* Луч: прямая от фазового центра к точке на расстоянии r по земле */}
      <mesh position={beam.mid} quaternion={beam.quat}>
        <cylinderGeometry args={[0.038, 0.038, beam.len, 8]} />
        <meshStandardMaterial color="#ff9100" emissive="#ff6d00" emissiveIntensity={0.35} transparent opacity={0.92} />
      </mesh>
      <Label position={[rVis * 0.38, Math.max(phaseY, rxH) * 0.55 + 0.5, 0]} color="#ffab40" size={0.085}>
        R, F(Δ)
      </Label>

      {/* Точка измерения: только по rVis */}
      <mesh position={[rVis, rxH, 0]} castShadow>
        <boxGeometry args={[0.22, 0.78, 0.22]} />
        <meshStandardMaterial color="#1e88e5" metalness={0.25} roughness={0.5} />
      </mesh>
      <Label position={[rVis, 1.15, 0]} color="#0d47a1" size={0.12}>{`r = ${radius.toFixed(0)} м`}</Label>
      <Label position={[rVis, 0.95, 0.45]} color="#81d4fa" size={0.075}>{`Δ ≈ ${deltaDeg.toFixed(1)}°`}</Label>

      {/* Слабая зона излучения у основания панелей (не привязана к r) */}
      <mesh position={[0.35, hVis * 0.55, 0]} rotation={[0, 0, -Math.PI / 2.8]}>
        <coneGeometry args={[0.35, 1.2, 12, 1, true]} />
        <meshBasicMaterial color="#ffb74d" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ─────────────── UHF Antenna Pattern Scene (Lab 8) ─────────────── */

function UhfAntennaPatternScene({ gain, deltaDeg }: { gain: number; deltaDeg: number }) {
  const g = Math.max(1, gain);
  const deltaRad = (Math.max(0, Math.min(90, deltaDeg)) * Math.PI) / 180;
  const F = normalizedPatternFactor(deltaRad);

  const yAnt = 1.45;
  const halfAngle = Math.max(0.06, Math.min(0.48, 0.55 / Math.sqrt(g)));
  const coneLen = 2.35;
  const coneR = coneLen * Math.tan(halfAngle);

  const rayLen = 2.15;
  /* Тuple rotation — R3F надёжнее обновляет, чем общий объект Quaternion на каждом кадре. */
  const rayLayout = useMemo(() => {
    const dir = new THREE.Vector3(0, Math.sin(deltaRad), Math.cos(deltaRad)).normalize();
    const mid = dir.clone().multiplyScalar(rayLen * 0.5);
    const yUp = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    if (dir.dot(yUp) > 1 - 1e-6) q.identity();
    else if (dir.dot(yUp) < -1 + 1e-6) q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    else q.setFromUnitVectors(yUp, dir);
    const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
    return {
      mid: [mid.x, mid.y, mid.z] as [number, number, number],
      rot: [e.x, e.y, e.z] as [number, number, number],
      tip: [dir.x * rayLen, dir.y * rayLen, dir.z * rayLen] as [number, number, number],
    };
  }, [deltaRad, rayLen]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#c5b9a8" roughness={0.9} />
      </mesh>

      {/* Мачта */}
      <mesh position={[0, yAnt / 2 - 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, yAnt - 0.15, 8]} />
        <meshStandardMaterial color="#6d6d6d" metalness={0.4} roughness={0.55} />
      </mesh>

      <group position={[0, yAnt, 0]}>
        {/* Консоль и облучатель */}
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.1, 0.38]} />
          <meshStandardMaterial color="#455a64" metalness={0.55} roughness={0.4} />
        </mesh>
        {/* Рупор (облучатель) */}
        <mesh position={[0, 0, 0.12]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.08, 0.15, 12]} />
          <meshStandardMaterial color="#37474f" metalness={0.65} roughness={0.35} />
        </mesh>
        {/* Отражатель */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2 + Math.PI / 4, 0, 0]} castShadow>
          <circleGeometry args={[0.52, 40]} />
          <meshStandardMaterial color="#b5b5b5" metalness={0.8} roughness={0.34} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2 + Math.PI / 4, 0, 0]}>
          <ringGeometry args={[0.08, 0.54, 32]} />
          <meshStandardMaterial color="#949494" metalness={0.68} roughness={0.36} side={THREE.DoubleSide} />
        </mesh>

        {/* Главный лепесток вдоль +Z (оси облучателя) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, coneLen / 2]}>
          <coneGeometry args={[coneR, coneLen, 40, 1, true]} />
          <meshStandardMaterial
            color="#ff6d00"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
            emissive="#ff9100"
            emissiveIntensity={0.12}
          />
        </mesh>

        {/* Направление наблюдения (угол Δ) */}
        <mesh position={rayLayout.mid} rotation={rayLayout.rot} renderOrder={8}>
          <cylinderGeometry args={[0.055, 0.055, rayLen, 10]} />
          <meshBasicMaterial color="#1565c0" depthTest depthWrite toneMapped={false} />
        </mesh>
        <mesh position={rayLayout.tip}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshStandardMaterial color="#42a5f5" metalness={0.35} roughness={0.45} emissive="#1976d2" emissiveIntensity={0.2} />
        </mesh>
      </group>

      <Label position={[-0.2, yAnt + 1.05, 0]} color="#e3f2fd" size={0.11}>
        {`G = ${g.toFixed(1)} · Δ = ${deltaDeg.toFixed(0)}°`}
      </Label>
      <Label position={[-0.2, yAnt + 0.82, 0]} color="#ffcc80" size={0.095}>
        {`F(Δ) = ${F.toFixed(3)} (cos Δ)`}
      </Label>
      <Label position={[-0.2, yAnt + 0.62, 0]} color="#cfd8dc" size={0.068}>
        {'Ось +Z — максимум ДН; синий луч — направление под углом Δ'}
      </Label>
    </>
  );
}

/* ─────────────── Radiation Dose Scene (Lab 8) ─────────────── */

function RadiationDoseScene({ frequencyMHz }: { frequencyMHz: number }) {
  const f = Math.max(0.03, Math.min(RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ, frequencyMHz));
  const pdu = pduForFrequencyVpm(f);
  const lambdaM = 299.792458 / f;

  const logMin = Math.log10(0.03);
  const logMax = Math.log10(RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ);
  const xAt = (fm: number) => {
    const t = (Math.log10(Math.max(0.03, fm)) - logMin) / (logMax - logMin);
    return -3.5 + t * 7.0;
  };

  const markerX = xAt(f);
  const bands: { f0: number; f1: number; color: string }[] = [
    { f0: 0.03, f1: 3, color: '#c62828' },
    { f0: 3, f1: 30, color: '#ef6c00' },
    { f0: 30, f1: 50, color: '#fbc02d' },
    { f0: 50, f1: RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ, color: '#43a047' },
  ];

  const barH = Math.max(0.2, (pdu / 50) * 2.35);
  const barColor = pdu >= 40 ? '#c62828' : pdu >= 15 ? '#ef6c00' : pdu >= 8 ? '#fbc02d' : '#2e7d32';
  const axisZ = 0.65;

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#d7ccc8" roughness={0.92} />
      </mesh>

      {bands.map((b, i) => {
        const x0 = xAt(b.f0);
        const x1 = xAt(b.f1);
        const cx = (x0 + x1) / 2;
        const w = Math.max(0.08, x1 - x0);
        return (
          <mesh key={i} position={[cx, 0.015, axisZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w, 1.5]} />
            <meshStandardMaterial color={b.color} transparent opacity={0.42} depthWrite={false} />
          </mesh>
        );
      })}

      <mesh position={[0, 0.028, axisZ]}>
        <boxGeometry args={[7.0, 0.025, 0.06]} />
        <meshBasicMaterial color="#4e342e" />
      </mesh>
      {/* Маркер f и столбец ПДУ — одна вертикаль по оси X шкалы */}
      <mesh position={[markerX, 0.22, axisZ + 0.02]}>
        <boxGeometry args={[0.06, 0.38, 0.06]} />
        <meshStandardMaterial color="#1565c0" metalness={0.35} roughness={0.35} emissive="#0d47a1" emissiveIntensity={0.25} />
      </mesh>

      <mesh position={[markerX, barH / 2 + 0.06, axisZ - 0.4]} castShadow>
        <boxGeometry args={[0.36, barH, 0.36]} />
        <meshStandardMaterial color={barColor} metalness={0.25} roughness={0.45} />
      </mesh>

      <Label position={[0, 2.5, -0.2]} color="#f5f5f5" size={0.095}>
        {'ПДУ E(f) — ступени по табл.; маркер и λ меняются непрерывно с f'}
      </Label>
      <Label position={[markerX, barH + 0.52, axisZ - 0.52]} color="#0d47a1" size={0.125}>{`ПДУ E = ${pdu} В/м`}</Label>
      <Label position={[markerX, 0.52, axisZ + 0.06]} color="#b3e5fc" size={0.1}>{`f = ${f < 10 ? f.toFixed(3) : f.toFixed(1)} МГц`}</Label>
      <Label position={[markerX, barH + 0.26, axisZ - 0.52]} color="#546e7a" size={0.078}>
        {lambdaM < 1 ? `λ ≈ ${(lambdaM * 1000).toFixed(1)} мм` : `λ ≈ ${lambdaM.toFixed(2)} м`}
      </Label>

      {(
        [
          [0.1, '0.1 МГц'],
          [1, '1 МГц'],
          [10, '10 МГц'],
          [100, '100 МГц'],
          [300, '300 МГц'],
          [RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ, `${RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ} МГц`],
        ] as const
      ).map(([fm, lbl]) => (
        <Label key={lbl} position={[xAt(fm), 0.1, axisZ + 0.55]} color="#e0f7fa" size={0.064}>
          {lbl}
        </Label>
      ))}
    </>
  );
}

/* ─────────────── Стилизованная фигура человека (теория, ОТ) ─────────────── */

/** Как в сцене «Путь тока»: обувь, брюки, рубашка, кожа; шаг задаётся половиной расстояния между стопами. */
function TheoryStylizedPerson({
  footHalfSep = 0.11,
  torsoPath,
}: {
  footHalfSep?: number;
  torsoPath?: { color: string; opacity: number };
}) {
  const skin = '#deb897';
  const shirt = '#5c6d8c';
  const pants = '#455a64';
  const h = footHalfSep;
  const refHalf = 0.11;
  const armX = 0.22 * (h / refHalf);
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-h, 0.04, 0]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.22]} />
        <meshStandardMaterial color="#37474f" roughness={0.65} />
      </mesh>
      <mesh position={[h, 0.04, 0]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.22]} />
        <meshStandardMaterial color="#37474f" roughness={0.65} />
      </mesh>
      <mesh position={[-h, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.58, 6, 10]} />
        <meshStandardMaterial color={pants} roughness={0.82} />
      </mesh>
      <mesh position={[h, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.58, 6, 10]} />
        <meshStandardMaterial color={pants} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.38, 8, 16]} />
        <meshStandardMaterial color={shirt} roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.33, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.14, 10]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.17, 20, 20]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[-armX, 1.14, 0]} rotation={[0, 0, Math.PI / 4.2]} castShadow>
        <capsuleGeometry args={[0.05, 0.52, 6, 10]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
      <mesh position={[armX, 1.14, 0]} rotation={[0, 0, -Math.PI / 4.2]} castShadow>
        <capsuleGeometry args={[0.05, 0.52, 6, 10]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
      </mesh>
      {torsoPath ? (
        <mesh position={[0, 1.05, 0.04]}>
          <capsuleGeometry args={[0.07, 0.32, 6, 12]} />
          <meshBasicMaterial color={torsoPath.color} transparent opacity={torsoPath.opacity} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

/* ─────────────── Electric Current Body Scene (Lab 9) ─────────────── */

function ElectricCurrentBodyScene({ current }: { current: number }) {
  const mA = Math.max(0, current);
  const pathOpacity = Math.min(0.62, 0.1 + mA / 65);
  const pathColor = mA < 1 ? '#43a047' : mA < 10 ? '#fdd835' : mA < 100 ? '#ff9800' : '#ef5350';
  const meterFill = mA < 1 ? '#c8e6c9' : mA < 10 ? '#fff9c4' : mA < 100 ? '#ffe0b2' : '#ffcdd2';
  const statusFill = mA < 1 ? '#e8f5e9' : mA < 10 ? '#fffde7' : mA < 100 ? '#fff3e0' : '#ffebee';
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#a89888" roughness={0.88} />
      </mesh>
      {/* Силуэт на полу: ноги → торс → шея → голова; кожа и одежда согласованы */}
      <TheoryStylizedPerson footHalfSep={0.11} torsoPath={{ color: pathColor, opacity: pathOpacity }} />
      <Label position={[0, 1.88, 0]} color={meterFill} size={0.16} outlineColor="#263238" depthOffset={-2}>{`I = ${mA.toFixed(1)} мА`}</Label>
      <Label position={[0, 0.2, 0.58]} color={statusFill} size={0.115} outlineColor="#37474f" depthOffset={-2}>
        {mA < 1 ? 'Безопасно' : mA < 10 ? 'Ощутимый ток' : mA < 100 ? 'Неотпускающий!' : 'Фибрилляция!'}
      </Label>
    </>
  );
}

/* ─────────────── Lesson 11: three distinct THEORY scenes (schematics) ─────────────── */

const L11_RAIL_Y = [1.52, 1.18, 0.84] as const;
const L11_PHASE_COLORS = ['#c62828', '#1565c0', '#2e7d32'] as const;

function L11WireH({
  x0,
  x1,
  y,
  z = 0,
  thickness = 0.055,
  color,
  emissiveIntensity = 0,
}: {
  x0: number;
  x1: number;
  y: number;
  z?: number;
  thickness?: number;
  color: string;
  emissiveIntensity?: number;
}) {
  const lo = Math.min(x0, x1);
  const hi = Math.max(x0, x1);
  const mid = (lo + hi) / 2;
  const len = hi - lo;
  if (len < 1e-4) return null;
  return (
    <mesh position={[mid, y, z]} castShadow>
      <boxGeometry args={[len, thickness, thickness]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.45} metalness={0.08} />
    </mesh>
  );
}

function L11WireV({
  x,
  y0,
  y1,
  z = 0,
  thickness = 0.055,
  color,
  emissiveIntensity = 0,
}: {
  x: number;
  y0: number;
  y1: number;
  z?: number;
  thickness?: number;
  color: string;
  emissiveIntensity?: number;
}) {
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  const mid = (lo + hi) / 2;
  const len = hi - lo;
  if (len < 1e-4) return null;
  return (
    <mesh position={[x, mid, z]} castShadow>
      <boxGeometry args={[thickness, len, thickness]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.45} metalness={0.08} />
    </mesh>
  );
}

function L11Junction({ x, y, z = 0, active }: { x: number; y: number; z?: number; active?: boolean }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <sphereGeometry args={[0.052, 10, 10]} />
      <meshStandardMaterial
        color={active ? '#ffee58' : '#90a4ae'}
        emissive={active ? '#ffc107' : '#546e7a'}
        emissiveIntensity={active ? 0.45 : 0.06}
        roughness={0.4}
        metalness={0.12}
      />
    </mesh>
  );
}

function L11SchematicBase({
  title,
  UprV,
  ImA,
  extra,
  footnote,
}: {
  title: string;
  UprV: number;
  ImA: number;
  extra?: string;
  footnote?: string;
}) {
  const danger = classifyCurrentDanger(ImA, true);
  const dangerColor =
    danger === 'safe'
      ? '#4caf50'
      : danger === 'perceptible'
        ? '#ffb300'
        : danger === 'non-releasing'
          ? '#f44336'
          : '#d50000';
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#eef2f5" roughness={0.98} />
      </mesh>
      <Label position={[0, 2.8, 0]} color="#263238" size={0.14} outlineColor="#ffffff" depthOffset={-2}>
        {title}
      </Label>
      <Label position={[-3.9, 2.35, 0]} color="#0d47a1" size={0.11} outlineColor="#ffffff" depthOffset={-2}>
        {`Uпр ≈ ${UprV.toFixed(1)} В`}
      </Label>
      <Label position={[-3.9, 2.05, 0]} color={dangerColor} size={0.12} outlineColor="#ffffff" depthOffset={-2}>
        {`I ≈ ${ImA.toFixed(2)} мА`}
      </Label>
      {extra ? (
        <Label position={[-3.9, footnote ? 1.78 : 1.75, 0]} color="#455a64" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
          {extra}
        </Label>
      ) : null}
      {footnote ? (
        <Label position={[-3.9, 1.48, 0]} color="#607d8b" size={0.082} outlineColor="#ffffff" depthOffset={-2}>
          {footnote}
        </Label>
      ) : null}
    </>
  );
}

function L11ItTouchSchematic({
  UphiV,
  RhOhm,
  RisoOhm,
  touchedPhaseIndex,
}: {
  UphiV: number;
  RhOhm: number;
  RisoOhm: number;
  touchedPhaseIndex: number;
}) {
  const phase = Math.min(2, Math.max(0, Math.floor(touchedPhaseIndex)));
  const { UprV, ImA } = lesson11TouchEstimate({
    network: 'IT',
    regime: 'normal',
    touchedPhaseIndex: phase,
    UphiV,
    RhOhm,
    RgOhm: 10,
    RzmOhm: 15,
    RisoOhm,
  });
  const pulseRef = useRef(0);
  useFrame((_, d) => {
    pulseRef.current += d;
  });
  const glow = 0.25 + 0.35 * Math.abs(Math.sin(pulseRef.current * 4));
  const yAct = L11_RAIL_Y[phase];
  const srcX = -4.05;
  const busX = -2.92;
  const stubEnd = -2.38;
  const rhCx = -0.95;
  const rhHalf = 0.52;
  const risoCx = 1.05;
  const risoHalf = 0.62;
  const dropX = 2.35;
  const gndY = 0.48;
  const wireNeutral = '#546e7a';
  return (
    <>
      <L11SchematicBase
        title={`ИТ: касание ${['L1', 'L2', 'L3'][phase]} (цепь Rh + Rиз/3)`}
        UprV={UprV}
        ImA={ImA}
        extra={`Uφ=${UphiV.toFixed(0)} В; Rh=${Math.round(RhOhm)} Ω; Rиз≈${Math.round(RisoOhm)} Ω/фаза`}
        footnote="При симметрии Uпр и I одинаковы для L1–L3; подсвечена ветвь касания."
      />

      <mesh position={[srcX, 1.15, 0]} castShadow>
        <boxGeometry args={[0.92, 0.95, 0.36]} />
        <meshStandardMaterial color="#90a4ae" roughness={0.55} metalness={0.12} />
      </mesh>
      <Label position={[srcX, 1.68, 0]} color="#263238" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
        {'3φ ИТ'}
      </Label>

      {L11_RAIL_Y.map((y, i) => {
        const c = L11_PHASE_COLORS[i];
        const active = i === phase;
        const dim = active ? 0.22 + glow : 0.04;
        return (
          <group key={i}>
            <L11Junction x={busX} y={y} active={active} />
            <L11WireH x0={srcX + 0.48} x1={busX} y={y} color={c} emissiveIntensity={dim} />
            {!active ? (
              <>
                <L11WireH x0={busX} x1={stubEnd} y={y} color={c} emissiveIntensity={0.02} />
                <mesh position={[stubEnd - 0.04, y, 0]} castShadow>
                  <boxGeometry args={[0.045, 0.055, 0.055]} />
                  <meshStandardMaterial color="#bdbdbd" roughness={0.85} />
                </mesh>
              </>
            ) : null}
            <Label position={[srcX - 0.1, y + 0.14, 0]} color={c} size={0.09} outlineColor="#ffffff" depthOffset={-2}>
              {['L1', 'L2', 'L3'][i]}
            </Label>
          </group>
        );
      })}

      <L11WireH x0={busX} x1={rhCx - rhHalf} y={yAct} color={L11_PHASE_COLORS[phase]} emissiveIntensity={0.2 + glow} />
      <mesh position={[rhCx, yAct, 0]} castShadow>
        <boxGeometry args={[1.04, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffcc80" emissive="#ffb300" emissiveIntensity={0.14} />
      </mesh>
      <Label position={[rhCx, yAct + 0.35, 0]} color="#6d4c41" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
        {'Rh'}
      </Label>

      <L11WireH x0={rhCx + rhHalf} x1={risoCx - risoHalf} y={yAct} color={L11_PHASE_COLORS[phase]} emissiveIntensity={0.18 + glow} />
      <mesh position={[risoCx, yAct, 0]} castShadow>
        <boxGeometry args={[1.24, 0.48, 0.3]} />
        <meshStandardMaterial color="#b39ddb" emissive="#7e57c2" emissiveIntensity={0.12} />
      </mesh>
      <Label position={[risoCx, yAct + 0.35, 0]} color="#311b92" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
        {'Rиз/3'}
      </Label>

      <L11WireH x0={risoCx + risoHalf} x1={dropX} y={yAct} color={L11_PHASE_COLORS[phase]} emissiveIntensity={0.16 + glow} />
      <L11Junction x={dropX} y={yAct} active />
      <L11WireV x={dropX} y0={yAct} y1={gndY + 0.06} color={wireNeutral} emissiveIntensity={0.06} />

      <mesh position={[dropX, gndY, 0]} castShadow>
        <boxGeometry args={[1.0, 0.11, 0.55]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>
      <Label position={[dropX, gndY + 0.18, 0]} color="#3e2723" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Земля'}
      </Label>
    </>
  );
}

function L11TnNormalTouchSchematic({
  UphiV,
  RhOhm,
  RgOhm,
  touchedPhaseIndex,
}: {
  UphiV: number;
  RhOhm: number;
  RgOhm: number;
  touchedPhaseIndex: number;
}) {
  const phase = Math.min(2, Math.max(0, Math.floor(touchedPhaseIndex)));
  const { UprV, ImA } = lesson11TouchEstimate({
    network: 'TN',
    regime: 'normal',
    touchedPhaseIndex: phase,
    UphiV,
    RhOhm,
    RgOhm,
    RzmOhm: 15,
    RisoOhm: 6000,
  });
  const yAct = L11_RAIL_Y[phase];
  const srcX = -4.05;
  const busX = -2.92;
  const stubEnd = -2.38;
  const rhCx = -0.88;
  const rhHalf = 0.5;
  const rgCx = 0.78;
  const rgHalf = 0.54;
  const dropX = 2.28;
  const gndY = 0.48;
  const wireNeutral = '#546e7a';
  return (
    <>
      <L11SchematicBase
        title={`TN (норма): касание ${['L1', 'L2', 'L3'][phase]} (Rh + Rз на землю)`}
        UprV={UprV}
        ImA={ImA}
        extra={`Uφ=${UphiV.toFixed(0)} В; Rh=${Math.round(RhOhm)} Ω; Rз=${RgOhm.toFixed(1)} Ω`}
        footnote="Упрощённо: последовательно Rh и Rз до земли; при симметрии Uпр и I не зависят от L1–L3; подсветка — касаемая фаза."
      />

      <mesh position={[srcX, 1.15, 0]} castShadow>
        <boxGeometry args={[0.92, 0.95, 0.36]} />
        <meshStandardMaterial color="#90a4ae" roughness={0.55} metalness={0.12} />
      </mesh>
      <Label position={[srcX, 1.68, 0]} color="#263238" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
        {'3φ TN'}
      </Label>

      {L11_RAIL_Y.map((y, i) => {
        const c = L11_PHASE_COLORS[i];
        const active = i === phase;
        const dim = active ? 0.18 : 0.04;
        return (
          <group key={i}>
            <L11Junction x={busX} y={y} active={active} />
            <L11WireH x0={srcX + 0.48} x1={busX} y={y} color={c} emissiveIntensity={dim} />
            {!active ? (
              <>
                <L11WireH x0={busX} x1={stubEnd} y={y} color={c} emissiveIntensity={0.02} />
                <mesh position={[stubEnd - 0.04, y, 0]} castShadow>
                  <boxGeometry args={[0.045, 0.055, 0.055]} />
                  <meshStandardMaterial color="#bdbdbd" roughness={0.85} />
                </mesh>
              </>
            ) : null}
            <Label position={[srcX - 0.1, y + 0.14, 0]} color={c} size={0.09} outlineColor="#ffffff" depthOffset={-2}>
              {['L1', 'L2', 'L3'][i]}
            </Label>
          </group>
        );
      })}

      <L11WireH x0={busX} x1={rhCx - rhHalf} y={yAct} color={L11_PHASE_COLORS[phase]} emissiveIntensity={0.2} />
      <mesh position={[rhCx, yAct, 0]} castShadow>
        <boxGeometry args={[1.0, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffcc80" emissive="#ffb300" emissiveIntensity={0.14} />
      </mesh>
      <Label position={[rhCx, yAct + 0.35, 0]} color="#6d4c41" size={0.1} outlineColor="#ffffff" depthOffset={-2}>
        {'Rh'}
      </Label>

      <L11WireH x0={rhCx + rhHalf} x1={rgCx - rgHalf} y={yAct} color={L11_PHASE_COLORS[phase]} emissiveIntensity={0.16} />
      <mesh position={[rgCx, yAct, 0]} castShadow>
        <boxGeometry args={[1.08, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffe082" emissive="#fdd835" emissiveIntensity={0.12} />
      </mesh>
      <Label position={[rgCx, yAct + 0.35, 0]} color="#6d4c41" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Rз'}
      </Label>

      <L11WireH x0={rgCx + rgHalf} x1={dropX} y={yAct} color={wireNeutral} emissiveIntensity={0.08} />
      <L11Junction x={dropX} y={yAct} active />
      <L11WireV x={dropX} y0={yAct} y1={gndY + 0.06} color={wireNeutral} emissiveIntensity={0.06} />

      <mesh position={[dropX, gndY, 0]} castShadow>
        <boxGeometry args={[1.0, 0.11, 0.55]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>
      <Label position={[dropX, gndY + 0.18, 0]} color="#3e2723" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Земля'}
      </Label>
    </>
  );
}

function L11TnEmergencyTouchSchematic({
  UphiV,
  RhOhm,
  RzmOhm,
  touchedPhaseIndex,
}: {
  UphiV: number;
  RhOhm: number;
  RzmOhm: number;
  touchedPhaseIndex: number;
}) {
  const phase = Math.min(2, Math.max(0, Math.floor(touchedPhaseIndex)));
  const { UprV, ImA } = lesson11TouchEstimate({
    network: 'TN',
    regime: 'emergency',
    touchedPhaseIndex: phase,
    UphiV,
    RhOhm,
    RgOhm: 10,
    RzmOhm,
    RisoOhm: 6000,
  });
  const pulseRef = useRef(0);
  useFrame((_, d) => {
    pulseRef.current += d;
  });
  const glow = 0.2 + 0.5 * Math.abs(Math.sin(pulseRef.current * 6));
  const yFault = 1.62;
  const yTouch = 0.88;
  const wire = '#546e7a';
  const gndTop = 0.54;
  const gndY = 0.48;
  const faultDropX = 1.12;
  const touchDropX = 0.68;
  const kzCx = -3.18;
  const rzmCx = -0.9;
  const rzmHalf = 0.58;
  const rhCx = -0.88;
  const rhHalf = 0.54;
  const phaseColor = L11_PHASE_COLORS[phase];
  const touchGlow = 0.14 + (phase !== 0 ? glow * 0.55 : glow * 0.15);
  return (
    <>
      <L11SchematicBase
        title={`TN (авария): КЗ L1→земля + касание ${['L1', 'L2', 'L3'][phase]}`}
        UprV={UprV}
        ImA={ImA}
        extra={`Uφ=${UphiV.toFixed(0)} В; Rh=${Math.round(RhOhm)} Ω; Rзм=${RzmOhm.toFixed(1)} Ω`}
        footnote="Ветвь аварии — L1 и Rзм; ниже — выбранная фаза касания и Rh; обе сходятся на землю."
      />

      {/* Верх: пробой L1 — Rзм — шина перед спуском */}
      <mesh position={[kzCx, yFault, 0]} castShadow>
        <boxGeometry args={[1.08, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffab91" emissive="#ff3d00" emissiveIntensity={0.2 + glow} />
      </mesh>
      <Label position={[kzCx, yFault + 0.34, 0]} color="#bf360c" size={0.098} outlineColor="#ffffff" depthOffset={-2}>
        {'КЗ L1'}
      </Label>

      <L11WireH x0={kzCx + 0.56} x1={rzmCx - rzmHalf} y={yFault} color={L11_PHASE_COLORS[0]} emissiveIntensity={0.14 + glow} />

      <mesh position={[rzmCx, yFault, 0]} castShadow>
        <boxGeometry args={[1.15, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffe082" emissive="#fdd835" emissiveIntensity={0.12} />
      </mesh>
      <Label position={[rzmCx, yFault + 0.34, 0]} color="#6d4c41" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Rзм'}
      </Label>

      <L11WireH x0={rzmCx + rzmHalf} x1={faultDropX} y={yFault} color={wire} emissiveIntensity={0.08} />
      <L11Junction x={faultDropX} y={yFault} active />
      <L11WireV x={faultDropX} y0={yFault} y1={gndTop} color={wire} emissiveIntensity={0.07} />

      {/* Низ: касание L1/L2/L3 — Rh — спуск */}
      <mesh position={[kzCx, yTouch, 0]} castShadow>
        <boxGeometry args={[1.08, 0.48, 0.3]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={touchGlow} />
      </mesh>
      <Label position={[kzCx, yTouch + 0.34, 0]} color={phaseColor} size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {['L1', 'L2', 'L3'][phase]}
      </Label>

      <L11WireH x0={kzCx + 0.56} x1={rhCx - rhHalf} y={yTouch} color={phaseColor} emissiveIntensity={0.16 + (phase !== 0 ? glow * 0.4 : 0.1)} />

      <mesh position={[rhCx, yTouch, 0]} castShadow>
        <boxGeometry args={[1.06, 0.48, 0.3]} />
        <meshStandardMaterial color="#ffcc80" emissive="#ffb300" emissiveIntensity={0.13} />
      </mesh>
      <Label position={[rhCx, yTouch + 0.34, 0]} color="#6d4c41" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Rh'}
      </Label>

      <L11WireH x0={rhCx + rhHalf} x1={touchDropX} y={yTouch} color={phaseColor} emissiveIntensity={0.12} />
      <L11Junction x={touchDropX} y={yTouch} active />
      <L11WireV x={touchDropX} y0={yTouch} y1={gndTop} color={wire} emissiveIntensity={0.07} />

      {/* Общая горизонталь на уровне «земли» и шина */}
      <L11WireH x0={touchDropX} x1={faultDropX} y={gndTop} color={wire} emissiveIntensity={0.06} />
      <L11WireH x0={faultDropX} x1={2.42} y={gndTop} color={wire} emissiveIntensity={0.06} />

      <mesh position={[1.55, gndY, 0]} castShadow>
        <boxGeometry args={[1.45, 0.11, 0.55]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>
      <Label position={[1.55, gndY + 0.18, 0]} color="#3e2723" size={0.095} outlineColor="#ffffff" depthOffset={-2}>
        {'Земля'}
      </Label>
    </>
  );
}

/* ─────────────── Electric Resistance Scene (Lab 9) ─────────────── */

function ElectricResistanceScene({
  skinResistanceOhm,
  capacitanceNF,
  internalResistanceOhm,
  frequencyHz,
}: {
  skinResistanceOhm: number;
  capacitanceNF: number;
  internalResistanceOhm: number;
  frequencyHz: number;
}) {
  const Rn = Math.max(1, skinResistanceOhm);
  const CnF = Math.max(0.1, capacitanceNF);
  const Rv = Math.max(1, internalResistanceOhm);
  const f = Math.max(1, frequencyHz);

  // Формулы как в MiniSimulator (Lab 9):
  // Zн = Rн / sqrt(1 + (2π f Cн Rн)^2)
  // Z = 2·Zн + Rв
  const Zn = skinImpedance(Rn, f, CnF * 1e-9);
  const Zt = totalBodyImpedance(Zn, Rv);
  const term = 2 * Math.PI * f * (CnF * 1e-9) * Rn; // 2π f C Rn
  const capGlow = Math.min(1, term / 10);

  const plateW = 0.65;
  const resistorW = Math.min(2, Math.max(0.35, Rn / 9000));
  const internalW = Math.min(2, Math.max(0.35, Rv / 2500));

  const explainColor = '#0d47a1';

  return (
    <>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#c4b8a8" roughness={1} />
      </mesh>

      {/* ── (1) RC для кожи: Rн || Cн -> эквивалент Zн ── */}
      <group>
        {/* Rн */}
        <mesh position={[-2.2, 2.0, 0]} castShadow>
          <boxGeometry args={[resistorW, 0.45, 0.35]} />
          <meshStandardMaterial color="#cc8844" emissive="#7a4d14" emissiveIntensity={0.25} />
        </mesh>
        <Label position={[-2.2, 2.55, 0]} color="#884400" size={0.14}>
          {'Rн (кожа)'}
        </Label>

        {/* Cн (две пластины — визуально “конденсатор кожи”) */}
        <mesh position={[-2.2, 1.2, -0.08]} castShadow>
          <boxGeometry args={[plateW, 0.02, 0.32]} />
          <meshStandardMaterial color="#4488cc" emissive="#29b6f6" emissiveIntensity={0.2 + capGlow * 1.1} />
        </mesh>
        <mesh position={[-2.2, 1.0, -0.08]} castShadow>
          <boxGeometry args={[plateW, 0.02, 0.32]} />
          <meshStandardMaterial color="#4488cc" emissive="#29b6f6" emissiveIntensity={0.2 + capGlow * 1.1} />
        </mesh>
        <Label position={[-2.2, 0.72, 0]} color="#2266aa" size={0.12}>
          {`Cн = ${CnF.toFixed(0)} нФ`}
        </Label>

        {/* Эквивалент Zн (результат RC по модулю импеданса) */}
        <mesh position={[-1.0, 1.6, 0]} castShadow>
          <boxGeometry args={[Math.min(1.8, Math.max(0.35, Zn / 12000)), 0.35, 0.35]} />
          <meshStandardMaterial color="#1de9b6" emissive="#00e676" emissiveIntensity={0.35 + (1 - capGlow) * 0.25} />
        </mesh>
        <Label position={[-1.0, 2.0, 0]} color={explainColor} size={0.14}>
          {`Zн ≈ ${Zn.toFixed(0)} Ом`}
        </Label>
      </group>

      {/* ── (2) “Две кожи” в серии + внутреннее сопротивление ── */}
      <group>
        {/* Zн #1 */}
        <mesh position={[-0.7, 1.6, 0]} castShadow>
          <boxGeometry args={[Math.min(1.8, Math.max(0.35, Zn / 12000)), 0.35, 0.35]} />
          <meshStandardMaterial color="#1de9b6" emissive="#00e676" emissiveIntensity={0.25} />
        </mesh>

        {/* Zн #2 */}
        <mesh position={[0.2, 1.6, 0]} castShadow>
          <boxGeometry args={[Math.min(1.8, Math.max(0.35, Zn / 12000)), 0.35, 0.35]} />
          <meshStandardMaterial color="#1de9b6" emissive="#00e676" emissiveIntensity={0.25} />
        </mesh>

        {/* Rв */}
        <mesh position={[1.1, 1.6, 0]} castShadow>
          <boxGeometry args={[internalW, 0.38, 0.35]} />
          <meshStandardMaterial color="#44aa44" emissive="#00c853" emissiveIntensity={0.18} />
        </mesh>
        <Label position={[1.1, 2.0, 0]} color="#226622" size={0.13}>
          {`Rв ≈ ${Rv.toFixed(0)} Ом`}
        </Label>

        {/* Connecting wires (just for visual “series path”) */}
        {(
          [
            [-1.35, 1.75, 0],
            [-0.35, 1.75, 0],
            [0.65, 1.75, 0],
            [1.55, 1.75, 0],
          ] as Array<[number, number, number]>
        ).map((pos, i) => (
          <mesh key={i} position={pos} castShadow>
            <boxGeometry args={[0.25, 0.03, 0.03]} />
            <meshBasicMaterial color="#333" />
          </mesh>
        ))}
      </group>

      {/* ── (3) Итог и зависимость ── */}
      <Label position={[0, 2.95, 0]} color={explainColor} size={0.16}>
        {`Z = 2·Zн + Rв ≈ ${Zt.toFixed(0)} Ом`}
      </Label>
      <Label position={[0, 2.55, 0]} color="#546e7a" size={0.11} outlineColor="#263238" depthOffset={-2}>
        {`Zн = Rн / √(1 + (2π f Cн Rн)²)`}
      </Label>
      <Label position={[0, 2.25, 0]} color="#455a64" size={0.11} outlineColor="#263238" depthOffset={-2}>
        {`f = ${f.toFixed(0)} Гц (частота)`}
      </Label>
    </>
  );
}

/* ─────────────── Electric Frequency Effect Scene (Lab 9) ─────────────── */

function ElectricFrequencyEffectScene({ frequency }: { frequency: number }) {
  const f = Math.max(1, frequency);

  // Как в MiniSimulator:
  // - кожа: Rn = 5000 Ом, Cн = 20 нФ
  // - внутреннее сопротивление: Rv = 500 Ом
  const Rn = 5000;
  const Rv = 500;
  const CnF = 20e-9;

  const freqs = [10, 30, 50, 100, 300, 500, 1000, 5000, 10000];
  const currentIdx = freqs.reduce((best, fr, i) => (Math.abs(fr - f) < Math.abs(freqs[best] - f) ? i : best), 0);

  const values = freqs.map((fr) => {
    const Zn = skinImpedance(Rn, fr, CnF);
    const Zt = totalBodyImpedance(Zn, Rv);
    return { fr, Zn, Zt };
  });

  const maxY = Math.max(...values.map((v) => Math.max(v.Zn, v.Zt)), 1);
  const maxHeight = 2.25;
  const baseX = -3.8;
  const step = 0.85;

  return (
    <>
      {/* Legend */}
      <Label position={[-4.05, 2.85, 0]} color="#90caf9" size={0.12} outlineColor="#263238" depthOffset={-2}>
        {'Zн (кожа)'}
      </Label>
      <Label position={[-3.55, 2.85, 0]} color="#ffcc80" size={0.12} outlineColor="#263238" depthOffset={-2}>
        {'Z (тело)'}
      </Label>

      {/* Bars */}
      {values.map((v, i) => {
        const xCenter = baseX + i * step;
        const hZn = 0.15 + (v.Zn / maxY) * maxHeight;
        const hZ = 0.15 + (v.Zt / maxY) * maxHeight;
        const isCurrent = i === currentIdx;

        return (
          <group key={v.fr}>
            {/* Zн */}
            <mesh position={[xCenter - 0.18, hZn / 2, -0.06]}>
              <boxGeometry args={[0.22, hZn, 0.22]} />
              <meshStandardMaterial
                color="#1de9b6"
                emissive={isCurrent ? '#00e676' : '#00796b'}
                emissiveIntensity={isCurrent ? 0.9 : 0.22}
              />
            </mesh>

            {/* Z */}
            <mesh position={[xCenter + 0.18, hZ / 2, 0.06]}>
              <boxGeometry args={[0.22, hZ, 0.22]} />
              <meshStandardMaterial
                color="#ffa726"
                emissive={isCurrent ? '#ff8f00' : '#e65100'}
                emissiveIntensity={isCurrent ? 0.95 : 0.2}
              />
            </mesh>

            <Label
              position={[xCenter, Math.max(hZn, hZ) + 0.22, 0]}
              color="#e0e0e0"
              size={0.085}
              outlineColor="#263238"
              depthOffset={-3}
            >
              {`${v.fr}`}
            </Label>
          </group>
        );
      })}

      {/* Current readout */}
      {(() => {
        const sel = values[currentIdx];
        const ZnTxt = sel.Zn.toFixed(0);
        const ZTxt = sel.Zt.toFixed(0);
        return (
          <>
            <Label position={[-0.05, 3.15, 0]} color="#e3f2fd" size={0.16} outlineColor="#0d47a1" depthOffset={-2}>
              {`f = ${sel.fr} Гц`}
            </Label>
            <Label position={[-0.05, 2.80, 0]} color="#e0f7fa" size={0.12} outlineColor="#263238" depthOffset={-2}>
              {`Zн ≈ ${ZnTxt} Ом; Z ≈ ${ZTxt} Ом`}
            </Label>
          </>
        );
      })()}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#c4b8a8" roughness={1} />
      </mesh>
    </>
  );
}

/* ─────────────── Ground Current Spread Scene (Lab 10) ─────────────── */

function GroundCurrentSpreadScene({ current, resistivity }: { current: number; resistivity: number }) {
  const tRef = useRef(0);
  useFrame((_, delta) => {
    tRef.current += delta;
  });
  const ringCount = 6;
  // Радиусы x_i для наглядности (м). Формулы: UA = I·ρ / (2π·x)
  const x0 = 0.45;
  const xStep = 0.55;
  const xs = Array.from({ length: ringCount }, (_, i) => x0 + (i + 1) * xStep);

  const potentials = xs.map((x) => (current * resistivity) / (2 * Math.PI * x)); // UA_i
  const maxU = Math.max(...potentials, 1e-9);

  // Нормализация для “свечения” (под ползунки из MiniSimulator: I 0.1..50, ρ 1..500)
  const curNorm = Math.max(0, Math.min(1, current / 50));
  const rhoNorm = Math.max(0, Math.min(1, resistivity / 500));
  const fieldNorm = Math.sqrt(curNorm * rhoNorm);
  const electrodeGlow = 0.2 + Math.sqrt(curNorm * rhoNorm) * 1.6;
  const ringScale = 0.75 + fieldNorm * 0.95; // чтобы ползунки явно «раздвигали» зоны
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tRef.current * (0.9 + 1.4 * fieldNorm)));
  return (
    <>
      {/* Ground electrode */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#cc0000"
          emissive="#ff0000"
          emissiveIntensity={electrodeGlow * (0.85 + 0.35 * pulse)}
          roughness={0.35}
        />
      </mesh>
      <Label position={[0, 1.05, 0]} color="#ffebee" size={0.14} outlineColor="#1b1b1b">
        {`Iз = ${current.toFixed(1)} А · ρ = ${resistivity.toFixed(0)} Ом·м`}
      </Label>
      <Label position={[0, 0.82, 0]} color="#e3f2fd" size={0.10} outlineColor="#263238">
        {`U(x) = I·ρ/(2πx)  →  U(1 м) ≈ ${((current * resistivity) / (2 * Math.PI * 1)).toFixed(0)} В`}
      </Label>
      {/* Equipotential rings on ground */}
      {xs.map((x, i) => {
        const u = potentials[i];
        const t = Math.pow(Math.max(0, Math.min(1, u / maxU)), 0.55); // 0..1 (контрастнее)
        const opac = 0.08 + 0.62 * t;
        const tube = 0.012 + 0.055 * t;
        const emissiveIntensity = (0.2 + 1.6 * t) * (0.7 + 0.55 * pulse);
        const r = x * 0.62 * ringScale; // заметная реакция на ползунки
        return (
          <group key={x}>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, tube, 8, 64]} />
              <meshStandardMaterial
                color="#ff8844"
                emissive="#ff3d00"
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={opac}
                roughness={0.85}
              />
            </mesh>
            <Label position={[r + 0.18, 0.16, 0]} color="#263238" size={0.06} outlineColor="#f5f5f5">
              {`x≈${x.toFixed(1)}м  U≈${u.toFixed(0)}В`}
            </Label>
          </group>
        );
      })}
      {/* Явный маркер «зоны влияния» — чем больше I·ρ, тем больше радиус */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(0.15, 1.0 * ringScale), Math.max(0.18, 1.06 * ringScale), 64]} />
        <meshBasicMaterial color="#29b6f6" transparent opacity={0.22} />
      </mesh>
      <Label position={[2.9, 0.18, 0]} color="#b3e5fc" size={0.08} outlineColor="#0d47a1">
        {'Радиус колец увеличивается при росте Iз и ρ'}
      </Label>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8a9a68" roughness={1} />
      </mesh>
    </>
  );
}

/* ─────────────── Step Voltage Scene (Lab 10) ─────────────── */

function StepVoltageScene({
  current,
  resistivity,
  distanceM,
  stepLengthM,
}: {
  current: number; // Iz, А
  resistivity: number; // rho, Ом·м
  distanceM: number; // x, м
  stepLengthM: number; // a, м
}) {
  const x = Math.max(0.5, distanceM);
  const a = Math.max(0.1, stepLengthM);
  const Iz = Math.max(0.1, current);
  const rho = Math.max(1, resistivity);

  // Uш по формуле из методики: Uш = Iз·ρ·a/(2π·x·(x+a))
  const Ush = stepVoltage(Iz, rho, x, a);
  const danger = Ush > 36;
  const dangerT = Math.max(0, Math.min(1, Ush / 36)); // 0..1

  // Визуальная “шкала” для позиции человека
  const personX = Math.min(4, x * 0.18);
  const footSep = Math.max(0.06, Math.min(0.28, a * 0.18));

  // Колечки (условные “эквипотенциалы”): чем больше Ush, тем ярче/контрастнее
  const baseR = 0.5;
  const radii = [1, 2, 3, 4, 5].map((i) => baseR * i * (0.85 + dangerT * 0.25));
  const electrodeGlow = 0.15 + 1.25 * dangerT;

  return (
    <>
      {/* Ground electrode */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#cc0000" emissive="#ff3d00" emissiveIntensity={electrodeGlow} roughness={0.35} />
      </mesh>

      {/* Equipotential lines (визуальная зависимость от Ush) */}
      {radii.map((r, i) => {
        const opac = 0.08 + (0.35 + 0.25 * dangerT) / (i + 1);
        const emissiveIntensity = 0.15 + 1.4 * dangerT * (1 / (i + 1));
        return (
          <mesh key={r} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.02 + 0.01 * dangerT, 8, 64]} />
            <meshStandardMaterial
              color="#ffaa44"
              emissive="#ff8f00"
              emissiveIntensity={emissiveIntensity}
              transparent
              opacity={opac}
              roughness={0.85}
            />
          </mesh>
        );
      })}

      {/* Person at distance — та же стилизация, что в «Путь тока через тело человека» */}
      <group position={[personX, 0, 0]}>
        <TheoryStylizedPerson footHalfSep={footSep / 2} />
      </group>

      <Label position={[personX, 2, 0]} color={danger ? '#cc0000' : '#006600'} size={0.14}>
        {`Uш = ${Ush.toFixed(1)} В`}
      </Label>
      <Label position={[0, 0.7, 0]} color="#cc0000" size={0.10}>{'Заземлитель'}</Label>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8a9a68" roughness={1} />
      </mesh>
    </>
  );
}

/* ─────────────── Equipotential Zones Scene (Lab 10) ─────────────── */

function EquipotentialZonesScene({ current, resistivity }: { current: number; resistivity: number }) {
  const tRef = useRef(0);
  useFrame((_, delta) => {
    tRef.current += delta;
  });
  const zones = 8;
  const ringThickness = 0.35;

  // Визуальная привязка радиусов колец к реальной координате x (м)
  const rs = Array.from({ length: zones }, (_, i) => (i + 1) * 0.4);
  const phis = rs.map((x) => groundPotential(current, resistivity, x));
  const maxPhi = Math.max(...phis, 1e-9);

  const curNorm = Math.max(0, Math.min(1, current / 50));
  const rhoNorm = Math.max(0, Math.min(1, resistivity / 500));
  const fieldNorm = Math.sqrt(curNorm * rhoNorm);
  const electrodeGlow = 0.2 + fieldNorm * 1.7;
  const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tRef.current * (0.9 + 1.3 * fieldNorm)));
  const spread = 0.75 + fieldNorm * 0.95;
  const phiAt1m = groundPotential(current, resistivity, 1);
  const safePhiThresholdV = 10; // визуальный порог «почти ноль»
  const safeRadiusM = (() => {
    const idx = phis.findIndex((p) => p <= safePhiThresholdV);
    const x = idx === -1 ? rs[rs.length - 1] : rs[idx];
    return x;
  })();

  return (
    <>
      {/* Electrode */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
        <meshStandardMaterial color="#555" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#cc0000" emissive="#ff3d00" emissiveIntensity={electrodeGlow * (0.85 + 0.35 * pulse)} roughness={0.35} />
      </mesh>
      {/* Colored zones — red→yellow→green */}
      {rs.map((r, i) => {
        const phi = phis[i];
        // тёмно-красный возле электродов (φ большой), к зелёному — дальше (φ меньше)
        const t = Math.pow(Math.max(0, Math.min(1, phi / maxPhi)), 0.35); // 0..1 (контрастнее)
        const opac = 0.08 + 0.62 * t;
        const emissiveIntensity = (0.12 + 1.55 * t) * (0.7 + 0.55 * pulse);

        // interpolate: red-ish (t=1) -> green-ish (t=0)
        const red = Math.round(255 * t + 70 * (1 - t));
        const green = Math.round(75 * t + 220 * (1 - t));
        const blue = Math.round(40);
        const col = `rgb(${red},${green},${blue})`;

        return (
          <mesh key={r} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(0.03, r * spread - ringThickness), r * spread, 64]} />
            <meshStandardMaterial
              color={col}
              emissive={col}
              emissiveIntensity={emissiveIntensity}
              transparent
              opacity={opac}
              roughness={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      <Label position={[0, 0.92, 0]} color="#ffebee" size={0.14} outlineColor="#1b1b1b">
        {`Iз = ${current.toFixed(1)} А · ρ = ${resistivity.toFixed(0)} Ом·м`}
      </Label>
      <Label position={[0, 0.68, 0]} color="#e3f2fd" size={0.10} outlineColor="#263238">
        {`φ(1 м) ≈ ${phiAt1m.toFixed(0)} В  |  «почти ноль» ≤ ${safePhiThresholdV} В при x ≳ ${safeRadiusM.toFixed(1)} м`}
      </Label>
      {/* Явный контур «зона почти нулевого потенциала» */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[safeRadiusM * spread - 0.06, safeRadiusM * spread, 64]} />
        <meshBasicMaterial color="#00e676" transparent opacity={0.18} />
      </mesh>
      <Label position={[3.15, 0.25, 0]} color="#b9f6ca" size={0.09} outlineColor="#1b5e20">
        {'контур: «почти ноль»'}
      </Label>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8a9a68" roughness={1} />
      </mesh>
    </>
  );
}

/* ─────────────── Lesson 12: TN modes (theory) ─────────────── */

function L12TnModesScene({
  UphiV,
  ZnOhm,
  ZHOhm,
  modeIndex,
}: {
  UphiV: number;
  ZnOhm: number;
  ZHOhm: number;
  modeIndex: number;
}) {
  const scenarios = [
    { id: 'sc_enclosure', label: 'КЗ на корпус (без повторного заземления)' },
    { id: 'sc_enclosure_repeat', label: 'КЗ на корпус (с повторным заземлением)' },
    { id: 'break_after_fault', label: 'Обрыв PEN: корпус после обрыва' },
    { id: 'break_before_ok', label: 'Обрыв PEN: корпус до обрыва' },
    { id: 'break_after_repeat', label: 'Обрыв PEN + Rn: корпус после обрыва' },
    { id: 'break_before_repeat', label: 'Обрыв PEN + Rn: корпус до обрыва' },
    { id: 'phase_to_soil', label: 'Фаза на землю (12.13)' },
    { id: 'normal', label: 'Норма (контроль)' },
  ] as const;
  const idx = Math.min(scenarios.length - 1, Math.max(0, Math.round(modeIndex)));
  const scenario = scenarios[idx].id;
  const result = lesson12TnLabEstimate({
    scenario: scenario as any,
    UphiV,
    ZnOhm,
    ZHOhm,
    R0Ohm: 4,
    RnOhm: 10,
    RzmOhm: 100,
    RhOhm: 1000,
  });
  const danger = classifyCurrentDanger(result.IbodyMA, true);
  const dangerColor =
    danger === 'safe'
      ? '#4caf50'
      : danger === 'perceptible'
        ? '#ff9800'
        : danger === 'non-releasing'
          ? '#f44336'
          : '#d50000';

  const yPEN = 2.25;
  const xN = -2.4;
  const xEquip = 2.0;

  const showBreak = scenario.includes('break');
  const showRepeat = scenario.includes('repeat') || scenario === 'sc_enclosure_repeat';
  const showFault = scenario !== 'normal' && scenario !== 'phase_to_soil';
  const showPhaseSoil = scenario === 'phase_to_soil';

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#d7ccc8" roughness={0.92} />
      </mesh>

      {/* N point */}
      <mesh position={[xN, yPEN, 0]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#9e9e9e" emissive="#424242" emissiveIntensity={0.15} />
      </mesh>
      <Label position={[xN, yPEN + 0.35, 0]} color="#eeeeee" size={0.1}>
        N
      </Label>

      {/* PEN line (with optional break) */}
      {!showBreak ? (
        <mesh position={[(xN + xEquip) / 2, yPEN, 0]}>
          <boxGeometry args={[xEquip - xN, 0.05, 0.05]} />
          <meshStandardMaterial color="#fdd835" metalness={0.35} />
        </mesh>
      ) : (
        <>
          <mesh position={[(xN + -0.2) / 2, yPEN, 0]}>
            <boxGeometry args={[(-0.2 - xN), 0.05, 0.05]} />
            <meshStandardMaterial color="#fdd835" metalness={0.35} />
          </mesh>
          <mesh position={[(0.25 + xEquip) / 2, yPEN, 0]}>
            <boxGeometry args={[xEquip - 0.25, 0.05, 0.05]} />
            <meshStandardMaterial color="#fdd835" metalness={0.35} />
          </mesh>
          <Label position={[0.02, yPEN + 0.28, 0]} color="#ff7043" size={0.08}>
            обрыв PEN
          </Label>
        </>
      )}

      {/* Enclosure */}
      <mesh position={[xEquip, 0.55, 0]} castShadow>
        <boxGeometry args={[1.05, 1.05, 0.75]} />
        <meshStandardMaterial
          color="#78909c"
          metalness={0.45}
          roughness={0.35}
          emissive={result.UenclosureV > 25 ? '#ff7043' : '#000000'}
          emissiveIntensity={result.UenclosureV > 25 ? 0.2 : 0}
        />
      </mesh>
      <Label position={[xEquip, 1.15, 0.55]} color="#eceff1" size={0.09}>
        Корпус
      </Label>

      {/* Fault mark */}
      {showFault && (
        <>
          <mesh position={[xN + 0.1, yPEN, 1.2]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#ff5722" emissive="#ff1744" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[(xN + 0.1 + xEquip) / 2, (yPEN + 1.05) / 2, 0.6]} rotation={[0, 0.3, 0.15]}>
            <cylinderGeometry args={[0.03, 0.03, 4.1, 10]} />
            <meshStandardMaterial color="#bf360c" emissive="#ff3d00" emissiveIntensity={0.2} />
          </mesh>
          <Label position={[xN + 0.3, yPEN + 0.3, 1.2]} color="#ffccbc" size={0.08}>
            L1 → корпус
          </Label>
        </>
      )}

      {showPhaseSoil && (
        <Label position={[xN + 0.2, 0.55, 1.2]} color="#ffccbc" size={0.08}>
          L1 → земля (Rзм)
        </Label>
      )}

      {/* Repeat ground */}
      {showRepeat && (
        <>
          <mesh position={[0.6, yPEN / 2, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, yPEN, 10]} />
            <meshStandardMaterial color="#fdd835" metalness={0.35} />
          </mesh>
          <Label position={[1.0, 0.25, 0]} color="#ffe082" size={0.08}>
            Rn
          </Label>
        </>
      )}

      <Label position={[0, 3.05, 0]} color="#f5f5f5" size={0.11} outlineColor="#111">
        {scenarios[idx].label}
      </Label>
      <Label position={[-4.3, 2.65, 0]} color="#e3f2fd" size={0.095} outlineColor="#263238">
        {`Uφ=${UphiV.toFixed(0)} В; Zn=${ZnOhm.toFixed(2)} Ом; ZH=${ZHOhm.toFixed(2)} Ом`}
      </Label>
      <Label position={[-4.3, 2.30, 0]} color="#b3e5fc" size={0.095} outlineColor="#263238">
        {`Iк.з.≈${result.IkzA.toFixed(1)} А; Uкорп≈${result.UenclosureV.toFixed(1)} В`}
      </Label>
      <Label position={[-4.3, 1.95, 0]} color={dangerColor} size={0.12} outlineColor="#111">
        {`Iч≈${result.IbodyMA.toFixed(2)} мА`}
      </Label>
    </>
  );
}

/* ─────────────── Lesson 12: Earthing electrodes (theory) ─────────────── */

function L12EarthingElectrodesScene({
  rhoOhmM,
  lM,
  dMm,
  tM,
}: {
  rhoOhmM: number;
  lM: number;
  dMm: number;
  tM: number;
}) {
  const dM = Math.max(0.001, dMm / 1000);
  const R1 = lesson12SingleElectrodeResistanceOhm({ rhoOhmM, lM, dM, tM });
  const etaZ = 0.75;
  const Rtarget = 4;
  const n = lesson12ElectrodeCount({ RsingleOhm: R1, etaZ, RtargetOhm: Rtarget });
  const nCeil = Math.max(1, Math.ceil(n));

  const depthY = Math.max(0.6, Math.min(2.6, tM * 0.35));
  const lenY = Math.max(1.0, Math.min(3.0, lM * 0.35));
  const glow = Math.max(0.15, Math.min(2.0, (rhoOhmM / 500) * 1.2));

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#8a9a68" roughness={1} />
      </mesh>

      {/* Electrode */}
      <mesh position={[0, -0.2 + depthY, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, lenY, 12]} />
        <meshStandardMaterial color="#616161" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color="#ff5722" emissive="#ff3d00" emissiveIntensity={0.25 + 0.35 * glow} />
      </mesh>

      {/* Visual ring: higher rho => larger "influence" ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.1 + 0.5 + (rhoOhmM / 500) * 1.8, 64]} />
        <meshBasicMaterial color="#ff7043" transparent opacity={0.18} />
      </mesh>

      <Label position={[0, 3.05, 0]} color="#f5f5f5" size={0.11} outlineColor="#111">
        {'Одиночный электрод (12.14) и число электродов (12.15)'}
      </Label>
      <Label position={[-4.5, 2.65, 0]} color="#e3f2fd" size={0.10} outlineColor="#263238">
        {`ρ=${rhoOhmM.toFixed(0)} Ом·м; l=${lM.toFixed(1)} м; d=${dM.toFixed(3)} м; t=${tM.toFixed(1)} м`}
      </Label>
      <Label position={[-4.5, 2.30, 0]} color="#ffecb3" size={0.10} outlineColor="#263238">
        {`Rод ≈ ${Number.isFinite(R1) ? R1.toFixed(2) : '—'} Ом`}
      </Label>
      <Label position={[-4.5, 1.95, 0]} color="#b9f6ca" size={0.10} outlineColor="#1b5e20">
        {`ηз=${etaZ}; Rз=4 Ом → n≈${Number.isFinite(n) ? n.toFixed(2) : '—'} → ${nCeil} шт.`}
      </Label>
    </>
  );
}

/* ─────────────── Main TheoryScene3D ─────────────── */

interface TheoryScene3DProps {
  type: TheorySimulatorType;
  params: Record<string, number>;
}

/**
 * Renders the correct scene sub-component based on `type`.
 *
 * This is intentionally a plain function component (NOT wrapped in useMemo)
 * so that React can **reconcile** child scene components when only props
 * change.  The previous useMemo approach recreated the entire JSX tree on
 * every parameter tweak, which unmounted / remounted every mesh, broke
 * OrbitControls state and reset useFrame animations — making the scene
 * feel like it "reloads" instead of updating smoothly.
 */
function SceneContent({ type, params }: TheoryScene3DProps) {
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
      return <EmiWaveScene eField={Math.max(0.1, params.a ?? 20)} hField={Math.max(0.001, params.b ?? 0.05)} />;
    case 'emi-shield-thickness':
      return <ShieldThicknessScene thickness={Math.max(0.001, (params.a ?? 1) / 1000)} attenuation={params.b ?? 20} />;
    case 'emi-waveguide': {
      const dMm = params.a ?? 15;
      const eps = Math.max(1, params.b ?? 7);
      const lDb = Math.max(1, params.c ?? 30);
      const diameterM = Math.max(0.001, dMm / 1000);
      const a1 = waveguideAttenuationPerM(diameterM, eps);
      /* Как в MiniSimulator: демо-длина l = L(дБ) / α */
      const lengthM = lDb / Math.max(1e-12, a1);
      return (
        <WaveguideScene
          diameterM={diameterM}
          lengthM={lengthM}
          epsilon={eps}
          attenuationPerM={a1}
        />
      );
    }
    case 'emi-field-attenuation':
      return <EmiFieldAttenuationScene fieldBefore={Math.max(1, params.a ?? 100)} fieldAfter={Math.max(0, params.b ?? 5)} />;
    case 'hf-field-strength':
      /* MiniSimulator: a=λ, b=P(кВт), c=Ga, d=d(м) — раньше ошибочно подставлялись a→P и b→d */
      return (
        <HfFieldStrengthScene
          wavelength={Math.max(10, params.a ?? 500)}
          power={Math.max(0.1, params.b ?? 250)}
          gain={Math.max(0.1, params.c ?? 1.05)}
          distance={Math.max(100, params.d ?? 1000)}
        />
      );
    case 'hf-wave-propagation':
      return <HfWavePropagationScene wavelength={Math.max(10, params.a ?? 500)} distance={Math.max(100, params.b ?? 3000)} />;
    case 'hf-soil-attenuation':
      return (
        <HfSoilAttenuationScene
          sigmaSm={Math.max(0.0005, (params.a ?? 5) / 1000)}
          wavelengthM={Math.max(10, params.b ?? 500)}
          distanceM={Math.max(100, params.c ?? 2000)}
        />
      );
    case 'uhf-field-strength':
      return (
        <UhfFieldStrengthScene
          power={Math.max(1, params.a ?? 50000)}
          gain={Math.max(1, params.b ?? 15)}
          height={Math.max(10, params.c ?? 200)}
          radius={Math.max(10, params.d ?? 400)}
        />
      );
    case 'uhf-antenna-pattern':
      return (
        <UhfAntennaPatternScene
          gain={Math.max(1, params.a ?? 10)}
          deltaDeg={Math.max(0, Math.min(90, params.b ?? 25))}
        />
      );
    case 'radiation-dose': {
      const fMHz = Math.max(
        0.03,
        Math.min(RADIATION_DOSE_FREQ_SLIDER_MAX_MHZ, params.a ?? 100),
      );
      return <RadiationDoseScene frequencyMHz={fMHz} />;
    }
    case 'electric-current-body': {
      const U = Math.max(1, params.a ?? 220);
      const Z = Math.max(100, params.b ?? 5000);
      const ImA = bodyCurrentMA(U, Z);
      return <ElectricCurrentBodyScene current={ImA} />;
    }
    case 'electric-resistance':
      // По запросу: убрали визуализацию «Эквивалентная схема сопротивления тела».
      // Оставляем пустую сцену без схемы, чтобы не ломать типизацию simulator.
      return <Room />;
    case 'electric-frequency-effect':
      return <ElectricFrequencyEffectScene frequency={Math.max(1, params.a ?? 50)} />;
    case 'ground-current-spread':
      return <GroundCurrentSpreadScene current={Math.max(0.1, params.a ?? 10)} resistivity={Math.max(1, params.b ?? 100)} />;
    case 'step-voltage':
      // MiniSimulator: a=Iz (А), b=rho (Ом·м), c=x (м), d=a(m×0.1) => stepLength=a=d/10
      return (
        <StepVoltageScene
          current={Math.max(0.1, params.a ?? 10)}
          resistivity={Math.max(1, params.b ?? 100)}
          distanceM={Math.max(0.5, params.c ?? 5)}
          stepLengthM={Math.max(0.1, (params.d ?? 8) / 10)}
        />
      );
    case 'equipotential-zones':
      return <EquipotentialZonesScene current={Math.max(0.1, params.a ?? 10)} resistivity={Math.max(1, params.b ?? 100)} />;
    case 'l12-tn-fault-modes':
      return (
        <L12TnModesScene
          UphiV={Math.max(1, params.a ?? 220)}
          ZnOhm={Math.max(0.1, params.b ?? 2)}
          ZHOhm={Math.max(0.05, params.c ?? 1)}
          modeIndex={params.d ?? 0}
        />
      );
    case 'l12-earthing-electrodes':
      return (
        <L12EarthingElectrodesScene
          rhoOhmM={Math.max(1, params.a ?? 100)}
          lM={Math.max(0.5, params.b ?? 3)}
          dMm={Math.max(10, params.c ?? 50)}
          tM={Math.max(0.3, params.d ?? 2)}
        />
      );
    case 'l11-it-touch': {
      return (
        <L11ItTouchSchematic
          UphiV={Math.max(1, params.a ?? 220)}
          RhOhm={Math.max(1, params.b ?? 1000)}
          RisoOhm={Math.max(100, params.c ?? 6000)}
          touchedPhaseIndex={Math.round(params.d ?? 0)}
        />
      );
    }
    case 'l11-tn-normal-touch': {
      return (
        <L11TnNormalTouchSchematic
          UphiV={Math.max(1, params.a ?? 220)}
          RhOhm={Math.max(1, params.b ?? 1000)}
          RgOhm={Math.max(0.1, params.c ?? 10)}
          touchedPhaseIndex={Math.round(params.d ?? 0)}
        />
      );
    }
    case 'l11-tn-emergency-touch': {
      return (
        <L11TnEmergencyTouchSchematic
          UphiV={Math.max(1, params.a ?? 220)}
          RhOhm={Math.max(1, params.b ?? 1000)}
          RzmOhm={Math.max(0.1, params.c ?? 15)}
          touchedPhaseIndex={Math.round(params.d ?? 1)}
        />
      );
    }
    default:
      return <Room />;
  }
}

export default function TheoryScene3D({ type, params }: TheoryScene3DProps) {
  const title = sceneTitle[type] || 'Интерактивная 3D-визуализация';

  return (
    <Paper variant="outlined" sx={{ mt: 1, mb: 1 }}>
      <Typography variant="subtitle2" sx={{ p: 1, pb: 0, fontWeight: 700 }}>
        {title}
      </Typography>
      <Box sx={{ height: { xs: 260, md: 340 }, borderRadius: 1, overflow: 'hidden' }}>
        <SafeCanvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[5, 8, 3]}
            intensity={1.3}
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
          />
          <SceneContent type={type} params={params} />
          <OrbitControls enablePan={false} />
          <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />
        </SafeCanvas>
      </Box>
    </Paper>
  );
}
