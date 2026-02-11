import { useState, useRef, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Stack,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import type { Mesh } from 'three';
import SafeCanvas from '../../components/SafeCanvas';

/* ─── Expanding wave from antenna ─── */
function WaveRing({ delay, maxR }: { delay: number; maxR: number }) {
  const ref = useRef<Mesh>(null!);
  const time = useRef(delay);

  useFrame((_, delta) => {
    time.current += delta;
    const t = (time.current % 4);
    const scale = 0.2 + (t / 4) * maxR;
    const opacity = Math.max(0, 0.5 - t / 8);
    if (ref.current) {
      ref.current.scale.set(scale, scale, scale);
      (ref.current.material as any).opacity = opacity;
    }
  });

  return (
    <mesh ref={ref} position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.02, 8, 48]} />
      <meshBasicMaterial color="#ff9800" transparent opacity={0.4} />
    </mesh>
  );
}

/* ─── Lab scene ─── */
function UHFScene({
  towerHeight,
  measureDist,
  fieldStrength,
  normE,
}: {
  towerHeight: number;
  measureDist: number;
  fieldStrength: number;
  normE: number;
}) {
  const personRef = useRef<Mesh>(null!);

  const scale = 0.3;
  const safe = fieldStrength <= normE;

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>

      {/* Tower base */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.8]} />
        <meshStandardMaterial color="#795548" />
      </mesh>

      {/* Tower */}
      <mesh position={[0, towerHeight * scale / 2 + 0.5, 0]} castShadow>
        <boxGeometry args={[0.15, towerHeight * scale, 0.15]} />
        <meshStandardMaterial color="#9e9e9e" />
      </mesh>

      {/* Cross beams */}
      {Array.from({ length: Math.floor(towerHeight / 5) }, (_, i) => (
        <mesh key={i} position={[0, 0.5 + (i + 1) * (towerHeight * scale / (Math.floor(towerHeight / 5) + 1)), 0]}>
          <boxGeometry args={[0.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#757575" />
        </mesh>
      ))}

      {/* Antenna on top */}
      <mesh position={[0, towerHeight * scale + 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.08, 0.4, 8]} />
        <meshStandardMaterial color="#f44336" />
      </mesh>

      {/* Expanding waves */}
      {[0, 0.8, 1.6, 2.4, 3.2].map((d) => (
        <WaveRing key={d} delay={d} maxR={2} />
      ))}

      <Text position={[0, towerHeight * scale + 1.3, 0]} fontSize={0.18} color="#ff9800" anchorX="center">
        {`H = ${towerHeight} м`}
      </Text>

      {/* Person at measurement point */}
      <group position={[measureDist * scale, 0, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
          <meshStandardMaterial color={safe ? '#4caf50' : '#f44336'} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ffcc80" />
        </mesh>
        <Text position={[0, 2, 0]} fontSize={0.18} color={safe ? '#4caf50' : '#ff5252'} anchorX="center">
          {`E = ${fieldStrength.toFixed(1)} В/м`}
        </Text>
        <Text position={[0, -0.3, 0]} fontSize={0.13} color="#bbb" anchorX="center">
          {`r = ${measureDist} м`}
        </Text>
      </group>

      {/* Distance line */}
      <mesh position={[measureDist * scale / 2, 0.02, 0.5]}>
        <boxGeometry args={[measureDist * scale, 0.02, 0.02]} />
        <meshBasicMaterial color="#ffeb3b" />
      </mesh>

      {/* Ground markers */}
      {[10, 20, 50, 100, 200].filter(d => d <= measureDist + 50).map((d) => (
        <Text key={d} position={[d * scale, 0.1, 1]} fontSize={0.1} color="#aaa" anchorX="center">
          {`${d}м`}
        </Text>
      ))}
    </>
  );
}

export default function UHFLab() {
  const [power, setPower] = useState(500); // Watts
  const [gain, setGain] = useState(10); // directivity coefficient G
  const [towerHeight, setTowerHeight] = useState(30); // meters
  const [measureDist, setMeasureDist] = useState(50); // horizontal distance r
  const [normE, setNormE] = useState(5); // V/m

  // R = √(r² + H²)
  const R = Math.sqrt(measureDist * measureDist + towerHeight * towerHeight);

  // E = √(30 × P × G) × F(Δ) × K / R
  // Simplified: F(Δ)=1 (main lobe), K=1 (no terrain effect)
  const E = Math.sqrt(30 * power * gain) / R;

  // Summation example: if two transmitters
  const safe = E <= normE;

  // Build table: E at various distances
  const distances = [10, 20, 50, 100, 200, 500];
  const tableData = distances.map((r) => {
    const Ri = Math.sqrt(r * r + towerHeight * towerHeight);
    const Ei = Math.sqrt(30 * power * gain) / Ri;
    return { r, R: Ri, E: Ei, safe: Ei <= normE };
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* 3D Scene */}
      <Box sx={{ flex: 1, height: { xs: 350, md: 500 }, borderRadius: 2, overflow: 'hidden' }}>
        <Suspense fallback={<Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
          <SafeCanvas shadows camera={{ position: [3, 4, 10], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <UHFScene
              towerHeight={towerHeight}
              measureDist={measureDist}
              fieldStrength={E}
              normE={normE}
            />
            <OrbitControls enablePan={false} />
            <Environment preset="sunset" />
          </SafeCanvas>
        </Suspense>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, width: { xs: '100%', md: 380 }, flexShrink: 0, maxHeight: 650, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Расчёт поля УВЧ</Typography>

        <Stack spacing={2}>
          <Box>
            <Typography gutterBottom>Мощность P: {power} Вт</Typography>
            <Slider value={power} onChange={(_, v) => setPower(v as number)} min={10} max={5000} step={10} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Коэф. направленности G: {gain}</Typography>
            <Slider value={gain} onChange={(_, v) => setGain(v as number)} min={1} max={100} step={1} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Высота антенны H: {towerHeight} м</Typography>
            <Slider value={towerHeight} onChange={(_, v) => setTowerHeight(v as number)} min={5} max={100} step={5} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Расстояние r: {measureDist} м</Typography>
            <Slider value={measureDist} onChange={(_, v) => setMeasureDist(v as number)} min={5} max={500} step={5} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>ПДУ (E допуст.): {normE} В/м</Typography>
            <Slider value={normE} onChange={(_, v) => setNormE(v as number)} min={1} max={50} step={1} valueLabelDisplay="auto" />
          </Box>

          {/* Results */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Результаты</Typography>
            <Typography variant="body2">R = √(r² + H²) = √({measureDist}² + {towerHeight}²) = {R.toFixed(1)} м</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              E = √(30×P×G) / R
            </Typography>
            <Typography variant="body2">
              E = √(30×{power}×{gain}) / {R.toFixed(1)}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              E = {E.toFixed(2)} В/м
            </Typography>
            <Chip
              label={safe ? `E ≤ ${normE} В/м — безопасно` : `E > ${normE} В/м — опасно!`}
              color={safe ? 'success' : 'error'}
            />
          </Paper>

          {/* Table: E at various distances */}
          <Typography variant="subtitle2">Зависимость E от расстояния:</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>r (м)</TableCell>
                  <TableCell>R (м)</TableCell>
                  <TableCell>E (В/м)</TableCell>
                  <TableCell align="center">Норма</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.r} sx={row.r === measureDist ? { bgcolor: 'action.selected' } : {}}>
                    <TableCell>{row.r}</TableCell>
                    <TableCell>{row.R.toFixed(1)}</TableCell>
                    <TableCell>{row.E.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.safe ? '✓' : '✗'} color={row.safe ? 'success' : 'error'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" color="text.secondary">
            E = (√(30PG) × F(Δ) × K) / R. Здесь F(Δ)=1, K=1.
            Eсум = √(E₁² + E₂² + ... + Eₙ²) для n передатчиков.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
