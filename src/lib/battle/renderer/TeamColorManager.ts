import { Color } from 'three';

export type TeamId = 'attacker' | 'defender';

export interface TeamColors {
  primary: string;      // 주 색상 (갑옷, 의복)
  secondary: string;    // 보조 색상 (장식)
  accent: string;       // 강조 색상 (깃발, 문양)
  indicator: string;    // 선택/상태 표시용
  fighting: number;     // 전투 중일 때 색상 (Hex)
}

const TEAM_PALETTES: Record<TeamId, TeamColors> = {
  attacker: {
    primary: '#2F4F4F',   // Dark Slate Gray
    secondary: '#4682B4', // Steel Blue
    accent: '#FFD700',    // Gold
    indicator: '#1f4f4f',
    fighting: 0x00bcd4,   // Cyan type
  },
  defender: {
    primary: '#8B0000',   // Dark Red
    secondary: '#CD5C5C', // Indian Red
    accent: '#00FFFF',    // Cyan
    indicator: '#8b1a1a',
    fighting: 0xff5f5f,   // Light Red
  },
};

export class TeamColorManager {
  private static instance: TeamColorManager;
  private palettes: Record<TeamId, TeamColors>;
  private threeColors: Record<TeamId, {
    primary: Color;
    secondary: Color;
    accent: Color;
    indicator: Color;
  }>;

  private constructor() {
    this.palettes = { ...TEAM_PALETTES };
    this.threeColors = {
      attacker: this.createThreeColors(this.palettes.attacker),
      defender: this.createThreeColors(this.palettes.defender),
    };
  }

  public static getInstance(): TeamColorManager {
    if (!TeamColorManager.instance) {
      TeamColorManager.instance = new TeamColorManager();
    }
    return TeamColorManager.instance;
  }

  private createThreeColors(palette: TeamColors) {
    return {
      primary: new Color(palette.primary),
      secondary: new Color(palette.secondary),
      accent: new Color(palette.accent),
      indicator: new Color(palette.indicator),
    };
  }

  public getPalette(teamId: TeamId): TeamColors {
    return this.palettes[teamId];
  }

  public getThreeColor(teamId: TeamId, type: keyof TeamColors): Color {
    if (type === 'fighting') return new Color(this.palettes[teamId].fighting);
    return this.threeColors[teamId][type as keyof typeof this.threeColors[TeamId]];
  }

  public getHexColor(teamId: TeamId, type: keyof TeamColors): number {
    if (type === 'fighting') return this.palettes[teamId].fighting;
    return this.threeColors[teamId][type as keyof typeof this.threeColors[TeamId]].getHex();
  }
}
