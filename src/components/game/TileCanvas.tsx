'use client';

import React, { useEffect, useMemo, useRef } from 'react';


export type TileType = 'grass' | 'forest' | 'water' | 'mountain' | 'road' | 'city' | string;

export interface TileCell {
  type: TileType;
  variant?: number;
  elevation?: number;
  decoration?: string | null;
}

export interface TileMapData {
  columns: number;
  rows: number;
  tileSize?: number;
  tiles: TileCell[];
}

interface TileCanvasProps {
  tileMap: TileMapData;
  width?: number;
  height?: number;
  className?: string;
}

const DEFAULT_TILE_SIZE = 32;

export default function TileCanvas({ tileMap, width, height, className }: TileCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderSize = useMemo(() => {
    const logicalWidth = tileMap.columns * (tileMap.tileSize ?? DEFAULT_TILE_SIZE);
    const logicalHeight = tileMap.rows * (tileMap.tileSize ?? DEFAULT_TILE_SIZE);

    return {
      width: width ?? logicalWidth,
      height: height ?? logicalHeight,
      logicalWidth,
      logicalHeight,
    };
  }, [tileMap, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = renderSize.width * devicePixelRatio;
    canvas.height = renderSize.height * devicePixelRatio;

    if (ctx.resetTransform) {
      ctx.resetTransform();
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, renderSize.width, renderSize.height);

    const tileSize = tileMap.tileSize ?? DEFAULT_TILE_SIZE;
    const scaleX = renderSize.width / (tileMap.columns * tileSize);
    const scaleY = renderSize.height / (tileMap.rows * tileSize);

    for (let index = 0; index < tileMap.tiles.length; index += 1) {
      const tile = tileMap.tiles[index];
      if (!tile) continue;
      const tileX = index % tileMap.columns;
      const tileY = Math.floor(index / tileMap.columns);

      drawTopdownTile(ctx, tile, {
        x: tileX,
        y: tileY,
        tileSize,
        scaleX,
        scaleY,
      });
    }
  }, [tileMap, renderSize]);

  return <canvas ref={canvasRef} className={className} style={{ width: renderSize.width, height: renderSize.height }} />;
}

interface DrawContext {
  x: number;
  y: number;
  tileSize: number;
  scaleX: number;
  scaleY: number;
}

function drawTopdownTile(
  ctx: CanvasRenderingContext2D,
  tile: TileCell,
  { x, y, tileSize, scaleX, scaleY }: DrawContext,
) {
  const pixelX = x * tileSize * scaleX;
  const pixelY = y * tileSize * scaleY;
  const width = tileSize * scaleX;
  const height = tileSize * scaleY;

  const seed = hashCoord(x, y, tile.variant ?? 0);

  switch (tile.type) {
    case 'forest':
      drawGrassBase(ctx, pixelX, pixelY, width, height, seed);
      drawTrees(ctx, pixelX, pixelY, width, height, seed);
      break;
    case 'water':
      drawWater(ctx, pixelX, pixelY, width, height, seed);
      break;
    case 'mountain':
      drawMountain(ctx, pixelX, pixelY, width, height, seed);
      break;
    case 'road':
      drawGrassBase(ctx, pixelX, pixelY, width, height, seed, true);
      drawRoad(ctx, pixelX, pixelY, width, height, seed);
      break;
    case 'city':
      drawCity(ctx, pixelX, pixelY, width, height, seed);
      break;
    case 'grass':
    default:
      drawGrassBase(ctx, pixelX, pixelY, width, height, seed);
      break;
  }
}

function drawGrassBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number,
  subdued = false,
) {
  const baseHue = subdued ? 100 : 110;
  ctx.fillStyle = `hsl(${baseHue}, 35%, ${subdued ? 55 : 50}%)`;
  ctx.fillRect(x, y, width, height);

  const dots = 60;
  for (let i = 0; i < dots; i += 1) {
    const noiseX = x + (random(seed + i * 7) * width);
    const noiseY = y + (random(seed + i * 13) * height);
    ctx.fillStyle = `hsl(${baseHue + (random(seed + i * 17) * 20 - 10)}, 40%, ${48 + random(seed + i * 19) * 8}%)`;
    ctx.fillRect(noiseX, noiseY, Math.max(1, width * 0.02), Math.max(1, height * 0.02));
  }
}

