import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * LOGH 에셋 API
 * public/assets/logh 폴더의 파일 목록을 반환
 */

const ASSETS_BASE = path.join(process.cwd(), 'public', 'assets', 'logh');

interface AssetInfo {
  name: string;
  path: string;
  size: number;
}

interface AssetsResponse {
  meshes: AssetInfo[];
  textures: AssetInfo[];
  sounds: AssetInfo[];
}

function scanDirectory(dirPath: string, extensions: string[]): AssetInfo[] {
  const results: AssetInfo[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return results;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (extensions.includes(ext)) {
          results.push({
            name: file,
            path: `/assets/logh/${path.basename(dirPath)}/${file}`,
            size: stat.size,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }
  
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  const response: AssetsResponse = {
    meshes: scanDirectory(path.join(ASSETS_BASE, 'meshes'), ['.mesh']),
    textures: scanDirectory(path.join(ASSETS_BASE, 'textures'), ['.dds', '.png', '.tga']),
    sounds: scanDirectory(path.join(ASSETS_BASE, 'sounds'), ['.ogg', '.wav', '.mp3']),
  };
  
  return NextResponse.json(response);
}











