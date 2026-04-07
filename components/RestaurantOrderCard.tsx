import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSocketStore } from '@/store/useSocketStore';
import { useEmitOrderStatus } from '@/hooks/useSocketOrders';

interface RestaurantOrderCardProps {
  orderId: string;
  customerId?: string;
  totalPrice?: number;
  itemsCount?: number;
  paymentMode?: string;
}

/**
 * RestaurantOrderCard: Displays order details with buttons to update status
 * Emits socket events to update order status via useEmitOrderStatus hook
 */
export function RestaurantOrderCard({
  orderId,
  customerId,
  totalPrice = 0,
  itemsCount = 0,
  paymentMode = 'CASH',
}: RestaurantOrderCardProps) {
  const { orders } = useSocketStore();
  const { updateStatus: emitStatusUpdate } = useEmitOrderStatus();
  const [loading, setLoading] = useState(false);

  const order = orders[orderId];
  const currentStatus = order?.status || 'PENDING';

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    console.log(
      `[RestaurantOrderCard] 👆 User tapped to update order ${orderId} to ${newStatus}`
    );

    try {
      // Emit socket event to update status and notify customers
      emitStatusUpdate(orderId, newStatus);
      console.log(`[RestaurantOrderCard] ✅ Status update event emitted via socket.io`);
    } catch (error) {
      console.error(`[RestaurantOrderCard] ❌ Error updating status:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return '#4CAF50';
      case 'PREPARING':
        return '#FF9800';
      case 'READY':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{orderId.slice(0, 8).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
          <Text style={styles.statusText}>{currentStatus}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>💰 ₹{totalPrice}</Text>
        <Text style={styles.detailText}>🍽️ {itemsCount} items</Text>
        <Text style={styles.detailText}>💳 {paymentMode}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {currentStatus === 'PENDING' && (
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleStatusUpdate('ACCEPTED')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✅ Accept</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'ACCEPTED' && (
          <TouchableOpacity
            style={[styles.button, styles.preparingButton]}
            onPress={() => handleStatusUpdate('PREPARING')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>👨‍🍳 Preparing</Text>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'PREPARING' && (
          <TouchableOpacity
            style={[styles.button, styles.readyButton]}
            onPress={() => handleStatusUpdate('READY')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📦 Ready</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => handleStatusUpdate('CANCELLED')}
          disabled={loading || currentStatus === 'CANCELLED'}
        >
          <Text style={styles.buttonText}>❌ Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  details: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  preparingButton: {
    backgroundColor: '#FF9800',
  },
  readyButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
