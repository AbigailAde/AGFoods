// Utility functions for order management across the AGFoods platform

const ORDER_TYPES = {
  PROCESSING: 'processing', // Farmer -> Processor
  DISTRIBUTION: 'distribution', // Processor -> Distributor
  CONSUMER: 'consumer' // Distributor -> Consumer
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY: 'ready',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const ORDERS_KEY = 'all_orders';

// Create a processing order when a processor buys from a farmer
export const createProcessingOrder = (farmerId, processorId, batchData, totalAmount, deliveryInfo) => {
  const order = {
    id: 'ORD-' + Date.now(),
    type: ORDER_TYPES.PROCESSING,
    farmerId,
    processorId,
    batchId: batchData.id,
    batchName: batchData.name,
    productName: batchData.cropType,
    quantity: batchData.quantity,
    unit: batchData.unit,
    totalAmount,
    status: ORDER_STATUS.PENDING,
    deliveryAddress: deliveryInfo.address,
    contactPhone: deliveryInfo.phone,
    customerName: deliveryInfo.customerName,
    supplierName: batchData.farmerName,
    specialInstructions: deliveryInfo.instructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveOrder(order);
  return order;
};

// Create a distribution order when a distributor buys from a processor
export const createDistributionOrder = (processorId, distributorId, productData, totalAmount, deliveryInfo) => {
  const order = {
    id: 'ORD-' + Date.now(),
    type: ORDER_TYPES.DISTRIBUTION,
    processorId,
    distributorId,
    productId: productData.id,
    productName: productData.name,
    quantity: productData.quantity,
    unit: productData.unit || 'units',
    totalAmount,
    status: ORDER_STATUS.PENDING,
    deliveryAddress: deliveryInfo.address,
    contactPhone: deliveryInfo.phone,
    customerName: deliveryInfo.customerName,
    supplierName: productData.processorName,
    specialInstructions: deliveryInfo.instructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveOrder(order);
  return order;
};

// Create a consumer order when a consumer buys from a distributor
export const createConsumerOrder = (distributorId, consumerId, cartItems, totalAmount, deliveryInfo, paymentReference) => {
  // Create individual orders for each item or a single order with multiple items
  const orders = cartItems.map(item => ({
    id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    type: ORDER_TYPES.CONSUMER,
    distributorId,
    consumerId,
    productId: item.id,
    productName: item.name,
    quantity: item.quantity,
    unit: item.unit || 'units',
    unitPrice: item.price,
    totalAmount: item.price * item.quantity,
    status: ORDER_STATUS.CONFIRMED, // Consumer orders are confirmed after payment
    deliveryAddress: deliveryInfo.address,
    contactPhone: deliveryInfo.phone,
    customerName: deliveryInfo.customerName,
    supplierName: item.distributorName,
    paymentReference,
    specialInstructions: deliveryInfo.instructions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // Save all orders
  orders.forEach(saveOrder);
  return orders;
};

// Save order to localStorage
const saveOrder = (order) => {
  const existingOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const updatedOrders = [order, ...existingOrders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
};

// Get all orders from localStorage
export const getAllOrders = () => {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
};

// Get orders by user ID and role
export const getOrdersByUser = (userId, userRole) => {
  const allOrders = getAllOrders();

  return {
    incoming: allOrders.filter(order => {
      switch (userRole) {
        case 'farmer':
          return false; // Farmers typically don't receive orders
        case 'processor':
          return order.type === ORDER_TYPES.PROCESSING && order.processorId === userId;
        case 'distributor':
          return order.type === ORDER_TYPES.DISTRIBUTION && order.distributorId === userId;
        case 'consumer':
          return order.type === ORDER_TYPES.CONSUMER && order.consumerId === userId;
        default:
          return false;
      }
    }),

    outgoing: allOrders.filter(order => {
      switch (userRole) {
        case 'farmer':
          return order.type === ORDER_TYPES.PROCESSING && order.farmerId === userId;
        case 'processor':
          return order.type === ORDER_TYPES.DISTRIBUTION && order.processorId === userId;
        case 'distributor':
          return order.type === ORDER_TYPES.CONSUMER && order.distributorId === userId;
        case 'consumer':
          return false; // Consumers don't create outgoing orders
        default:
          return false;
      }
    })
  };
};

// Update order status
export const updateOrderStatus = (orderId, newStatus, additionalData = {}) => {
  const allOrders = getAllOrders();
  const updatedOrders = allOrders.map(order => {
    if (order.id === orderId) {
      return {
        ...order,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };
    }
    return order;
  });

  localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
  return updatedOrders.find(order => order.id === orderId);
};

// Generate tracking number
export const generateTrackingNumber = () => {
  return 'TRK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// Add tracking information to order
export const addTrackingInfo = (orderId, trackingNumber, estimatedDelivery) => {
  return updateOrderStatus(orderId, ORDER_STATUS.SHIPPED, {
    trackingNumber,
    estimatedDelivery,
    shippedAt: new Date().toISOString()
  });
};

// Get order statistics for dashboard
export const getOrderStatistics = (userId, userRole) => {
  const { incoming, outgoing } = getOrdersByUser(userId, userRole);
  const allUserOrders = [...incoming, ...outgoing];

  const stats = {
    total: allUserOrders.length,
    pending: allUserOrders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    processing: allUserOrders.filter(o => o.status === ORDER_STATUS.PROCESSING).length,
    shipped: allUserOrders.filter(o => o.status === ORDER_STATUS.SHIPPED).length,
    delivered: allUserOrders.filter(o => o.status === ORDER_STATUS.DELIVERED).length,
    totalRevenue: outgoing.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    totalPurchases: incoming.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  };

  return stats;
};

export { ORDER_TYPES, ORDER_STATUS, ORDERS_KEY };
