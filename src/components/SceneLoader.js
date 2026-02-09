import React, { Suspense } from 'react';

const sceneComponents = {
  lightSphere: React.lazy(() => import('../scenes/LightSphereScene')),
  shadowScene: React.lazy(() => import('../scenes/ShadowScene')),
  fallingBox: React.lazy(() => import('../scenes/FallingBoxScene')),
  impactScene: React.lazy(() => import('../scenes/ImpactScene')),
};

export default function SceneLoader({ sceneKey }) {
  const SceneComponent = sceneComponents[sceneKey];

  if (!SceneComponent) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        Scene not available
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          Loading 3D scene…
        </div>
      }
    >
      <SceneComponent />
    </Suspense>
  );
}