function drawTrees(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, seed: number) {
  const treeCount = 1 + Math.floor(random(seed) * 3);
  for (let i = 0; i < treeCount; i += 1) {
    const posX = x + random(seed + i * 3) * width * 0.8 + width * 0.1;
    const posY = y + random(seed + i * 5) * height * 0.6 + height * 0.2;
    const trunkWidth = Math.max(1.5, width * 0.08);
    const trunkHeight = Math.max(3, height * 0.25);
    ctx.fillStyle = '#5b3a1c';
    ctx.fillRect(posX, posY, trunkWidth, trunkHeight);

    ctx.fillStyle = '#2f6d2b';
    ctx.beginPath();
    ctx.ellipse(posX + trunkWidth / 2, posY, width * 0.18, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, seed: number) {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, '#1f4a86');
  gradient.addColorStop(1, '#1c6fb8');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  const ripples = 25;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = Math.max(1, height * 0.02);
  for (let i = 0; i < ripples; i += 1) {
    const startX = x + random(seed + i * 11) * width;
    const startY = y + random(seed + i * 13) * height;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + width * 0.3, startY + height * 0.05);
    ctx.stroke();
  }
}

function drawMountain(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, seed: number) {
  const baseColor = '#6d5c4c';
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#4a3b30';
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.1);
  ctx.lineTo(x + width * 0.9, y + height * 0.9);
  ctx.lineTo(x + width * 0.1, y + height * 0.9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(x + width * 0.5, y + height * 0.1);
  ctx.lineTo(x + width * 0.7, y + height * 0.5);
  ctx.lineTo(x + width * 0.5, y + height * 0.5);
  ctx.closePath();
  ctx.fill();

  const cracks = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = Math.max(1, width * 0.03);
  for (let i = 0; i < cracks; i += 1) {
    const startX = x + width * 0.2 + random(seed + i * 3) * width * 0.6;
    ctx.beginPath();
    ctx.moveTo(startX, y + height * 0.4);
    ctx.lineTo(startX + width * 0.1, y + height * 0.8);
    ctx.stroke();
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, seed: number) {
  ctx.fillStyle = '#c9b28a';
  ctx.fillRect(x + width * 0.1, y + height * 0.4, width * 0.8, height * 0.2);

  ctx.strokeStyle = '#a68d62';
  ctx.lineWidth = Math.max(1, height * 0.05);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.12, y + height * (0.45 + random(seed) * 0.1));
  ctx.lineTo(x + width * 0.88, y + height * (0.55 + random(seed + 2) * 0.1));
  ctx.stroke();
}

function drawCity(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, seed: number) {
  ctx.fillStyle = '#d5cdc3';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#b8afa4';
  ctx.fillRect(x + width * 0.15, y + height * 0.2, width * 0.7, height * 0.6);

  ctx.strokeStyle = '#8b7f72';
  ctx.lineWidth = Math.max(1, width * 0.05);
  ctx.strokeRect(x + width * 0.15, y + height * 0.2, width * 0.7, height * 0.6);

  const towerCount = 2 + Math.floor(random(seed) * 2);
  for (let i = 0; i < towerCount; i += 1) {
    const towerX = x + width * (0.2 + i * 0.3);
    ctx.fillStyle = '#91867a';
    ctx.fillRect(towerX, y + height * 0.15, width * 0.1, height * 0.35);
    ctx.fillStyle = '#6d6257';
    ctx.fillRect(towerX + width * 0.02, y + height * 0.17, width * 0.06, height * 0.15);
  }
}

function hashCoord(x: number, y: number, seed = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 982451653;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

function random(seed: number): number {
  const s = Math.sin(seed + 1) * 10000;
  return s - Math.floor(s);
}
