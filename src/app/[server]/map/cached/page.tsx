'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SammoAPI } from '@/lib/api/sammo';
import MapViewer from '@/components/game/MapViewer';
import { cn } from '@/lib/utils';

export default function CachedMapPage() {
  const params = useParams();
  const serverID = params?.server as string;

  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, [serverID]);

  async function loadMapData() {
    try {
      setLoading(true);
      const result = await SammoAPI.GlobalGetMap({ 
        serverID,
        neutralView: 0,
        showMe: 1,
      });
      if (result.result) {
        setMapData(result);
      }
    } catch (err) {
      console.error(err);
      alert('지도 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 font-sans flex flex-col">
      <h1 className="text-2xl font-bold text-white mb-4 text-center">최근 지도 (Cached)</h1>
      
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : mapData ? (
        <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/60">
          <MapViewer
            serverID={serverID}
            mapData={mapData}
            onCityClick={() => {}}
            isFullWidth={true}
          />
        </div>
      ) : (
        <div className="flex-1 flex justify-center items-center text-gray-500">
          지도 데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
