import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function Globe({ weatherMood, isDay }: { weatherMood: string, isDay: number }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Instead of fetching 4k textures which might fail or take too long, we use standard procedural materials 
  // with a beautiful globe-like look.
  
  useFrame((state) => {
    const isWindy = weatherMood === 'wind';
    const speedMultiplier = isWindy ? 3 : 1;
    if (earthRef.current) earthRef.current.rotation.y = state.clock.elapsedTime * 0.05 * speedMultiplier;
    if (cloudsRef.current) cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.07 * speedMultiplier;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y = state.clock.elapsedTime * 0.05 * speedMultiplier;
    
    if (isWindy && earthRef.current && cloudsRef.current && atmosphereRef.current) {
        earthRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        cloudsRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        atmosphereRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    } else if (earthRef.current && cloudsRef.current && atmosphereRef.current) {
        earthRef.current.position.x = 0;
        cloudsRef.current.position.x = 0;
        atmosphereRef.current.position.x = 0;
    }
  });

  const baseColor = isDay ? '#1E3A8A' : '#0B1120';
  const emissiveColor = isDay ? '#3B82F6' : '#1D4ED8';

  return (
    <group>
      {/* Earth Body */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial 
          color={baseColor}
          roughness={0.6}
          metalness={0.2}
          bumpScale={0.015}
        />
      </Sphere>

      {/* Abstract procedural clouds */}
      <Sphere ref={cloudsRef} args={[2.02, 64, 64]}>
        <MeshDistortMaterial
          color={'#ffffff'}
          transparent
          opacity={0.3}
          distort={0.4}
          speed={1}
          roughness={1}
        />
      </Sphere>

      {/* Atmosphere Glow */}
      <Sphere ref={atmosphereRef} args={[2.15, 64, 64]}>
        <meshBasicMaterial 
          color={emissiveColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}

export function SnowParticles() {
  const count = 500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.position.y -= 0.02;
      if (pointsRef.current.position.y < -5) {
        pointsRef.current.position.y = 5;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export function RainParticles() {
  const count = 800;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.position.y -= 0.15;
      if (pointsRef.current.position.y < -5) {
        pointsRef.current.position.y = 5;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#93C5FD" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export function WindParticles() {
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.position.x += 0.05;
      pointsRef.current.position.y += Math.sin(state.clock.elapsedTime * 5) * 0.01;
      if (pointsRef.current.position.x > 5) {
        pointsRef.current.position.x = -5;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

export default function WeatherScene({ weatherMood, isDay }: { weatherMood: string, isDay: number }) {
  return (
    <>
      <ambientLight intensity={isDay ? 0.4 : 0.1} />
      <directionalLight position={isDay ? [5, 5, 5] : [-5, 5, -5]} intensity={isDay ? 1.5 : 0.5} color={isDay ? "#ffffff" : "#a5b4fc"} />
      <pointLight position={[0, -2, 4]} intensity={0.5} color="#3b82f6" />
      
      <Globe weatherMood={weatherMood} isDay={isDay} />
      
      {weatherMood === 'rain' && <RainParticles />}
      {weatherMood === 'storm' && <RainParticles />}
      {weatherMood === 'snow' && <SnowParticles />}
      {weatherMood === 'wind' && <WindParticles />}
      {(weatherMood === 'sunny' || weatherMood === 'clear') && isDay === 1 && (
        <directionalLight position={[10, 10, 5]} intensity={1} color="#fbbf24" />
      )}
    </>
  );
}
