'use client';

import { useEffect, useState } from 'react';
import { SammoAPI } from '@/lib/api/sammo';
import { getUnitDataFromStore, setUnitDataFromApi, RawUnitDefinition } from '@/stores/unitStore';

export function useUnitConst(): Record<string, RawUnitDefinition> | null {
  const [unitConst, setUnitConst] = useState<Record<string, RawUnitDefinition> | null>(() => getUnitDataFromStore());

  useEffect(() => {
    if (unitConst) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await SammoAPI.GlobalGetConst();
        if (!result?.result || !result.data?.gameUnitConst) {
          return;
        }
        setUnitDataFromApi(result.data.gameUnitConst);
        if (!cancelled) {
          setUnitConst(result.data.gameUnitConst);
        }
      } catch (error) {
        console.warn('[useUnitConst] Failed to load unit constants', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [unitConst]);

  return unitConst;
}
