import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function AnimatedLight() {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.position.x = Math.sin(t) * 3;
      lightRef.current.position.z = Math.cos(t) * 3;
      lightRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
    }
  });
  return <pointLight ref={lightRef} position={[3, 2, 0]} color="#ffffcc" intensity={1.5} />;
}

function Sphere() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#4fc3f7" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export default function LightSphereScene() {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }} style={{ height: '100%' }}>
      <ambientLight intensity={0.2} />
      <AnimatedLight />
      <Sphere />
      <gridHelper args={[10, 10, '#555', '#333']} />
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  );
}
