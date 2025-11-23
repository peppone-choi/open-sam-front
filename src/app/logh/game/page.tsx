import type { Metadata } from 'next';
import GameScreen from './GameScreen';

export const metadata: Metadata = {
  title: '은하영웅전설 전략 사령부',
  description: 'LOGH 전략/전술 통합 UI 대시보드',
};

export default function LoghGamePage() {
  return <GameScreen />;
}
