import { initSocket, getSocket } from "@/lib/socket-client";
import { useSocketStore } from "@/store/useSocketStore";
import { AppUser } from "@/types/user";
import { useEffect, ReactNode } from "react";
import { useSocketRestaurantOrders } from "@/hooks/useSocketOrders";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import { useSocketRecovery } from "@/hooks/useSocketRecovery";

interface SocketProviderProps {
  children: ReactNode;
  user: AppUser | undefined;
}

/**
 * SocketProvider: Manages socket lifecycle for restaurant app.
 */
export function SocketProvider({ children, user }: SocketProviderProps) {
  const { setConnected, setConnectionError } = useSocketStore();

  useSocketRestaurantOrders();

  const { isPolling } = useOrderPolling();
  if (isPolling) {
    console.log("[SocketProvider] Fallback polling is active");
  }

  useSocketRecovery();

  useEffect(() => {
    console.log(`[SocketProvider] effect run - user logged in: ${!!user}`);

    if (!user) {
      console.log("[SocketProvider] No user - skipping socket initialization");
      return;
    }

    const currentState = useSocketStore.getState();
    console.log(`[SocketProvider] Current socket state - isConnected: ${currentState.isConnected}`);

    if (currentState.isConnected) {
      console.log("[SocketProvider] Socket already connected - skipping re-initialization");
      return;
    }

    console.log("[SocketProvider] Calling initSocket()...");
    initSocket()
      .then(() => {
        const socket = getSocket();
        console.log("[SocketProvider] Socket instance initialized");
        console.log("[SocketProvider] socket.id:", socket?.id);
        console.log("[SocketProvider] socket.connected:", socket?.connected);

        socket?.onAny((event: string, ...args: any[]) => {
          if (!["connect", "disconnect"].includes(event)) {
            console.log(`[SocketProvider] event: ${event}`, args[0]);
          }
        });

        socket?.on("disconnect", () => {
          console.log("[SocketProvider] Socket disconnected");
          setConnected(false);
          console.log("[SocketProvider] Fallback polling will now activate");
        });

        socket?.on("connect", () => {
          console.log("[SocketProvider] Socket connected");
          setConnected(true);
          console.log("[SocketProvider] Receiving real-time events again");
        });

        socket?.on("error", (error) => {
          console.log("[SocketProvider] Socket error:", error);
        });
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : "Socket connection failed";
        setConnectionError(errorMessage);
        console.error("[SocketProvider] Socket connection error:", errorMessage);
        console.log("[SocketProvider] Fallback polling will now activate");
      });

    return () => {
      console.log("[SocketProvider] Restaurant owner logging out - disconnecting socket");
      const state = useSocketStore.getState();
      if (state.isConnected) {
        const socket = getSocket();
        if (socket) {
          socket.disconnect();
          console.log("[SocketProvider] Socket disconnected");
        }
      }
    };
  }, [user, setConnected, setConnectionError]);

  return <>{children}</>;
}
