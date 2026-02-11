import { useState, useRef, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import type { Mesh, Group } from 'three';
import SafeCanvas from '../../components/SafeCanvas';

/* ─── Shield materials ─── */
const shieldMaterials = [
  { name: 'Сталь (μ=200, γ=0.7×10⁷)', mu: 200, gamma: 0.7e7, colorHex: '#78909c' },
  { name: 'Медь (μ=1, γ=5.8×10⁷)', mu: 1, gamma: 5.8e7, colorHex: '#e65100' },
  { name: 'Алюминий (μ=1, γ=3.6×10⁷)', mu: 1, gamma: 3.6e7, colorHex: '#bdbdbd' },
  { name: 'Пермаллой (μ=70000, γ=0.2×10⁷)', mu: 70000, gamma: 0.2e7, colorHex: '#5c6bc0' },
];

/* ─── EM wave oscillation ─── */
function EMWave({ xOffset, opacity }: { xOffset: number; opacity: number }) {
  const ref = useRef<Group>(null!);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    if (ref.current) {
      ref.current.position.x = xOffset + Math.sin(time.current * 3) * 0.1;
    }
  });

  const points: [number, number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const t = (i / 20) * Math.PI * 4;
    points.push([0, Math.sin(t) * 0.5, (i / 20 - 0.5) * 3]);
  }

  return (
    <group ref={ref}>
      {points.map((p, i) =>
        i < points.length - 1 ? (
          <mesh key={i} position={[(p[0] + points[i + 1][0]) / 2, (p[1] + points[i + 1][1]) / 2, (p[2] + points[i + 1][2]) / 2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ff1744" transparent opacity={opacity} />
          </mesh>
        ) : null
      )}
    </group>
  );
}

/* ─── Lab scene ─── */
function EMFLabScene({
  power,
  freq,
  shieldColor,
  shieldThickness,
  attenuation,
}: {
  power: number;
  freq: number;
  shieldColor: string;
  shieldThickness: number;
  attenuation: number;
}) {
  const personRef = useRef<Mesh>(null!);

  const attFraction = Math.max(0, 1 - attenuation / 60);

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#263238" />
      </mesh>

      {/* Source (antenna / generator) */}
      <group position={[-4, 0, 0]}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[0.8, 2, 0.8]} />
          <meshStandardMaterial color="#f44336" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
        <Text position={[0, 3.5, 0]} fontSize={0.2} color="#ff5252" anchorX="center">
          Источник ЭМИ
        </Text>
        <Text position={[0, 3.1, 0]} fontSize={0.15} color="#ffab91" anchorX="center">
          {`P = ${power} Вт, f = ${(freq / 1e6).toFixed(0)} МГц`}
        </Text>
      </group>

      {/* EM Waves from source */}
      {[0, 0.5, 1, 1.5, 2].map((d) => (
        <EMWave key={d} xOffset={-3 + d} opacity={0.7} />
      ))}

      {/* Shield */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[Math.max(0.05, shieldThickness * 200), 3, 4]} />
        <meshStandardMaterial color={shieldColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <Text position={[0, 3.5, 0]} fontSize={0.18} color="#fff" anchorX="center">
        {`Экран: δ = ${shieldThickness.toFixed(3)} мм`}
      </Text>
      <Text position={[0, 3.1, 0]} fontSize={0.15} color="#aaa" anchorX="center">
        {`Ослабление: ${attenuation.toFixed(1)} дБ`}
      </Text>

      {/* Attenuated waves after shield */}
      {attFraction > 0.02 && [0, 0.5, 1].map((d) => (
        <EMWave key={`att${d}`} xOffset={1 + d} opacity={attFraction * 0.5} />
      ))}

      {/* Person behind shield */}
      <group position={[4.5, 0, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ffcc80" />
        </mesh>
        <Text position={[0, 2.5, 0]} fontSize={0.2} color={attFraction < 0.3 ? '#4caf50' : '#ff5252'} anchorX="center">
          {attFraction < 0.3 ? 'Безопасно' : 'Опасно!'}
        </Text>
      </group>
    </>
  );
}

export default function EMFLab() {
  const [power, setPower] = useState(100); // Watts
  const [freq, setFreq] = useState(300e6); // Hz
  const [timeHours, setTimeHours] = useState(6);
  const [materialIdx, setMaterialIdx] = useState(0);

  const mat = shieldMaterials[materialIdx];

  // Calculate PEI at workplace (4m from source, simplified)
  const distance = 4; // meters
  const G = 10; // directive gain (typical)
  const PEI = (power * G) / (4 * Math.PI * distance * distance) * 1000; // in mW/cm² (approx)
  const PEI_mW = PEI * 0.1; // simplified conversion

  // Allowable PEI
  const N = 2; // W·h/m²
  const PEI_allow = N / timeHours; // W/m² → mW/cm² approximation
  const PEI_allow_mW = PEI_allow * 0.1;

  // Required attenuation
  const L_required = PEI_mW > PEI_allow_mW
    ? 10 * Math.log10(PEI_mW / PEI_allow_mW)
    : 0;

  // Shield thickness: δ = L / (8.69 × √(π × f × μ₀ × μᵣ × γ))
  const mu0 = 4 * Math.PI * 1e-7;
  const muA = mu0 * mat.mu;
  const skinDenominator = 8.69 * Math.sqrt(Math.PI * freq * muA * mat.gamma);
  const delta = skinDenominator > 0 ? (L_required / skinDenominator) * 1000 : 0; // in mm

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* 3D Scene */}
      <Box sx={{ flex: 1, height: { xs: 350, md: 500 }, borderRadius: 2, overflow: 'hidden' }}>
        <Suspense fallback={<Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
          <SafeCanvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.2} />
            <EMFLabScene
              power={power}
              freq={freq}
              shieldColor={mat.colorHex}
              shieldThickness={delta}
              attenuation={L_required}
            />
            <OrbitControls enablePan={false} />
            <Environment preset="city" />
          </SafeCanvas>
        </Suspense>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, width: { xs: '100%', md: 380 }, flexShrink: 0, maxHeight: 650, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Расчёт экрана ЭМИ</Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography gutterBottom>Мощность P: {power} Вт</Typography>
            <Slider value={power} onChange={(_, v) => setPower(v as number)} min={10} max={1000} step={10} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Частота: {(freq / 1e6).toFixed(0)} МГц</Typography>
            <Slider value={freq / 1e6} onChange={(_, v) => setFreq((v as number) * 1e6)} min={1} max={3000} step={10} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Время облучения: {timeHours} ч</Typography>
            <Slider value={timeHours} onChange={(_, v) => setTimeHours(v as number)} min={0.5} max={8} step={0.5} valueLabelDisplay="auto" />
          </Box>

          <FormControl size="small">
            <InputLabel>Материал экрана</InputLabel>
            <Select value={materialIdx} label="Материал экрана" onChange={(e) => setMaterialIdx(e.target.value as number)}>
              {shieldMaterials.map((m, idx) => (
                <MenuItem key={idx} value={idx}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Results */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Результаты</Typography>
            <Typography variant="body2">ППЭ на рабочем месте: {PEI_mW.toFixed(3)} мВт/см²</Typography>
            <Typography variant="body2">
              ППЭдоп = N/T = {N}/{timeHours} = {PEI_allow.toFixed(3)} Вт/м²
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Требуемое ослабление: L = 10×lg(ППЭ/ППЭдоп) = {L_required.toFixed(1)} дБ
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              δ = L / (8.69 × √(π×f×μₐ×γ))
            </Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              δ = {delta.toFixed(3)} мм
            </Typography>
            <Chip
              label={L_required <= 0 ? 'Экран не требуется' : `Толщина экрана: ${delta.toFixed(3)} мм`}
              color={L_required <= 0 ? 'success' : 'info'}
            />
          </Paper>

          <Typography variant="caption" color="text.secondary">
            Формула: δ = L / (8.69 × √(π × f × μ₀ × μᵣ × γ)).
            μ₀ = 4π×10⁻⁷ Гн/м. N = 2 Вт·ч/м².
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
