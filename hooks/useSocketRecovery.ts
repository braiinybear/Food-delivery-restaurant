import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSocketStore } from '@/store/useSocketStore';
import { getSocket, reconnectSocketIfNeeded } from '@/lib/socket-client';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. AppState listener for background synchronization
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[SocketRecovery] 🌅 App has come to the foreground');
        
        // Force a reconnection check
        reconnectSocketIfNeeded();

        // Immediately refresh orders to pull anything missed while in background
        console.log('[SocketRecovery] 🔄 Triggering refreshing order queries...');
        queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

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
