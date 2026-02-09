import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const GRAVITY = 9.81;

function FallingBox({ dropping, height, onLanded }) {
  const meshRef = useRef();
  const velocity = useRef(0);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (dropping) {
      setLanded(false);
      velocity.current = 0;
      if (meshRef.current) {
        meshRef.current.position.y = height + 0.5;
      }
    }
  }, [dropping, height]);

  useFrame((_, delta) => {
    if (!dropping || landed || !meshRef.current) return;
    velocity.current += GRAVITY * delta;
    meshRef.current.position.y -= velocity.current * delta;
    if (meshRef.current.position.y <= 0.5) {
      meshRef.current.position.y = 0.5;
      setLanded(true);
      onLanded();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, height + 0.5, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff7043" />
    </mesh>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial color="#616161" />
    </mesh>
  );
}

export default function FallingBoxScene() {
  const [dropping, setDropping] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCycle((c) => c + 1);
      setDropping(true);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Canvas shadows camera={{ position: [3, 4, 6], fov: 50 }} style={{ height: '100%' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 3]} intensity={1} castShadow />
      <FallingBox
        key={cycle}
        dropping={dropping}
        height={5}
        onLanded={() => setDropping(false)}
      />
      <Floor />
      <gridHelper args={[12, 12, '#555', '#333']} position={[0, 0.01, 0]} />
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  );
}
