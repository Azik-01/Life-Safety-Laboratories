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
import type { Mesh } from 'three';
import SafeCanvas from '../../components/SafeCanvas';

/* ─── Barrier materials ─── */
const barriers = [
  { name: 'Кирпичная стена (250 мм)', density: 480, R0: 50 },
  { name: 'Бетонная плита (200 мм)', density: 460, R0: 48 },
  { name: 'Стекло (6 мм)', density: 15, R0: 25 },
  { name: 'Деревянная дверь (40 мм)', density: 20, R0: 22 },
  { name: 'Стальной лист (2 мм)', density: 15.6, R0: 35 },
  { name: 'Гипсокартон (12 мм)', density: 10, R0: 28 },
];

/* ─── Expanding sound ring ─── */
function SoundRing({ delay, active, attenuation }: { delay: number; active: boolean; attenuation: number }) {
  const ref = useRef<Mesh>(null!);
  const time = useRef(delay);

  useFrame((_, delta) => {
    if (!active) return;
    time.current += delta;
    const t = (time.current % 3);
    const scale = 0.3 + t * 1.2;
    const opacity = Math.max(0, (1 - t / 3) * (1 - attenuation));
    if (ref.current) {
      ref.current.scale.set(scale, scale, scale);
      (ref.current.material as any).opacity = opacity;
    }
  });

  return (
    <mesh ref={ref} position={[-3, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[1, 0.03, 8, 32]} />
      <meshBasicMaterial color="#ff9800" transparent opacity={0.6} />
    </mesh>
  );
}

/* ─── Transmitted sound ring ─── */
function TransmittedRing({ delay, dBDrop }: { delay: number; dBDrop: number }) {
  const ref = useRef<Mesh>(null!);
  const time = useRef(delay);

  useFrame((_, delta) => {
    time.current += delta;
    const t = (time.current % 3);
    const scale = 0.2 + t * 0.8;
    const opacity = Math.max(0, (1 - t / 3) * Math.max(0.05, 1 - dBDrop / 60));
    if (ref.current) {
      ref.current.scale.set(scale, scale, scale);
      (ref.current.material as any).opacity = opacity;
    }
  });

  return (
    <mesh ref={ref} position={[3, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[1, 0.02, 8, 32]} />
      <meshBasicMaterial color="#4caf50" transparent opacity={0.3} />
    </mesh>
  );
}

/* ─── Lab scene ─── */
function NoiseScene({ srcLevel, barrierR, freq }: { srcLevel: number; barrierR: number; freq: number }) {
  const resultLevel = Math.max(0, srcLevel - barrierR);

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>

      {/* Sound source (speaker) */}
      <mesh position={[-4, 1.5, 0]} castShadow>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <mesh position={[-3.4, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <Text position={[-4, 3.2, 0]} fontSize={0.3} color="#ff9800" anchorX="center">
        {`${srcLevel} дБ`}
      </Text>
      <Text position={[-4, 2.8, 0]} fontSize={0.15} color="#bbb" anchorX="center">
        {`f = ${freq} Гц`}
      </Text>

      {/* Barrier wall */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[0.4, 4, 6]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
      <Text position={[0, 4.3, 0]} fontSize={0.2} color="#fff" anchorX="center">
        {`R = ${barrierR.toFixed(0)} дБ`}
      </Text>

      {/* Receiver (person) */}
      <group position={[4, 0, 0]}>
        {/* Body */}
        <mesh position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.8, 8, 16]} />
          <meshStandardMaterial color="#42a5f5" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.9, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ffcc80" />
        </mesh>
      </group>
      <Text position={[4, 3.2, 0]} fontSize={0.3} color="#4caf50" anchorX="center">
        {`${resultLevel.toFixed(0)} дБ`}
      </Text>

      {/* Sound waves from source */}
      {[0, 0.6, 1.2, 1.8, 2.4].map((d) => (
        <SoundRing key={`s${d}`} delay={d} active={true} attenuation={0} />
      ))}

      {/* Transmitted waves (weaker) */}
      {[0, 0.8, 1.6, 2.4].map((d) => (
        <TransmittedRing key={`t${d}`} delay={d} dBDrop={barrierR} />
      ))}

      {/* Arrow showing attenuation */}
      <Text position={[0, -0.5, 3.5]} fontSize={0.18} color="#ff9800" anchorX="center">
        {`${srcLevel} дБ → ${resultLevel.toFixed(0)} дБ (−${barrierR.toFixed(0)} дБ)`}
      </Text>
    </>
  );
}

export default function NoiseLab() {
  const [srcLevel, setSrcLevel] = useState(90);
  const [freq, setFreq] = useState(1000);
  const [barrierIdx, setBarrierIdx] = useState(0);

  const barrier = barriers[barrierIdx];

  // Sound insulation by mass law: R = 20 × lg(m × f) − 47.5
  const R_calc = 20 * Math.log10(barrier.density * freq) - 47.5;
  const R = Math.max(0, R_calc);
  const resultLevel = Math.max(0, srcLevel - R);

  // Norm comparison
  const norm = 80; // dB allowable for industrial
  const withinNorm = resultLevel <= norm;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* 3D Scene */}
      <Box sx={{ flex: 1, height: { xs: 350, md: 500 }, borderRadius: 2, overflow: 'hidden' }}>
        <Suspense fallback={<Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
          <SafeCanvas shadows camera={{ position: [0, 4, 10], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <NoiseScene srcLevel={srcLevel} barrierR={R} freq={freq} />
            <OrbitControls enablePan={false} />
            <Environment preset="city" />
          </SafeCanvas>
        </Suspense>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, width: { xs: '100%', md: 360 }, flexShrink: 0, maxHeight: 600, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Расчёт шума</Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography gutterBottom>Уровень источника: {srcLevel} дБ</Typography>
            <Slider value={srcLevel} onChange={(_, v) => setSrcLevel(v as number)} min={40} max={130} step={5} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Частота: {freq} Гц</Typography>
            <Slider value={freq} onChange={(_, v) => setFreq(v as number)} min={63} max={8000} step={1} valueLabelDisplay="auto"
              scale={(x) => x}
              marks={[
                { value: 63, label: '63' },
                { value: 250, label: '250' },
                { value: 1000, label: '1к' },
                { value: 4000, label: '4к' },
                { value: 8000, label: '8к' },
              ]}
            />
          </Box>

          <FormControl size="small">
            <InputLabel>Материал преграды</InputLabel>
            <Select value={barrierIdx} label="Материал преграды" onChange={(e) => setBarrierIdx(e.target.value as number)}>
              {barriers.map((b, idx) => (
                <MenuItem key={idx} value={idx}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Результаты</Typography>
            <Typography variant="body2">
              Масса 1 м²: m = {barrier.density} кг/м²
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              R = 20×lg(m×f) − 47.5
            </Typography>
            <Typography variant="body2">
              R = 20×lg({barrier.density}×{freq}) − 47.5
            </Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              R = {R.toFixed(1)} дБ
            </Typography>
            <Typography variant="body2">
              Уровень за преградой: {srcLevel} − {R.toFixed(1)} = {resultLevel.toFixed(1)} дБ
            </Typography>
            <Box mt={1}>
              <Chip
                label={withinNorm ? `≤ ${norm} дБ — норма` : `> ${norm} дБ — превышение!`}
                color={withinNorm ? 'success' : 'error'}
              />
            </Box>
          </Paper>

          <Typography variant="caption" color="text.secondary">
            Допустимый уровень для производственных помещений — 80 дБА.
            При непостоянном шуме — эквивалентный уровень Lэкв.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
