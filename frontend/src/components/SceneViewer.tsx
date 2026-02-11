import { Suspense } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { Box, CircularProgress } from '@mui/material';
import SafeCanvas from './SafeCanvas';

/* ─── Import all scenes ─── */
import {
  PointLightDemoScene,
  InverseSqLawScene,
  LightingTypesScene,
  StroboscopicScene,
  LuminaireLayoutScene,
  LuminaireCalcScene,
  LampTypesScene,
} from './scenes/LightScenes';

import {
  SoundWavesScene,
  NoiseLevelsScene,
  SoundBarrierScene,
  VibrationDemoScene,
} from './scenes/SoundScenes';

import {
  EMWaveScene,
  EMFShieldScene,
  EMFProtectionScene,
} from './scenes/EMFScenes';

import {
  RadiationTypesScene,
  RadiationShieldingScene,
  AntennaPatternScene,
} from './scenes/RadiationScenes';

/* ─── Scene registry ─── */
const sceneMap: Record<string, React.FC> = {
  // Lab 1 – Освещённость: исследование
  pointLightDemo: PointLightDemoScene,
  inverseSqLaw: InverseSqLawScene,
  lightingTypes: LightingTypesScene,
  stroboscopic: StroboscopicScene,
  // Lab 2 – Освещённость: расчёт
  luminaireLayout: LuminaireLayoutScene,
  luminaireCalc: LuminaireCalcScene,
  lampTypes: LampTypesScene,
  // Lab 3 – Шум и вибрация
  soundWaves: SoundWavesScene,
  noiseLevels: NoiseLevelsScene,
  soundBarrier: SoundBarrierScene,
  vibrationDemo: VibrationDemoScene,
  // Lab 5 – ЭМИ
  emWave: EMWaveScene,
  emfShield: EMFShieldScene,
  emfProtection: EMFProtectionScene,
  // Lab 6 – Радиация и УВЧ
  radiationTypes: RadiationTypesScene,
  radiationShielding: RadiationShieldingScene,
  antennaPattern: AntennaPatternScene,
};

function Loader() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function SceneViewer({ sceneId }: { sceneId: string }) {
  const SceneComponent = sceneMap[sceneId];

  if (!SceneComponent) {
    return (
      <Box sx={{ height: 400, display: 'grid', placeItems: 'center' }}>
        Сцена «{sceneId}» ещё не реализована.
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: { xs: 300, sm: 400, md: 500 }, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
      <Suspense fallback={<Loader />}>
        <SafeCanvas shadows camera={{ position: [6, 5, 6], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <SceneComponent />
          <OrbitControls enablePan={false} />
          <Environment preset="city" />
        </SafeCanvas>
      </Suspense>
    </Box>
  );
}
