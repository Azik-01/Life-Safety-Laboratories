import { useState, useMemo, Suspense } from 'react';
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
import { OrbitControls, Environment, Text } from '@react-three/drei';
import SafeCanvas from '../../components/SafeCanvas';

/* ─── Lamp data ─── */
const lampTypes = [
  { name: 'ЛБ-40 (люминесцентная)', flux: 3120, power: 40 },
  { name: 'ЛБ-80 (люминесцентная)', flux: 5220, power: 80 },
  { name: 'ЛН-200 (накаливания)', flux: 2800, power: 200 },
  { name: 'ДРЛ-400 (ртутная)', flux: 24000, power: 400 },
  { name: 'МГЛ-250 (металлогалогенная)', flux: 19000, power: 250 },
];

/* ─── Utilization coefficient table (simplified) ─── */
function getEta(i: number, rhoP: number, rhoS: number): number {
  // Simplified lookup: returns η based on room index and reflectances
  const base = Math.min(0.28 + i * 0.08, 0.72);
  const reflBonus = (rhoP * 0.15 + rhoS * 0.1);
  return Math.min(base + reflBonus, 0.85);
}

/* ─── 3D Room with luminaires ─── */
function RoomScene({ L, B, H, numLuminaires, lampsPerLuminaire }: {
  L: number; B: number; H: number; numLuminaires: number; lampsPerLuminaire: number;
}) {
  // Calculate grid layout
  const ratio = L / B;
  let cols = Math.round(Math.sqrt(numLuminaires * ratio));
  let rows = Math.round(numLuminaires / cols);
  if (cols < 1) cols = 1;
  if (rows < 1) rows = 1;
  const total = cols * rows;

  const luminaires: [number, number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -L / 2 + (L / (cols + 1)) * (c + 1);
      const z = -B / 2 + (B / (rows + 1)) * (r + 1);
      luminaires.push([x, H - 0.15, z]);
    }
  }

  const scale = 0.5;

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[L * scale, B * scale]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H * scale, 0]}>
        <planeGeometry args={[L * scale, B * scale]} />
        <meshStandardMaterial color="#78909c" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, H * scale / 2, -B * scale / 2]}>
        <boxGeometry args={[L * scale, H * scale, 0.05]} />
        <meshStandardMaterial color="#607d8b" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-L * scale / 2, H * scale / 2, 0]}>
        <boxGeometry args={[0.05, H * scale, B * scale]} />
        <meshStandardMaterial color="#607d8b" transparent opacity={0.5} />
      </mesh>
      <mesh position={[L * scale / 2, H * scale / 2, 0]}>
        <boxGeometry args={[0.05, H * scale, B * scale]} />
        <meshStandardMaterial color="#607d8b" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, H * scale / 2, B * scale / 2]}>
        <boxGeometry args={[L * scale, H * scale, 0.05]} />
        <meshStandardMaterial color="#607d8b" transparent opacity={0.3} />
      </mesh>

      {/* Luminaires */}
      {luminaires.map((pos, i) => (
        <group key={i} position={[pos[0] * scale, pos[1] * scale, pos[2] * scale]}>
          {/* Housing */}
          <mesh>
            <boxGeometry args={[0.6, 0.06, 0.15]} />
            <meshStandardMaterial color="#e0e0e0" />
          </mesh>
          {/* Glow */}
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.55, 0.02, 0.12]} />
            <meshBasicMaterial color="#fff9c4" />
          </mesh>
          <pointLight position={[0, -0.1, 0]} intensity={5} distance={4} color="#fff9c4" />
        </group>
      ))}

      {/* Room dimension labels */}
      <Text position={[0, 0.05, B * scale / 2 + 0.3]} fontSize={0.2} color="#90caf9" anchorX="center">
        {`L = ${L} м`}
      </Text>
      <Text position={[L * scale / 2 + 0.3, 0.05, 0]} fontSize={0.2} color="#90caf9" anchorX="center" rotation={[0, -Math.PI / 2, 0]}>
        {`B = ${B} м`}
      </Text>
      <Text position={[L * scale / 2 + 0.3, H * scale / 2, -B * scale / 2 - 0.2]} fontSize={0.15} color="#90caf9" anchorX="center">
        {`H = ${H} м`}
      </Text>
      <Text position={[0, H * scale + 0.3, 0]} fontSize={0.18} color="#ffeb3b" anchorX="center">
        {`N = ${total} светильников (${cols}×${rows})`}
      </Text>
    </>
  );
}

