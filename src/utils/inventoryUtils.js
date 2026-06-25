// Inventory management utilities for AGFoods platform
import { getAllOrders } from './orderUtils';

const INVENTORY_KEY = 'inventory_tracking';
const LOW_STOCK_THRESHOLD = 10; // Units below which stock is considered low

// Initialize inventory tracking for a product/batch
export const initializeInventoryItem = (itemId, itemType, initialQuantity, ownerId, ownerRole) => {
  const inventoryItem = {
    itemId,
    itemType, // 'batch', 'product'
    ownerId,
    ownerRole, // 'farmer', 'processor', 'distributor'
    initialQuantity: Number(initialQuantity),
    currentQuantity: Number(initialQuantity),
    reservedQuantity: 0, // Quantity allocated to pending orders
    soldQuantity: 0,
    lastUpdated: new Date().toISOString(),
    lowStockAlert: false,
    stockHistory: [
      {
        action: 'initialized',
        quantity: Number(initialQuantity),
        timestamp: new Date().toISOString(),
        note: 'Initial stock entry'
      }
    ]
  };

  const allInventory = getInventoryData();
  // Remove existing entry if any
  const filtered = allInventory.filter(item => !(item.itemId === itemId && item.ownerId === ownerId));
  const updated = [...filtered, inventoryItem];
  saveInventoryData(updated);

  return inventoryItem;
};

// Get all inventory data
const getInventoryData = () => {
  return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '[]');
};

// Save inventory data
const saveInventoryData = (data) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
};

// Update stock quantity when a sale is made
export const updateStockOnSale = (itemId, quantitySold, buyerId, saleReference) => {
  const allInventory = getInventoryData();
  const updated = allInventory.map(item => {
    if (item.itemId === itemId) {
      const newCurrentQuantity = Math.max(0, item.currentQuantity - quantitySold);
      const newSoldQuantity = item.soldQuantity + quantitySold;

      return {
        ...item,
        currentQuantity: newCurrentQuantity,
        soldQuantity: newSoldQuantity,
        lowStockAlert: newCurrentQuantity <= LOW_STOCK_THRESHOLD,
        lastUpdated: new Date().toISOString(),
        stockHistory: [
          ...item.stockHistory,
          {
            action: 'sale',
            quantity: -quantitySold,
            newQuantity: newCurrentQuantity,
            timestamp: new Date().toISOString(),
            note: `Sold to ${buyerId}, Ref: ${saleReference}`
          }
        ]
      };
    }
    return item;
  });

  saveInventoryData(updated);
  return updated.find(item => item.itemId === itemId);
};

// Reserve stock for pending orders
export const reserveStock = (itemId, quantity, orderId) => {
  const allInventory = getInventoryData();
  const updated = allInventory.map(item => {
    if (item.itemId === itemId) {
      const newReservedQuantity = item.reservedQuantity + quantity;

      return {
        ...item,
        reservedQuantity: newReservedQuantity,
        lastUpdated: new Date().toISOString(),
        stockHistory: [
          ...item.stockHistory,
          {
            action: 'reserved',
            quantity: quantity,
            newReservedQuantity: newReservedQuantity,
            timestamp: new Date().toISOString(),
            note: `Reserved for order ${orderId}`
          }
        ]
      };
    }
    return item;
  });

  saveInventoryData(updated);
  return updated.find(item => item.itemId === itemId);
};

// Release reserved stock (when order is cancelled)
export const releaseReservedStock = (itemId, quantity, orderId) => {
  const allInventory = getInventoryData();
  const updated = allInventory.map(item => {
    if (item.itemId === itemId) {
      const newReservedQuantity = Math.max(0, item.reservedQuantity - quantity);

      return {
        ...item,
        reservedQuantity: newReservedQuantity,
        lastUpdated: new Date().toISOString(),
        stockHistory: [
          ...item.stockHistory,
          {
            action: 'unreserved',
            quantity: -quantity,
            newReservedQuantity: newReservedQuantity,
            timestamp: new Date().toISOString(),
            note: `Released from cancelled order ${orderId}`
          }
        ]
      };
    }
    return item;
  });

  saveInventoryData(updated);
  return updated.find(item => item.itemId === itemId);
};

