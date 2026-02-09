import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const GRAVITY = 9.81;

function FallingBox({ dropping, height, mass, onLanded }) {
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

  const scale = 0.5 + mass * 0.1;

  return (
    <mesh ref={meshRef} position={[0, height + 0.5, 0]} castShadow>
      <boxGeometry args={[scale, scale, scale]} />
      <meshStandardMaterial color="#ff7043" />
    </mesh>
  );
}

function Particles({ active }) {
  const groupRef = useRef();
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      ),
      speed: 1 + Math.random() * 2,
    }));
  }, []);

  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;
    elapsed.current += delta;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.addScaledVector(p.dir, delta * p.speed * 0.3);
      child.material.opacity = Math.max(0, 1 - elapsed.current * 1.5);
    });
  });

  useEffect(() => {
    elapsed.current = 0;
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        child.position.set(0, 0.5, 0);
        child.material.opacity = 1;
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i} position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffab40" transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

function Room() {
  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#546e7a" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
      {/* Shelf */}
      <mesh position={[0, 3, -3]}>
        <boxGeometry args={[3, 0.15, 1]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
      {/* Shelf bracket left */}
      <mesh position={[-1.2, 2, -3]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
      {/* Shelf bracket right */}
      <mesh position={[1.2, 2, -3]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshStandardMaterial color="#6d4c41" />
      </mesh>
    </>
  );
}

function EnergyDisplay({ energy, hazardLevel }) {
  return (
    <Text
      position={[0, 4.5, 0]}
      fontSize={0.3}
      color="#ffffff"
      anchorX="center"
      anchorY="middle"
    >
      {energy > 0
        ? `KE: ${energy.toFixed(1)} J — Hazard: ${hazardLevel}`
        : 'Set parameters and drop the object'}
    </Text>
  );
}

export default function LabScene({ height, mass, dropping, onLanded, energy, hazardLevel }) {
  const [showParticles, setShowParticles] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (dropping) {
      setShowParticles(false);
      setCycle((c) => c + 1);
    }
  }, [dropping]);

  const handleLanded = () => {
    setShowParticles(true);
    onLanded();
  };

  return (
    <Canvas shadows camera={{ position: [5, 4, 8], fov: 50 }} style={{ height: '100%' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 5, 2]} intensity={0.5} color="#90caf9" />
      <Room />
      <FallingBox
        key={cycle}
        dropping={dropping}
        height={height}
        mass={mass}
        onLanded={handleLanded}
      />
      <Particles key={cycle} active={showParticles} />
      <EnergyDisplay energy={energy} hazardLevel={hazardLevel} />
      <OrbitControls enableZoom enablePan />
    </Canvas>
  );
}
