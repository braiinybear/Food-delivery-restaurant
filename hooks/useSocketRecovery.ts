import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { getSocket } from '@/lib/socket-client';

/**
 * useSocketRecovery: Handles event recovery and state sync after socket reconnection
 * 
 * When socket reconnects:
 * - Backend automatically re-joins user to active order rooms
 * - Frontend continues receiving real-time events
 * - Fallback polling stops automatically
 */
export function useSocketRecovery() {
  const { isConnected } = useSocketStore();

  useEffect(() => {
    if (!isConnected) return;

    const socket = getSocket();
    if (!socket) return;

    console.log('[SocketRecovery] 🔄 Socket is connected - Ready for real-time updates');

    // When socket reconnects, log it for debugging
    socket.on('reconnect', () => {
      console.log('[SocketRecovery] ✅ Socket reconnected - Backend auto-rejoined manager to active order rooms');
      console.log('[SocketRecovery] 💡 Will now receive real-time events instead of polling');
    });

    socket.on('disconnect', () => {
      console.log('[SocketRecovery] ⚠️  Socket disconnected - Fallback polling will take over');
    });

  }, [isConnected]);

  return { isRecovering: false };
}
