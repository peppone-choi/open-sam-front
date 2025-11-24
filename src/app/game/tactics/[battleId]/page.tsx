import TacticalSteeringPanel from '@/components/logh/TacticalSteeringPanel';
import TacticalMap from '@/components/logh/TacticalMap';
import TacticalHUD from '@/components/logh/TacticalHUD';

export default async function BattlePage({ params }: { params: Promise<{ battleId: string }> }) {
  const { battleId } = await params;
  const sessionId = battleId;

  return (
    <div className="w-full h-full relative flex flex-col bg-[#050510]">
      {/* Main RTS View */}
      <div className="flex-1 relative">
        <TacticalMap sessionId={sessionId} tacticalMapId={battleId} />
        
        {/* HUD Overlays */}
        <TacticalHUD battleId={battleId} />
        
        {/* HUD Overlay: Steering Panel (Bottom Left) */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
           <TacticalSteeringPanel />
        </div>
      </div>
    </div>
  );
}
