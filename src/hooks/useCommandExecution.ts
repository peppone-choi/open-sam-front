import { useState, useCallback } from 'react';
import { loghApi } from '@/lib/api/logh';
import { useGameStore } from '@/stores/gameStore';
import { CommandType } from '@/types/logh';

// Manual P.26: CP Logic
const CP_COSTS: Record<CommandType, { pcp: number, mcp: number }> = {
  'warp': { pcp: 0, mcp: 20 },
  'move': { pcp: 0, mcp: 10 },
  'attack': { pcp: 0, mcp: 30 },
  'supply': { pcp: 0, mcp: 15 },
  'personnel': { pcp: 20, mcp: 0 },
  'tactics': { pcp: 0, mcp: 5 },
};

export function useCommandExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const { userProfile, updateCP } = useGameStore();

  const execute = useCallback(async (cardId: string, command: CommandType, target?: any) => {
    if (!userProfile) return;
    
    const baseCost = CP_COSTS[command] || { pcp: 0, mcp: 0 };
    let finalPcpCost = baseCost.pcp;
    let finalMcpCost = baseCost.mcp;
    let isSubstitute = false;

    // Check PCP
    if (userProfile.pcp < finalPcpCost) {
      // Try Substitute with MCP (2x)
      const needed = finalPcpCost - userProfile.pcp;
      if (userProfile.mcp >= finalMcpCost + (needed * 2)) {
        finalMcpCost += needed * 2;
        finalPcpCost = userProfile.pcp; // Use all remaining PCP
        isSubstitute = true;
      } else {
        alert(`Insufficient CP. Need PCP: ${baseCost.pcp}`);
        return;
      }
    }

    // Check MCP
    if (userProfile.mcp < finalMcpCost) {
      // Try Substitute with PCP (2x)
      const needed = finalMcpCost - userProfile.mcp;
      if (userProfile.pcp >= finalPcpCost + (needed * 2)) {
        finalPcpCost += needed * 2;
        finalMcpCost = userProfile.mcp; // Use all remaining MCP
        isSubstitute = true;
      } else {
        alert(`Insufficient CP. Need MCP: ${baseCost.mcp}`);
        return;
      }
    }

    // Confirm Substitute
    if (isSubstitute) {
      if (!confirm(`Warning: Insufficient primary CP. Substitute with 2x cost?\nTotal Cost: PCP ${finalPcpCost}, MCP ${finalMcpCost}`)) {
        return;
      }
    }

    setIsExecuting(true);
    try {
      const result = await loghApi.executeCommand(cardId, command, target);
      
      if (result.success) {
        // Deduct calculated CP locally (Backend should validate again)
        updateCP(-finalPcpCost, -finalMcpCost);
        console.log(`Executed ${command}: PCP -${finalPcpCost}, MCP -${finalMcpCost}`);
      } else {
        alert(`FAILURE: ${result.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('Command Transmission Error');
    } finally {
      setIsExecuting(false);
    }
  }, [userProfile, updateCP]);

  return { execute, isExecuting };
}
