// Notification system for AGFoods platform
import { getLowStockItems, getInventoryStats } from './inventoryUtils';
import { getAllOrders } from './orderUtils';

const NOTIFICATIONS_KEY = 'notifications';
const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

// Notification types
export const NOTIFICATION_TYPES = {
  ORDER_STATUS: 'order_status',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  INVENTORY_ALERT: 'inventory_alert',
  DELIVERY_UPDATE: 'delivery_update',
  NEW_ORDER: 'new_order',
  LOW_STOCK: 'low_stock',
  SYSTEM: 'system'
};

// Create a notification
export const createNotification = (userId, type, title, message, metadata = {}) => {
  const notification = {
    id: 'NOTIF-' + Date.now(),
    userId,
    type,
    title,
    message,
    metadata,
    read: false,
    createdAt: new Date().toISOString(),
    priority: metadata.priority || 'normal' // low, normal, high, urgent
  };

  const allNotifications = getAllNotifications();
  const updated = [notification, ...allNotifications];
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

  return notification;
};

// Get all notifications
const getAllNotifications = () => {
  return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
};

// Get notifications for a specific user
export const getUserNotifications = (userId, limit = 50) => {
  const allNotifications = getAllNotifications();
  return allNotifications
    .filter(notif => notif.userId === userId)
    .slice(0, limit)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Mark notification as read
export const markNotificationRead = (notificationId) => {
  const allNotifications = getAllNotifications();
  const updated = allNotifications.map(notif =>
    notif.id === notificationId ? { ...notif, read: true } : notif
  );
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
};

// Mark all notifications as read for a user
export const markAllNotificationsRead = (userId) => {
  const allNotifications = getAllNotifications();
  const updated = allNotifications.map(notif =>
    notif.userId === userId ? { ...notif, read: true } : notif
  );
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
};

// Delete notification
export const deleteNotification = (notificationId) => {
  const allNotifications = getAllNotifications();
  const updated = allNotifications.filter(notif => notif.id !== notificationId);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
};

// Get unread notifications count
export const getUnreadCount = (userId) => {
  const userNotifications = getUserNotifications(userId);
  return userNotifications.filter(notif => !notif.read).length;
};

// Notification for order status changes
export const notifyOrderStatusChange = (order, newStatus, recipientId) => {
  const statusMessages = {
    pending: 'is awaiting confirmation',
    confirmed: 'has been confirmed',
    processing: 'is now being processed',
    ready: 'is ready for pickup/shipping',
    shipped: 'has been shipped',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled'
  };

  const title = `Order ${order.id} Update`;
  const message = `Your order ${statusMessages[newStatus] || `status changed to ${newStatus}`}.`;

  return createNotification(recipientId, NOTIFICATION_TYPES.ORDER_STATUS, title, message, {
    orderId: order.id,
    newStatus,
    priority: newStatus === 'cancelled' ? 'high' : 'normal'
  });
};

// Notification for new orders received
export const notifyNewOrder = (order, recipientId) => {
  const title = 'New Order Received';
  const message = `You have received a new ${order.type} order (#${order.id}) for ${order.quantity} units.`;

  return createNotification(recipientId, NOTIFICATION_TYPES.NEW_ORDER, title, message, {
    orderId: order.id,
    orderType: order.type,
    priority: 'high'
  });
};

// Notification for payment confirmations
export const notifyPaymentConfirmed = (order, paymentReference, recipientId) => {
  const title = 'Payment Confirmed';
  const message = `Payment for order #${order.id} has been confirmed. Reference: ${paymentReference}`;

  return createNotification(recipientId, NOTIFICATION_TYPES.PAYMENT_CONFIRMED, title, message, {
    orderId: order.id,
    paymentReference,
    priority: 'normal'
  });
};

// Notification for delivery updates
export const notifyDeliveryUpdate = (order, trackingInfo, recipientId) => {
  const title = 'Delivery Update';
  const message = trackingInfo.trackingNumber
    ? `Your order #${order.id} is on its way! Tracking: ${trackingInfo.trackingNumber}`
    : `Delivery status update for order #${order.id}`;

  return createNotification(recipientId, NOTIFICATION_TYPES.DELIVERY_UPDATE, title, message, {
    orderId: order.id,
    trackingNumber: trackingInfo.trackingNumber,
    estimatedDelivery: trackingInfo.estimatedDelivery,
    priority: 'normal'
  });
};

// Notification for low stock alerts
export const notifyLowStock = (inventoryItem, recipientId) => {
  const title = 'Low Stock Alert';
  const message = inventoryItem.currentQuantity === 0
    ? `${inventoryItem.itemId} is out of stock!`
    : `${inventoryItem.itemId} is running low (${inventoryItem.currentQuantity} units remaining)`;

  return createNotification(recipientId, NOTIFICATION_TYPES.LOW_STOCK, title, message, {
    itemId: inventoryItem.itemId,
    currentQuantity: inventoryItem.currentQuantity,
    priority: inventoryItem.currentQuantity === 0 ? 'urgent' : 'high'
  });
};

// Batch create notifications for multiple recipients
export const createBulkNotifications = (recipientIds, type, title, message, metadata = {}) => {
  const notifications = recipientIds.map(userId =>
    createNotification(userId, type, title, message, metadata)
  );
  return notifications;
};

// Check and create automatic notifications
export const checkAndCreateAutoNotifications = (userId, userRole) => {
  const notifications = [];

  // Check for low stock items
  const lowStockItems = getLowStockItems(userId, userRole);
  lowStockItems.forEach(item => {
    // Only notify if we haven't already notified recently (within last 24 hours)
    const recentNotifications = getUserNotifications(userId, 100);
    const recentLowStockNotif = recentNotifications.find(notif =>
      notif.type === NOTIFICATION_TYPES.LOW_STOCK &&
      notif.metadata.itemId === item.itemId &&
      (Date.now() - new Date(notif.createdAt).getTime()) < 24 * 60 * 60 * 1000
    );

    if (!recentLowStockNotif) {
      notifications.push(notifyLowStock(item, userId));
    }
  });

  // Check for orders requiring attention (pending orders for processors/distributors)
  const allOrders = getAllOrders();
  const pendingOrders = allOrders.filter(order => {
    if (userRole === 'processor' && order.type === 'processing' && order.processorId === userId && order.status === 'pending') {
      return true;
    }
    if (userRole === 'distributor' && order.type === 'distribution' && order.distributorId === userId && order.status === 'pending') {
      return true;
    }
    return false;
  });

  pendingOrders.forEach(order => {
    // Only notify once per order
    const existingNotif = getUserNotifications(userId, 100).find(notif =>
      notif.metadata.orderId === order.id && notif.type === NOTIFICATION_TYPES.NEW_ORDER
    );

    if (!existingNotif) {
      notifications.push(notifyNewOrder(order, userId));
    }
  });

  return notifications;
};

// Notification settings management
export const getNotificationSettings = (userId) => {
  const allSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');
  return allSettings[userId] || {
    orderUpdates: true,
    inventoryAlerts: true,
    deliveryUpdates: true,
    paymentConfirmations: true,
    emailNotifications: false,
    pushNotifications: true
  };
};

export const updateNotificationSettings = (userId, settings) => {
  const allSettings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');
  allSettings[userId] = { ...allSettings[userId], ...settings };
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(allSettings));
  return allSettings[userId];
};

// Get notification statistics
export const getNotificationStats = (userId) => {
  const notifications = getUserNotifications(userId);

  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: Object.values(NOTIFICATION_TYPES).reduce((acc, type) => {
      acc[type] = notifications.filter(n => n.type === type).length;
      return acc;
    }, {}),
    byPriority: {
      urgent: notifications.filter(n => n.metadata.priority === 'urgent').length,
      high: notifications.filter(n => n.metadata.priority === 'high').length,
      normal: notifications.filter(n => n.metadata.priority === 'normal').length,
      low: notifications.filter(n => n.metadata.priority === 'low').length
    }
  };
};

export default {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  notifyOrderStatusChange,
  notifyNewOrder,
  notifyPaymentConfirmed,
  notifyDeliveryUpdate,
  notifyLowStock,
  checkAndCreateAutoNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  getNotificationStats
};
