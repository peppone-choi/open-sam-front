// @ts-nocheck - Three.js/R3F JSX types require additional setup
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

interface VoxelViewerProps {
    imageUrl: string;
    size?: number;
}

function VoxelModel({ imageUrl }: { imageUrl: string }) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const [voxels, setVoxels] = useState<{ x: number; y: number; z: number; color: string }[]>([]);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Limit resolution for performance
            const maxSize = 32;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const newVoxels = [];

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a > 128) { // Only opaque pixels
                        // Invert Y to match 3D coordinate system
                        newVoxels.push({
                            x: x - width / 2,
                            y: (height - y) - height / 2,
                            z: 0, // Flat 2D extrusion for now, can be expanded
                            color: `rgb(${r},${g},${b})`
                        });
                    }
                }
            }
            setVoxels(newVoxels);
        };
    }, [imageUrl]);

    useEffect(() => {
        if (!meshRef.current || voxels.length === 0) return;

        const tempObject = new THREE.Object3D();
        const tempColor = new THREE.Color();

        voxels.forEach((voxel, i) => {
            tempObject.position.set(voxel.x, voxel.y, voxel.z);
            tempObject.updateMatrix();
            meshRef.current!.setMatrixAt(i, tempObject.matrix);

            tempColor.set(voxel.color);
            meshRef.current!.setColorAt(i, tempColor);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [voxels]);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.y += 0.01;
        }
    });

    if (voxels.length === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, voxels.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
}

export default function VoxelViewer({ imageUrl, size = 128 }: VoxelViewerProps) {
    return (
        <div style={{ width: size, height: size }} className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <Canvas camera={{ position: [0, 0, 40], fov: 50 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} />
                <Center>
                    <VoxelModel imageUrl={imageUrl} />
                </Center>
                <OrbitControls autoRotate autoRotateSpeed={4} enableZoom={false} />
            </Canvas>
        </div>
    );
}
