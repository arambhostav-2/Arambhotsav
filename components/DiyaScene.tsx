'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function DiyaMesh() {
  const flame = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (flame.current) {
      const s = flame.current.scale;
      s.set(1 + Math.sin(t * 13) * 0.08, 1 + Math.sin(t * 17) * 0.14, 1);
      (flame.current.material as THREE.MeshBasicMaterial).color.setHSL(0.08 + Math.sin(t * 9) * 0.015, 1, 0.55 + Math.sin(t * 11) * 0.05);
    }
    if (group.current) {
      group.current.rotation.y = t * 0.4;
      group.current.rotation.x = Math.sin(t * 0.4) * 0.06 + state.pointer.y * 0.15;
      group.current.rotation.z = state.pointer.x * 0.1;
    }
  });
  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
        {/* diya bowl */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[1.1, 0.55, 0.55, 32]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <torusGeometry args={[1.02, 0.09, 12, 48]} />
          <meshStandardMaterial color="#f5c451" roughness={0.25} metalness={0.8} emissive="#713f12" emissiveIntensity={0.4} />
        </mesh>
        {/* oil */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshStandardMaterial color="#3f1d05" roughness={0.15} metalness={0.2} />
        </mesh>
        {/* crossed dandiya sticks */}
        <mesh position={[-0.7, 0.5, 0]} rotation={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.06, 0.06, 2.6, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.4} />
        </mesh>
        <mesh position={[0.7, 0.5, 0]} rotation={[0, 0, -0.6]}>
          <cylinderGeometry args={[0.06, 0.06, 2.6, 12]} />
          <meshStandardMaterial color="#4c1d95" roughness={0.4} />
        </mesh>
        {/* flame */}
        <mesh ref={flame} position={[0, 0.55, 0]}>
          <coneGeometry args={[0.22, 0.7, 16]} />
          <meshBasicMaterial color="#ffb020" />
        </mesh>
        <pointLight position={[0, 0.9, 0.4]} intensity={6} distance={6} color="#ff9d2e" />
      </Float>
    </group>
  );
}

export default function DiyaScene() {
  return (
    <div className="w-[280px] h-[280px] md:w-[360px] md:h-[360px]">
      <Canvas camera={{ position: [0, 1.2, 4.2], fov: 45 }} dpr={[1, 1.75]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 3]} intensity={1.1} color="#ffe9a8" />
        <DiyaMesh />
        <ContactShadows position={[0, -0.9, 0]} opacity={0.5} blur={2.5} />
      </Canvas>
    </div>
  );
}