// Add stock (new harvest, production, etc.)
export const addStock = (itemId, quantity, reason = 'restocked') => {
  const allInventory = getInventoryData();
  const updated = allInventory.map(item => {
    if (item.itemId === itemId) {
      const newCurrentQuantity = item.currentQuantity + quantity;

      return {
        ...item,
        currentQuantity: newCurrentQuantity,
        lowStockAlert: newCurrentQuantity <= LOW_STOCK_THRESHOLD,
        lastUpdated: new Date().toISOString(),
        stockHistory: [
          ...item.stockHistory,
          {
            action: 'added',
            quantity: quantity,
            newQuantity: newCurrentQuantity,
            timestamp: new Date().toISOString(),
            note: reason
          }
        ]
      };
    }
    return item;
  });

  saveInventoryData(updated);
  return updated.find(item => item.itemId === itemId);
};

// Get inventory for a specific user
export const getUserInventory = (userId, userRole) => {
  const allInventory = getInventoryData();
  return allInventory.filter(item => item.ownerId === userId && item.ownerRole === userRole);
};

// Get low stock items for a user
export const getLowStockItems = (userId, userRole) => {
  const userInventory = getUserInventory(userId, userRole);
  return userInventory.filter(item => item.lowStockAlert || item.currentQuantity <= LOW_STOCK_THRESHOLD);
};

// Get inventory statistics for dashboard
export const getInventoryStats = (userId, userRole) => {
  const userInventory = getUserInventory(userId, userRole);

  const stats = {
    totalItems: userInventory.length,
    totalCurrentStock: userInventory.reduce((sum, item) => sum + item.currentQuantity, 0),
    totalSold: userInventory.reduce((sum, item) => sum + item.soldQuantity, 0),
    totalReserved: userInventory.reduce((sum, item) => sum + item.reservedQuantity, 0),
    lowStockItems: userInventory.filter(item => item.lowStockAlert).length,
    outOfStockItems: userInventory.filter(item => item.currentQuantity === 0).length,
    totalValue: 0 // Would need product prices to calculate
  };

  return stats;
};

// Get available quantity (current - reserved)
export const getAvailableQuantity = (itemId) => {
  const allInventory = getInventoryData();
  const item = allInventory.find(inv => inv.itemId === itemId);
  if (!item) return 0;
  return Math.max(0, item.currentQuantity - item.reservedQuantity);
};

// Sync inventory with existing batches and products
export const syncInventoryWithExistingItems = () => {
  const batches = JSON.parse(localStorage.getItem('batches') || '[]');
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const existingInventory = getInventoryData();

  // Add batches to inventory if not already tracked
  batches.forEach(batch => {
    const existingItem = existingInventory.find(inv =>
      inv.itemId === batch.id && inv.ownerId === batch.farmerId
    );

    if (!existingItem) {
      initializeInventoryItem(
        batch.id,
        'batch',
        batch.quantity || 0,
        batch.farmerId,
        'farmer'
      );
    }
  });

  // Add products to inventory if not already tracked
  products.forEach(product => {
    const existingItem = existingInventory.find(inv =>
      inv.itemId === product.id && (inv.ownerId === product.processorId || inv.ownerId === product.distributorId)
    );

    if (!existingItem) {
      const ownerId = product.processorId || product.distributorId;
      const ownerRole = product.processorId ? 'processor' : 'distributor';

      initializeInventoryItem(
        product.id,
        'product',
        product.quantity || 0,
        ownerId,
        ownerRole
      );
    }
  });

  console.log('Inventory sync completed');
};

// Auto-update inventory based on confirmed orders
export const syncInventoryWithOrders = () => {
  const allOrders = getAllOrders();
  const confirmedOrders = allOrders.filter(order =>
    order.status === 'confirmed' || order.status === 'delivered'
  );

  confirmedOrders.forEach(order => {
    // Update inventory based on order type
    if (order.type === 'processing' && order.batchId) {
      updateStockOnSale(order.batchId, order.quantity, order.processorId, order.id);
    } else if (order.type === 'distribution' && order.productId) {
      updateStockOnSale(order.productId, order.quantity, order.distributorId, order.id);
    } else if (order.type === 'consumer' && order.productId) {
      updateStockOnSale(order.productId, order.quantity, order.consumerId, order.id);
    }
  });
};

export { LOW_STOCK_THRESHOLD };
