import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { parseCookieBlob } from './axios';
import { useSocketStore } from '@/store/useSocketStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const BETTER_AUTH_COOKIE_KEY = 'better-auth_cookie';

let socket: Socket | null = null;

export async function initSocket(): Promise<Socket> {
  console.log('[Socket] === INIT START ===');
  
  if (socket && socket.connected) {
    console.log('[Socket] ✅ Socket already connected, returning existing');
    return socket;
  }

  try {
    console.log('[Socket] 🔐 Getting Better Auth cookie...');
    const cookieBlob = await SecureStore.getItemAsync(BETTER_AUTH_COOKIE_KEY);
    console.log('[Socket] 🔐 Cookie blob retrieved:', !!cookieBlob);
    
    const cookieHeader = parseCookieBlob(cookieBlob);
    console.log('[Socket] 🔐 Cookie header parsed:', !!cookieHeader);

    console.log('[Socket] 🌐 Connecting to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      extraHeaders: {
        Cookie: cookieHeader,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 15,
      transports: ['websocket', 'polling'],
    });

    // ✅ CONNECTION EVENT - Update store immediately
    socket.on('connect', () => {
      console.log('\n🟢 [Socket] Connected:', socket?.id);
      useSocketStore.setState({ isConnected: true, connectionError: null });
      console.log('[Socket] ✅ Store updated: isConnected = true');
    });

    // ✅ DISCONNECTION EVENT - Update store
    socket.on('disconnect', (reason) => {
      console.log('\n🔴 [Socket] Disconnected - Reason:', reason);
      useSocketStore.setState({ isConnected: false, connectionError: reason });
      console.log('[Socket] ✅ Store updated: isConnected = false');
      console.log('[Socket] ℹ️  Fallback polling will now activate');
    });

    // ✅ RECONNECTION EVENT - Update store
    socket.on('reconnect', () => {
      console.log('\n🟢 [Socket] Reconnected!');
      useSocketStore.setState({ isConnected: true, connectionError: null });
      console.log('[Socket] ✅ Store updated: isConnected = true (reconnected)');
    });

    // ✅ CONNECTION ERROR
    socket.on('connect_error', (error) => {
      console.log('\n🔴 [Socket] Connection Error:', error?.message || error);
      useSocketStore.setState({ 
        isConnected: false,
        connectionError: error?.message || 'Connection error'
      });
    });

    console.log('[Socket] === INIT COMPLETE - Socket object created ===\n');
    return socket;
  } catch (error) {
    console.error('\n❌ [Socket] Init Error:', error);
    console.error('[Socket] Error type:', error instanceof Error ? error.message : 'Unknown');
    throw error;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Try to reconnect if socket is not connected
 * Called when app resumes from background
 */
export function reconnectSocketIfNeeded(): void {
  if (socket) {
    if (!socket.connected) {
      console.log('[Socket] 🔌 Attempting to reconnect (app resumed from background)');
      socket.connect();
    } else {
      console.log('[Socket] ✅ Socket already connected');
    }
  } else {
    console.log('[Socket] ⚠️  Socket not initialized yet');
  }
}
