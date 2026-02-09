import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function MultiBox({ index, height, delay }) {
  const meshRef = useRef();
  const velocity = useRef(0);
  const [active, setActive] = useState(false);
  const [landed, setLanded] = useState(false);
  const elapsed = useRef(0);

  const x = (index - 1) * 2;

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < delay) return;
    if (!active) setActive(true);
    if (landed || !meshRef.current) return;
    velocity.current += 9.81 * delta;
    meshRef.current.position.y -= velocity.current * delta;
    if (meshRef.current.position.y <= 0.5) {
      meshRef.current.position.y = 0.5;
      setLanded(true);
    }
  });

  const colors = ['#ef5350', '#66bb6a', '#42a5f5'];

  return (
    <mesh ref={meshRef} position={[x, height + 0.5, 0]} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color={colors[index] || '#ff7043'} />
    </mesh>
  );
}

export default function ImpactScene() {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCycle((c) => c + 1), 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Canvas shadows camera={{ position: [0, 5, 8], fov: 50 }} style={{ height: '100%' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>
      <MultiBox key={`${cycle}-0`} index={0} height={3} delay={0} />
      <MultiBox key={`${cycle}-1`} index={1} height={5} delay={0.5} />
      <MultiBox key={`${cycle}-2`} index={2} height={7} delay={1.0} />
      <gridHelper args={[12, 12, '#555', '#333']} position={[0, 0.01, 0]} />
      <OrbitControls enableZoom enablePan={false} />
    </Canvas>
  );
}
