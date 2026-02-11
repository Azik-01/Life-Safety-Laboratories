import { useState, useRef, Suspense } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
} from '@mui/material';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import type { Mesh } from 'three';
import SafeCanvas from '../../components/SafeCanvas';

/* ─── 3D scene: room with movable light ─── */
function LabLightScene({
  lightHeight,
  intensity,
  measureDist,
}: {
  lightHeight: number;
  intensity: number;
  measureDist: number;
}) {
  const bulbRef = useRef<Mesh>(null!);
  const measureRef = useRef<Mesh>(null!);

  useFrame(() => {
    if (bulbRef.current) {
      bulbRef.current.position.y = lightHeight;
    }
    if (measureRef.current) {
      measureRef.current.position.x = measureDist;
    }
  });

  const E = intensity / (lightHeight * lightHeight);

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#455a64" />
      </mesh>

      {/* Light source (bulb) */}
      <mesh ref={bulbRef} position={[0, lightHeight, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffeb3b" />
        <pointLight intensity={intensity * 3} castShadow distance={20} color="#fff9c4" />
      </mesh>

      {/* Cable from ceiling */}
      <mesh position={[0, (lightHeight + 5) / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 5 - lightHeight, 8]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Table */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.1, 3]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Table legs */}
      {[[-2.8, -1.3], [-2.8, 1.3], [2.8, -1.3], [2.8, 1.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
      ))}

      {/* Measurement point (luxmeter) */}
      <mesh ref={measureRef} position={[measureDist, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.06, 0.2]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      <Text
        position={[measureDist, 0.7, 0]}
        fontSize={0.2}
        color="#76ff03"
        anchorX="center"
      >
        {`${E.toFixed(0)} лк`}
      </Text>

      {/* Distance markers on table */}
      {[0, 0.5, 1, 1.5, 2, 2.5].map((d) => (
        <Text key={d} position={[d, 0.48, 1.2]} fontSize={0.12} color="#bbb" anchorX="center">
          {`${d.toFixed(1)}м`}
        </Text>
      ))}

      {/* Walls */}
      <mesh position={[0, 2.5, -8]}>
        <boxGeometry args={[16, 5, 0.2]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>
      <mesh position={[-8, 2.5, 0]}>
        <boxGeometry args={[0.2, 5, 16]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>
    </>
  );
}

/* ─── Norms table data ─── */
const norms = [
  { category: 'Точная работа (I разряд)', lux: 500 },
  { category: 'Грубая работа (IV разряд)', lux: 200 },
  { category: 'Общее наблюдение (VIII разряд)', lux: 50 },
  { category: 'Офисное помещение', lux: 300 },
  { category: 'Коридоры', lux: 75 },
];

export default function LightInvestigationLab() {
  const [lightHeight, setLightHeight] = useState(3);
  const [intensity, setIntensity] = useState(1000);
  const [measureDist, setMeasureDist] = useState(0);

  // E = I / r² (r is the distance from light to measurement point)
  const r = Math.sqrt(lightHeight * lightHeight + measureDist * measureDist);
  const E = r > 0 ? intensity / (r * r) : 0;

  // KEO calculation (simulate: outdoor light = 10000 lux)
  const Eoutdoor = 10000;
  const KEO = (E / Eoutdoor) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
      {/* 3D Scene */}
      <Box sx={{ flex: 1, height: { xs: 350, md: 500 }, borderRadius: 2, overflow: 'hidden' }}>
        <Suspense fallback={<Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>}>
          <SafeCanvas shadows camera={{ position: [5, 4, 8], fov: 50 }}>
            <ambientLight intensity={0.1} />
            <LabLightScene lightHeight={lightHeight} intensity={intensity} measureDist={measureDist} />
            <OrbitControls enablePan={false} />
            <Environment preset="warehouse" />
          </SafeCanvas>
        </Suspense>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 3, width: { xs: '100%', md: 360 }, flexShrink: 0, maxHeight: 600, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Управление</Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography gutterBottom>Высота источника: {lightHeight.toFixed(1)} м</Typography>
            <Slider value={lightHeight} onChange={(_, v) => setLightHeight(v as number)} min={0.5} max={4.5} step={0.1} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Сила света (I): {intensity} кд</Typography>
            <Slider value={intensity} onChange={(_, v) => setIntensity(v as number)} min={100} max={5000} step={100} valueLabelDisplay="auto" />
          </Box>

          <Box>
            <Typography gutterBottom>Горизонтальное расстояние: {measureDist.toFixed(1)} м</Typography>
            <Slider value={measureDist} onChange={(_, v) => setMeasureDist(v as number)} min={0} max={3} step={0.1} valueLabelDisplay="auto" />
          </Box>

          {/* Results */}
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Расстояние r = √(h² + d²)</Typography>
            <Typography variant="h5" color="primary" sx={{ my: 1 }}>
              E = {E.toFixed(1)} лк
            </Typography>
            <Typography variant="caption" display="block">
              E = I / r² = {intensity} / {r.toFixed(2)}² = {E.toFixed(1)} лк
            </Typography>
            <Chip
              label={`КЕО = ${KEO.toFixed(2)}%`}
              color={KEO >= 1.5 ? 'success' : 'warning'}
              sx={{ mt: 1 }}
            />
          </Paper>

          {/* Norms comparison */}
          <Typography variant="subtitle2">Нормы освещённости:</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Категория</TableCell>
                  <TableCell align="right">Норма (лк)</TableCell>
                  <TableCell align="center">Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {norms.map((n) => (
                  <TableRow key={n.category}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{n.category}</TableCell>
                    <TableCell align="right">{n.lux}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={E >= n.lux ? '✓' : '✗'}
                        color={E >= n.lux ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>
    </Box>
  );
}
