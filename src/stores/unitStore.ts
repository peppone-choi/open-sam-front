export type RawUnitDefinition = {
  id: number;
  type: string;
  name: string;
  cost?: {
    gold?: number;
    rice?: number;
  };
  stats?: {
    offense?: number;
    defense?: number;
    defenseRange?: number;
    attackRange?: number;
    speed?: number;
    avoid?: number;
    magic?: number;
    tech?: number;
  };
  requirements?: {
    year?: number;
    regions?: string[];
    cities?: string[];
  };
  attacks?: Record<string, number>;
  defenses?: Record<string, number>;
  description?: string[];
  constraints?: Array<{ type: string; value?: any }>;
  skills?: {
    init?: any;
    phase?: any;
    actions?: any;
  };
};

let unitMap: Record<string, RawUnitDefinition> | null = null;

export function setUnitDataFromApi(units: Record<string, RawUnitDefinition> | undefined | null): void {
  if (!units) {
    return;
  }
  unitMap = units;
}

export function getUnitDataFromStore(): Record<string, RawUnitDefinition> | null {
  return unitMap;
}
