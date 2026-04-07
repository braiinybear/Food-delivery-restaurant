import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSocketStore } from '@/store/useSocketStore';
import { useEmitOrderStatus } from '@/hooks/useSocketOrders';
import { getSocket } from '@/lib/socket-client';

/**
 * DebugSocketPage: Test socket functionality manually
 * Shows socket status, pending orders, and lets you emit test events
 */
export function DebugSocketPage() {
  const { isConnected, pendingOrders } = useSocketStore();
  const { testEmit } = useEmitOrderStatus();
  const socket = getSocket();

  const handleTestEmit = () => {
    console.log('\n🧪 === MANUAL TEST EMIT ===');
    testEmit();
  };

  const handleEmitForFirstOrder = () => {
    if (pendingOrders.length === 0) {
      alert('No orders available');
      return;
    }
    const order = pendingOrders[0];
    console.log(`\n🧪 === EMITTING STATUS UPDATE FOR REAL ORDER ===`);
    console.log(`Order: ${order.orderId}`);
    
    const { updateStatus } = useEmitOrderStatus();
    updateStatus(order.orderId, 'ACCEPTED');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>🔌 Socket Debug</Text>

        {/* Connection Status */}
        <View style={styles.statusBox}>
          <Text style={styles.label}>Connection Status:</Text>
          <Text style={[styles.status, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
        </View>

        {/* Socket ID */}
        {socket && (
          <View style={styles.statusBox}>
            <Text style={styles.label}>Socket ID:</Text>
            <Text style={styles.code}>{socket.id?.slice(0, 12)}...</Text>
          </View>
        )}

        {/* Pending Orders Count */}
        <View style={styles.statusBox}>
          <Text style={styles.label}>Pending Orders:</Text>
          <Text style={styles.status}>{pendingOrders.length}</Text>
        </View>
      </View>

      {/* Test Buttons */}
      <View style={styles.section}>
        <Text style={styles.title}>🧪 Test Emit</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonTest]}
          onPress={handleTestEmit}
        >
          <Text style={styles.buttonText}>Test Emit (dummy order)</Text>
        </TouchableOpacity>

        {pendingOrders.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonEmit]}
            onPress={handleEmitForFirstOrder}
          >
            <Text style={styles.buttonText}>
              Emit for Order {pendingOrders[0].orderId.slice(0, 8)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pending Orders List */}
      {pendingOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>📋 Pending Orders</Text>

          {pendingOrders.map((order) => (
            <View key={order.orderId} style={styles.orderCard}>
              <Text style={styles.orderId}>
                Order: {order.orderId.slice(0, 8)}
              </Text>
              <Text style={styles.orderDetail}>Amount: ₹{order.totalAmount}</Text>
              <Text style={styles.orderDetail}>Items: {order.itemCount}</Text>
              <Text style={styles.orderDetail}>Status: PENDING</Text>

              <View style={styles.orderButtons}>
                <TouchableOpacity
                  style={[styles.orderButton, styles.acceptBtn]}
                  onPress={() => {
                    console.log(`\n🧪 Manual emit for order: ${order.orderId}`);
                    const { updateStatus } = useEmitOrderStatus();
                    updateStatus(order.orderId, 'ACCEPTED');
                  }}
                >
                  <Text style={styles.orderButtonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.orderButton, styles.preparingBtn]}
                  onPress={() => {
                    const { updateStatus } = useEmitOrderStatus();
                    updateStatus(order.orderId, 'PREPARING');
                  }}
                >
                  <Text style={styles.orderButtonText}>Preparing</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.title}>📖 How to Test</Text>
        <Text style={styles.instruction}>
          1. Check console at bottom for [Restaurant] logs
        </Text>
        <Text style={styles.instruction}>
          2. Click "Test Emit" to send dummy order
        </Text>
        <Text style={styles.instruction}>
          3. Watch both Restaurant and Customer console
        </Text>
        <Text style={styles.instruction}>
          4. Customer should see: [Customer] 📦 [EVENT]
        </Text>
        <Text style={styles.instruction}>
          5. If no [Customer] logs, backend isn't relaying
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusBox: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonTest: {
    backgroundColor: '#2196F3',
  },
  buttonEmit: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    borderLeft: 4,
    borderLeftColor: '#FF9800',
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  orderButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  preparingBtn: {
    backgroundColor: '#FF9800',
  },
  orderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  instruction: {
    fontSize: 13,
    color: '#333',
    marginVertical: 4,
    lineHeight: 20,
  },
});
