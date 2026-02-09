import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function MovingLight() {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t * 0.5) * 4;
      lightRef.current.position.y = 4 + Math.sin(t) * 0.5;
    }
  });
  return (
    <spotLight
      ref={lightRef}
      position={[0, 4, 0]}
      angle={0.4}
      penumbra={0.5}
      intensity={2}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
    />
  );
}

function SceneObjects() {
  return (
    <>
      <mesh position={[-1.5, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ef5350" />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
        <meshStandardMaterial color="#66bb6a" />
      </mesh>
      <mesh position={[1.5, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#42a5f5" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#424242" />
      </mesh>
    </>
  );
}

export default function ShadowScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 4, 6], fov: 50 }}
      style={{ height: '100%' }}
    >
      <ambientLight intensity={0.15} />
      <MovingLight />
      <SceneObjects />
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  );
}
