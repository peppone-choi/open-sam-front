/**
 * Sammo 게임 커맨드 실행 훅
 * Vue 커맨드 실행 흐름 대응
 */

'use client';

import { useCallback, useState } from 'react';
import { SammoAPI } from '@/lib/api/sammo';

export interface SammoCommandArg {
  [key: string]: any;
}

export interface SammoCommandResult {
  success: boolean;
  result?: boolean;
  brief?: string;
  reason?: string;
  message?: string;
}

interface ExecuteCommandParams {
  /** 커맨드 액션 코드 (예: 'che_순찰', 'che_징병') */
  action: string;
  /** 커맨드 인자 */
  arg?: SammoCommandArg;
  /** 예약할 턴 목록 (개인 턴용) */
  turnList?: number[];
  /** 서버/세션 ID */
  serverID?: string;
  /** 장수 ID (수뇌부 대행 시) */
  generalId?: number;
  /** 수뇌부 커맨드 여부 */
  isChief?: boolean;
}

interface ExecuteBulkCommandParams {
  commands: Array<{
    action: string;
    arg?: SammoCommandArg;
    turnList: number[];
  }>;
  serverID?: string;
  generalId?: number;
  isChief?: boolean;
}

interface UseSammoCommandExecutionOptions {
  /** 서버/세션 ID */
  serverID?: string;
  /** 실행 후 콜백 */
  onSuccess?: (result: SammoCommandResult) => void;
  /** 에러 콜백 */
  onError?: (error: Error) => void;
}

export function useSammoCommandExecution(options: UseSammoCommandExecutionOptions = {}) {
  const { serverID: defaultServerID, onSuccess, onError } = options;
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<SammoCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 개인 커맨드 예약
   */
  const reserveCommand = useCallback(
    async (params: ExecuteCommandParams): Promise<SammoCommandResult> => {
      const { action, arg, turnList, serverID, generalId } = params;
      
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.CommandReserveCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          turn_idx: turnList?.[0],
          action,
          arg,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          reason: result.reason,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        } else {
          const err = new Error(commandResult.reason || commandResult.message || '커맨드 예약 실패');
          setError(err.message);
          onError?.(err);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '커맨드 실행 중 오류 발생';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 개인 커맨드 일괄 예약
   */
  const reserveBulkCommand = useCallback(
    async (params: ExecuteBulkCommandParams): Promise<SammoCommandResult> => {
      const { commands, serverID, generalId } = params;
      
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.CommandReserveBulkCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId!,
          commands: commands.map((cmd) => ({
            turnList: cmd.turnList,
            action: cmd.action,
            arg: cmd.arg || {},
          })),
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          reason: result.reason,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        } else {
          const err = new Error(commandResult.reason || '일괄 예약 실패');
          setError(err.message);
          onError?.(err);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '일괄 예약 중 오류 발생';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 수뇌부(국가) 커맨드 예약
   */
  const reserveNationCommand = useCallback(
    async (params: ExecuteCommandParams): Promise<SammoCommandResult> => {
      const { action, arg, turnList, serverID, generalId } = params;
      
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.NationCommandReserveCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          action,
          turnList: turnList || [],
          arg,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          brief: result.brief,
          reason: result.reason,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        } else {
          const err = new Error(commandResult.reason || commandResult.message || '수뇌부 커맨드 예약 실패');
          setError(err.message);
          onError?.(err);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '수뇌부 커맨드 실행 중 오류 발생';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 수뇌부 커맨드 일괄 예약
   */
  const reserveNationBulkCommand = useCallback(
    async (params: ExecuteBulkCommandParams): Promise<SammoCommandResult> => {
      const { commands, serverID, generalId } = params;
      
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.NationCommandReserveBulkCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          commands: commands.map((cmd) => ({
            turnList: cmd.turnList,
            action: cmd.action,
            arg: cmd.arg || {},
          })),
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          reason: result.reason,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        } else {
          const err = new Error(commandResult.reason || commandResult.message || '수뇌부 일괄 예약 실패');
          setError(err.message);
          onError?.(err);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '수뇌부 일괄 예약 중 오류 발생';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 커맨드 밀기 (개인)
   */
  const pushCommand = useCallback(
    async (turnCnt: number, serverID?: string, generalId?: number): Promise<SammoCommandResult> => {
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.PushCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          turn_cnt: turnCnt,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '커맨드 밀기 실패';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 커맨드 당기기 (개인)
   */
  const pullCommand = useCallback(
    async (turnCnt: number, serverID?: string, generalId?: number): Promise<SammoCommandResult> => {
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.PullCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          turn_cnt: turnCnt,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '커맨드 당기기 실패';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 수뇌부 커맨드 밀기
   */
  const pushNationCommand = useCallback(
    async (amount: number, serverID?: string, generalId?: number): Promise<SammoCommandResult> => {
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.NationCommandPushCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          amount,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '수뇌부 커맨드 밀기 실패';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 수뇌부 커맨드 반복
   */
  const repeatNationCommand = useCallback(
    async (amount: number, serverID?: string, generalId?: number): Promise<SammoCommandResult> => {
      setIsExecuting(true);
      setError(null);
      
      try {
        const result = await SammoAPI.NationCommandRepeatCommand({
          serverID: serverID || defaultServerID,
          general_id: generalId,
          amount,
        });

        const commandResult: SammoCommandResult = {
          success: result.success,
          result: result.result,
          message: result.message,
        };

        setLastResult(commandResult);
        
        if (commandResult.success) {
          onSuccess?.(commandResult);
        }

        return commandResult;
      } catch (err: any) {
        const errorMessage = err.message || '수뇌부 커맨드 반복 실패';
        setError(errorMessage);
        onError?.(err);
        
        return {
          success: false,
          reason: errorMessage,
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [defaultServerID, onSuccess, onError]
  );

  /**
   * 통합 실행 함수 (isChief에 따라 자동 분기)
   */
  const execute = useCallback(
    async (params: ExecuteCommandParams): Promise<SammoCommandResult> => {
      if (params.isChief) {
        return reserveNationCommand(params);
      }
      return reserveCommand(params);
    },
    [reserveCommand, reserveNationCommand]
  );

  /**
   * 통합 일괄 실행 함수
   */
  const executeBulk = useCallback(
    async (params: ExecuteBulkCommandParams): Promise<SammoCommandResult> => {
      if (params.isChief) {
        return reserveNationBulkCommand(params);
      }
      return reserveBulkCommand(params);
    },
    [reserveBulkCommand, reserveNationBulkCommand]
  );

  return {
    // 상태
    isExecuting,
    lastResult,
    error,
    
    // 개인 커맨드
    reserveCommand,
    reserveBulkCommand,
    pushCommand,
    pullCommand,
    
    // 수뇌부 커맨드
    reserveNationCommand,
    reserveNationBulkCommand,
    pushNationCommand,
    repeatNationCommand,
    
    // 통합 함수
    execute,
    executeBulk,
  };
}




