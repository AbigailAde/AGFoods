import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Settings, AlertCircle, Package, Truck, CreditCard, Clock, X } from 'lucide-react';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
  checkAndCreateAutoNotifications,
  NOTIFICATION_TYPES
} from '../utils/notificationUtils';

const NotificationPanel = ({ userId, userRole, isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedType, setSelectedType] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      checkAndCreateAutoNotifications(userId, userRole);

      // Set up auto-refresh every 30 seconds
      if (autoRefresh) {
        const interval = setInterval(() => {
          checkAndCreateAutoNotifications(userId, userRole);
          loadNotifications();
        }, 30000);

        return () => clearInterval(interval);
      }
    }
  }, [userId, userRole, autoRefresh]);

  const loadNotifications = () => {
    const userNotifs = getUserNotifications(userId);
    const unread = getUnreadCount(userId);
    setNotifications(userNotifs);
    setUnreadCount(unread);
  };

  const handleMarkAsRead = (notificationId) => {
    markNotificationRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(userId);
    loadNotifications();
  };

  const handleDelete = (notificationId) => {
    deleteNotification(notificationId);
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.ORDER_STATUS:
        return <Package className="w-5 h-5 text-blue-500" />;
      case NOTIFICATION_TYPES.NEW_ORDER:
        return <Package className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.PAYMENT_CONFIRMED:
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.DELIVERY_UPDATE:
        return <Truck className="w-5 h-5 text-purple-500" />;
      case NOTIFICATION_TYPES.LOW_STOCK:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.INVENTORY_ALERT:
        return <Package className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const filteredNotifications = selectedType === 'all'
    ? notifications
    : notifications.filter(n => n.type === selectedType);

  const typeOptions = [
    { id: 'all', label: 'All Notifications', count: notifications.length },
    { id: NOTIFICATION_TYPES.ORDER_STATUS, label: 'Order Updates', count: notifications.filter(n => n.type === NOTIFICATION_TYPES.ORDER_STATUS).length },
    { id: NOTIFICATION_TYPES.NEW_ORDER, label: 'New Orders', count: notifications.filter(n => n.type === NOTIFICATION_TYPES.NEW_ORDER).length },
    { id: NOTIFICATION_TYPES.PAYMENT_CONFIRMED, label: 'Payments', count: notifications.filter(n => n.type === NOTIFICATION_TYPES.PAYMENT_CONFIRMED).length },
    { id: NOTIFICATION_TYPES.DELIVERY_UPDATE, label: 'Deliveries', count: notifications.filter(n => n.type === NOTIFICATION_TYPES.DELIVERY_UPDATE).length },
    { id: NOTIFICATION_TYPES.LOW_STOCK, label: 'Stock Alerts', count: notifications.filter(n => n.type === NOTIFICATION_TYPES.LOW_STOCK).length }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end pt-16 pr-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="border-b px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {typeOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-sm px-3 py-1 rounded flex items-center space-x-1 ${
                autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
              <span>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-4 hover:bg-gray-50 ${
                    notification.read ? 'opacity-75' : ''
                  } ${getPriorityColor(notification.metadata.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                          {notification.metadata.priority === 'urgent' && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                              URGENT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-blue-500 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 text-center">
          <button className="text-sm text-gray-600 hover:text-gray-700 flex items-center justify-center space-x-1 w-full">
            <Settings className="w-4 h-4" />
            <span>Notification Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Bell Component for navbar
export const NotificationBell = ({ userId, userRole, onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      const count = getUnreadCount(userId);
      setUnreadCount(count);

      // Update count every 30 seconds
      const interval = setInterval(() => {
        const newCount = getUnreadCount(userId);
        setUnreadCount(newCount);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationPanel;
