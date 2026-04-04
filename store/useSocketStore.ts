import { create } from 'zustand';

export interface IncomingOrder {
  orderId: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  specialInstructions?: string;
  timestamp: string;
}

interface SocketState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Order management
  managingOrderId: string | null;
  orderStatus: string | null;

  // Incoming orders
  pendingOrders: IncomingOrder[];
  unreadOrders: number;

  // Methods
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setManagingOrder: (orderId: string | null) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  addPendingOrder: (order: IncomingOrder) => void;
  removePendingOrder: (orderId: string) => void;
  clearOrders: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  connectionError: null,
  managingOrderId: null,
  orderStatus: null,
  pendingOrders: [],
  unreadOrders: 0,

  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),

  setManagingOrder: (orderId) =>
    set({
      managingOrderId: orderId,
      orderStatus: null,
    }),

  updateOrderStatus: (orderId, status) =>
    set((state) =>
      state.managingOrderId === orderId
        ? { orderStatus: status }
        : state,
    ),

  addPendingOrder: (order) =>
    set((state) => ({
      pendingOrders: [order, ...state.pendingOrders],
      unreadOrders: state.unreadOrders + 1,
    })),

  removePendingOrder: (orderId) =>
    set((state) => ({
      pendingOrders: state.pendingOrders.filter(
        (o) => o.orderId !== orderId,
      ),
    })),

  clearOrders: () =>
    set({
      pendingOrders: [],
      unreadOrders: 0,
    }),

  reset: () =>
    set({
      isConnected: false,
      connectionError: null,
      managingOrderId: null,
      orderStatus: null,
      pendingOrders: [],
      unreadOrders: 0,
    }),
}));
