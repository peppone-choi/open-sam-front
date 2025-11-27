'use client';

import React from 'react';
import { UNIT_ASSETS, TERRAIN_TILES, TACTICAL_OBJECTS } from '@/constants/assets';
// @ts-ignore - Dynamic import for optional component
import VoxelViewer from '@/components/game/VoxelViewer';

// Fallback for optional BATTLE_VOXELS
const BATTLE_VOXELS: Record<string, string> = {};

export default function AssetGalleryPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Asset Gallery</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Troop Assets (ID Mapped)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {Object.entries(UNIT_ASSETS).map(([id, assets]) => (
                        <div key={id} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center gap-3">
                            <div className="flex gap-2">
                                {/* Icon */}
                                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center overflow-hidden border border-white/10" title="2D Icon">
                                    <img
                                        src={assets.icon}
                                        alt={`Icon ${id}`}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerText = 'ICON';
                                        }}
                                    />
                                </div>
                                {/* Voxel */}
                                <div className="w-12 h-12 flex items-center justify-center" title="3D Voxel">
                                    <VoxelViewer imageUrl={assets.icon} size={48} />
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono text-center">ID: {id}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Battle Voxels (Isometric)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(BATTLE_VOXELS).map(([key, path]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-700/50 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                                {/* Isometric grid background hint */}
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'linear-gradient(30deg, #444 1px, transparent 1px), linear-gradient(150deg, #444 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>
                                <img
                                    src={path}
                                    alt={key}
                                    className="w-full h-full object-contain relative z-10"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML += '<span class="text-xs text-red-500">MISSING</span>';
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-mono text-center">{key}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Terrain Tiles</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(TERRAIN_TILES).map(([key, path]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-700/50 rounded mb-2 flex items-center justify-center overflow-hidden">
                                <img
                                    src={path}
                                    alt={key}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerText = 'MISSING';
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-mono text-center">{key}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Tactical Objects</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(TACTICAL_OBJECTS).map(([key, path]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                            <div className="w-24 h-24 bg-gray-700/50 rounded mb-2 flex items-center justify-center overflow-hidden">
                                <img
                                    src={path}
                                    alt={key}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerText = 'MISSING';
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-400 font-mono text-center">{key}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
