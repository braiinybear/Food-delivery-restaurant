// types/order.ts

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUSED";

export type PaymentMode = "COD" | "WALLET" | "RAZORPAY";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "VEG" | "NON_VEG";
  isAvailable: boolean;
  isBestseller: boolean;
  spiceLevel: string;
  prepTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  driverId: string | null;
  status: OrderStatus;
  otp: string;

  cancellationReason: string | null;

  itemTotal: number;
  tax: number;
  deliveryCharge: number;
  platformFee: number;
  driverTip: number;
  discount: number;
  promoCode: string | null;
  commission: number;
  totalAmount: number;

  paymentMode: PaymentMode;
  isPaid: boolean;

  placedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;

  customer: Customer;
  items: OrderItem[];
}



export interface UpdateOrderStatusResponse {
  id: string;
  customerId: string;
  restaurantId: string;
  driverId: string | null;

  status: OrderStatus;

  otp: string;
  cancellationReason: string | null;

  itemTotal: number;
  tax: number;
  deliveryCharge: number;
  platformFee: number;
  driverTip: number;
  discount: number;
  promoCode: string | null;
  commission: number;
  totalAmount: number;

  paymentMode: "COD" | "WALLET" | "RAZORPAY";
  isPaid: boolean;

  placedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}