'use client';

import React from 'react';
import { TROOP_ICONS, BATTLE_VOXELS, TERRAIN_TILES, TACTICAL_OBJECTS } from '@/constants/assets';

export default function AssetGalleryPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Asset Gallery</h1>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Troop Icons (2D UI)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(TROOP_ICONS).map(([key, path]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded mb-2 flex items-center justify-center overflow-hidden">
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