export default function LightCalculationLab() {
  const [L, setL] = useState(12);
  const [B, setB] = useState(8);
  const [H, setH] = useState(3.5);
  const [En, setEn] = useState(300);
  const [Kz, setKz] = useState(1.5);
  const [z, setZ] = useState(1.1);
  const [lampIdx, setLampIdx] = useState(0);
  const [lampsPerLuminaire, setLampsPerLuminaire] = useState(2);
  const [rhoP, setRhoP] = useState(0.7);
  const [rhoS, setRhoS] = useState(0.5);

  const lamp = lampTypes[lampIdx];
  const S = L * B;
  const Hp = H - 0.3;
  const i = (L * B) / (Hp * (L + B));
  const eta = getEta(i, rhoP, rhoS);
  const N = Math.ceil((En * S * Kz * z) / (lampsPerLuminaire * lamp.flux * eta));
  const totalPower = N * lampsPerLuminaire * lamp.power;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* 3D Scene */}
      <Box sx={{ flex: 1, height: { xs: 350, md: 500 }, borderRadius: 2, overflow: 'hidden' }}>
        <Suspense fallback={<Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
          <SafeCanvas shadows camera={{ position: [6, 5, 6], fov: 50 }}>
            <ambientLight intensity={0.15} />
            <RoomScene L={L} B={B} H={H} numLuminaires={N} lampsPerLuminaire={lampsPerLuminaire} />
            <OrbitControls enablePan={false} />
            <Environment preset="warehouse" />
          </SafeCanvas>
        </Suspense>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, width: { xs: '100%', md: 380 }, flexShrink: 0, maxHeight: 650, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Расчёт освещения</Typography>

        <Stack spacing={2}>
          <Box>
            <Typography gutterBottom>Длина L: {L} м</Typography>
            <Slider value={L} onChange={(_, v) => setL(v as number)} min={4} max={30} step={1} />
          </Box>
          <Box>
            <Typography gutterBottom>Ширина B: {B} м</Typography>
            <Slider value={B} onChange={(_, v) => setB(v as number)} min={3} max={20} step={1} />
          </Box>
          <Box>
            <Typography gutterBottom>Высота H: {H} м</Typography>
            <Slider value={H} onChange={(_, v) => setH(v as number)} min={2.5} max={8} step={0.1} />
          </Box>
          <Box>
            <Typography gutterBottom>Eн (нормированная): {En} лк</Typography>
            <Slider value={En} onChange={(_, v) => setEn(v as number)} min={50} max={1000} step={50} />
          </Box>

          <FormControl size="small">
            <InputLabel>Тип лампы</InputLabel>
            <Select value={lampIdx} label="Тип лампы" onChange={(e) => setLampIdx(e.target.value as number)}>
              {lampTypes.map((l, idx) => (
                <MenuItem key={idx} value={idx}>{l.name} — {l.flux} лм</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom>Ламп в светильнике: {lampsPerLuminaire}</Typography>
            <Slider value={lampsPerLuminaire} onChange={(_, v) => setLampsPerLuminaire(v as number)} min={1} max={4} step={1} marks />
          </Box>

          <Box>
            <Typography gutterBottom>Кз (запас): {Kz}</Typography>
            <Slider value={Kz} onChange={(_, v) => setKz(v as number)} min={1.0} max={2.0} step={0.1} />
          </Box>

          {/* Results  */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Результаты расчёта:</Typography>
            <Typography variant="body2">S = {S} м²</Typography>
            <Typography variant="body2">Hp = {Hp.toFixed(1)} м, i = {i.toFixed(2)}</Typography>
            <Typography variant="body2">η = {(eta * 100).toFixed(0)}%</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              N = (Eн×S×Kз×z) / (n×Фл×η)
            </Typography>
            <Typography variant="body2">
              N = ({En}×{S}×{Kz}×{z}) / ({lampsPerLuminaire}×{lamp.flux}×{eta.toFixed(2)})
            </Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              N = {N} светильников
            </Typography>
            <Chip label={`Σ мощность: ${(totalPower / 1000).toFixed(1)} кВт`} size="small" />
          </Paper>
        </Stack>
      </Paper>
    </Box>
  );
}
