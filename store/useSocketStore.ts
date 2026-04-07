import { create } from 'zustand';

export interface IncomingOrder {
  orderId: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  itemCount: number;
  paymentMode: string;
  timestamp: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehiclePlate: string;
  profilePic: string;
}

interface SocketState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;

  // Current order being managed
  managingOrderId: string | null;
  orderStatus: string | null;
  assignedDriver: DriverInfo | null;

  // Incoming orders list
  pendingOrders: IncomingOrder[];
  unreadOrders: number;

  // Methods
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  setManagingOrder: (orderId: string | null) => void;
  handleNewOrder: (order: IncomingOrder) => void;
  handleOrderStatusUpdate: (orderId: string, status: string) => void;
  handleDriverAssigned: (orderId: string, driver: DriverInfo) => void;
  removePendingOrder: (orderId: string) => void;
  clearOrders: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  connectionError: null,
  managingOrderId: null,
  orderStatus: null,
  assignedDriver: null,
  pendingOrders: [],
  unreadOrders: 0,

  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionError: (error) => set({ connectionError: error }),

  setManagingOrder: (orderId) =>
    set({
      managingOrderId: orderId,
      orderStatus: null,
      assignedDriver: null,
    }),

  handleNewOrder: (order) =>
    set((state) => {
      // Prevent duplicates - check if order already exists
      const orderExists = state.pendingOrders.some(o => o.orderId === order.orderId);
      if (orderExists) {
        console.log(`[SocketStore] ⚠️  Order ${order.orderId} already in pending list - skipping duplicate`);
        return state;
      }
      console.log(`[SocketStore] ✅ Adding NEW order to pending list: ${order.orderId}`);
      return {
        pendingOrders: [order, ...state.pendingOrders],
        unreadOrders: state.unreadOrders + 1,
      };
    }),

  handleOrderStatusUpdate: (orderId, status) =>
    set((state) => {
      if (state.managingOrderId !== orderId) {
        return state;
      }

      const shouldClearDriver = !['PICKED_UP', 'ON_THE_WAY'].includes(status);

      return {
        orderStatus: status,
        assignedDriver: shouldClearDriver ? null : state.assignedDriver,
      };
    }),

  handleDriverAssigned: (orderId, driver) =>
    set((state) =>
      state.managingOrderId === orderId
        ? { assignedDriver: driver }
        : state,
    ),

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
      assignedDriver: null,
      pendingOrders: [],
      unreadOrders: 0,
    }),
}));
