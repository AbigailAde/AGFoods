// Traceability system for AGFoods platform - Track product journey from farm to consumer
const TRACEABILITY_KEY = 'product_traceability';
const BATCH_HISTORY_KEY = 'batch_history';

// Traceability event types
export const TRACE_EVENT_TYPES = {
  CREATED: 'created',           // Batch created by farmer
  HARVESTED: 'harvested',       // Harvest details added
  QUALITY_CHECK: 'quality_check', // Quality inspection
  PROCESSED: 'processed',       // Processing by processor
  PACKAGED: 'packaged',        // Packaging details
  SHIPPED: 'shipped',          // Shipping information
  RECEIVED: 'received',        // Received by next party
  DISTRIBUTED: 'distributed',   // Distribution activities
  SOLD: 'sold',               // Sale to consumer
  DELIVERED: 'delivered',      // Final delivery
  FEEDBACK: 'feedback',        // Consumer/recipient feedback
  ISSUE_REPORTED: 'issue_reported', // Quality issues
  CUSTOM: 'custom'            // Custom events
};

// Role permissions for adding trace events
export const ROLE_PERMISSIONS = {
  farmer: [
    TRACE_EVENT_TYPES.CREATED,
    TRACE_EVENT_TYPES.HARVESTED,
    TRACE_EVENT_TYPES.QUALITY_CHECK,
    TRACE_EVENT_TYPES.PACKAGED,
    TRACE_EVENT_TYPES.SHIPPED,
    TRACE_EVENT_TYPES.CUSTOM
  ],
  processor: [
    TRACE_EVENT_TYPES.RECEIVED,
    TRACE_EVENT_TYPES.QUALITY_CHECK,
    TRACE_EVENT_TYPES.PROCESSED,
    TRACE_EVENT_TYPES.PACKAGED,
    TRACE_EVENT_TYPES.SHIPPED,
    TRACE_EVENT_TYPES.CUSTOM
  ],
  distributor: [
    TRACE_EVENT_TYPES.RECEIVED,
    TRACE_EVENT_TYPES.QUALITY_CHECK,
    TRACE_EVENT_TYPES.DISTRIBUTED,
    TRACE_EVENT_TYPES.PACKAGED,
    TRACE_EVENT_TYPES.SHIPPED,
    TRACE_EVENT_TYPES.SOLD,
    TRACE_EVENT_TYPES.CUSTOM
  ],
  consumer: [
    TRACE_EVENT_TYPES.RECEIVED,
    TRACE_EVENT_TYPES.DELIVERED,
    TRACE_EVENT_TYPES.FEEDBACK,
    TRACE_EVENT_TYPES.ISSUE_REPORTED,
    TRACE_EVENT_TYPES.CUSTOM
  ]
};

// Create a traceability event
export const addTraceabilityEvent = (batchId, eventType, eventData, userId, userRole) => {
  // Validate permissions
  if (!ROLE_PERMISSIONS[userRole]?.includes(eventType)) {
    throw new Error(`Role ${userRole} is not authorized to add ${eventType} events`);
  }

  const traceEvent = {
    id: 'TRACE-' + Date.now(),
    batchId,
    eventType,
    userId,
    userRole,
    userName: eventData.userName || 'Unknown User',
    timestamp: new Date().toISOString(),
    location: eventData.location || '',
    description: eventData.description || '',
    details: {
      ...eventData.details,
      // Remove userName and description from details to avoid duplication
      userName: undefined,
      description: undefined
    },
    images: eventData.images || [],
    documents: eventData.documents || [],
    verified: false, // Can be verified by other parties
    verifiedBy: null,
    verifiedAt: null
  };

  // Get existing traceability data
  const allTraceData = getTraceabilityData();
  const updatedData = [traceEvent, ...allTraceData];

  // Save traceability data
  localStorage.setItem(TRACEABILITY_KEY, JSON.stringify(updatedData));

  // Update batch history summary
  updateBatchHistorySummary(batchId);

  return traceEvent;
};

// Get all traceability data
const getTraceabilityData = () => {
  return JSON.parse(localStorage.getItem(TRACEABILITY_KEY) || '[]');
};

// Get traceability events for a specific batch
export const getBatchTraceability = (batchId) => {
  const allTraceData = getTraceabilityData();
  return allTraceData
    .filter(event => event.batchId === batchId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Get traceability events by user
export const getUserTraceabilityEvents = (userId, userRole) => {
  const allTraceData = getTraceabilityData();
  return allTraceData
    .filter(event => event.userId === userId && event.userRole === userRole)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Verify a traceability event
export const verifyTraceabilityEvent = (eventId, verifierId, verifierRole) => {
  const allTraceData = getTraceabilityData();
  const updatedData = allTraceData.map(event => {
    if (event.id === eventId) {
      return {
        ...event,
        verified: true,
        verifiedBy: verifierId,
        verifiedByRole: verifierRole,
        verifiedAt: new Date().toISOString()
      };
    }
    return event;
  });

  localStorage.setItem(TRACEABILITY_KEY, JSON.stringify(updatedData));
  return updatedData.find(event => event.id === eventId);
};

// Update batch history summary
const updateBatchHistorySummary = (batchId) => {
  const batchEvents = getBatchTraceability(batchId);
  const summary = {
    batchId,
    totalEvents: batchEvents.length,
    lastUpdated: new Date().toISOString(),
    currentStage: getCurrentStage(batchEvents),
    participatingRoles: [...new Set(batchEvents.map(e => e.userRole))],
    timeline: batchEvents.map(event => ({
      eventType: event.eventType,
      timestamp: event.timestamp,
      role: event.userRole,
      location: event.location
    })),
    qualityChecks: batchEvents.filter(e => e.eventType === TRACE_EVENT_TYPES.QUALITY_CHECK).length,
    verified: batchEvents.filter(e => e.verified).length,
    issues: batchEvents.filter(e => e.eventType === TRACE_EVENT_TYPES.ISSUE_REPORTED).length
  };

  const allSummaries = JSON.parse(localStorage.getItem(BATCH_HISTORY_KEY) || '[]');
  const filtered = allSummaries.filter(s => s.batchId !== batchId);
  const updated = [summary, ...filtered];

  localStorage.setItem(BATCH_HISTORY_KEY, JSON.stringify(updated));
  return summary;
};

// Get current stage based on events
const getCurrentStage = (events) => {
  const stageOrder = [
    TRACE_EVENT_TYPES.CREATED,
    TRACE_EVENT_TYPES.HARVESTED,
    TRACE_EVENT_TYPES.PROCESSED,
    TRACE_EVENT_TYPES.DISTRIBUTED,
    TRACE_EVENT_TYPES.SOLD,
    TRACE_EVENT_TYPES.DELIVERED
  ];

  const eventTypes = events.map(e => e.eventType);

  for (let i = stageOrder.length - 1; i >= 0; i--) {
    if (eventTypes.includes(stageOrder[i])) {
      return stageOrder[i];
    }
  }

  return 'unknown';
};

// Get batch history summary
export const getBatchHistorySummary = (batchId) => {
  const allSummaries = JSON.parse(localStorage.getItem(BATCH_HISTORY_KEY) || '[]');
  return allSummaries.find(s => s.batchId === batchId);
};

// Generate QR code data for a batch
export const generateBatchQRData = (batchId) => {
  const batchSummary = getBatchHistorySummary(batchId);
  const qrData = {
    batchId,
    platform: 'AGFoods',
    created: new Date().toISOString(),
    verifyUrl: `${window.location.origin}/verify/${batchId}`,
    summary: batchSummary ? {
      currentStage: batchSummary.currentStage,
      totalEvents: batchSummary.totalEvents,
      participatingRoles: batchSummary.participatingRoles,
      lastUpdated: batchSummary.lastUpdated
    } : null
  };

  return JSON.stringify(qrData);
};

// Initialize traceability for existing batches
export const initializeTraceabilityForExistingBatches = () => {
  const batches = JSON.parse(localStorage.getItem('batches') || '[]');
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  const existingTraceData = getTraceabilityData();

  // Initialize traceability for batches that don't have it
  batches.forEach(batch => {
    const hasTraceData = existingTraceData.some(event =>
      event.batchId === batch.id && event.eventType === TRACE_EVENT_TYPES.CREATED
    );

    if (!hasTraceData) {
      addTraceabilityEvent(
        batch.id,
        TRACE_EVENT_TYPES.CREATED,
        {
          userName: 'System',
          description: `Batch ${batch.id} created`,
          location: batch.location || 'Farm Location',
          details: {
            variety: batch.variety,
            quantity: batch.quantity,
            harvestDate: batch.harvestDate,
            qualityNotes: batch.qualityNotes
          }
        },
        batch.farmerId,
        'farmer'
      );
    }
  });

  console.log('Traceability initialized for existing batches');
};

// Search traceability events
export const searchTraceabilityEvents = (searchQuery, filters = {}) => {
  const allTraceData = getTraceabilityData();

  let filtered = allTraceData;

  // Apply text search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(event =>
      event.batchId.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query) ||
      event.userName.toLowerCase().includes(query)
    );
  }

  // Apply filters
  if (filters.eventType) {
    filtered = filtered.filter(event => event.eventType === filters.eventType);
  }

  if (filters.userRole) {
    filtered = filtered.filter(event => event.userRole === filters.userRole);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(event =>
      new Date(event.timestamp) >= new Date(filters.dateFrom)
    );
  }

  if (filters.dateTo) {
    filtered = filtered.filter(event =>
      new Date(event.timestamp) <= new Date(filters.dateTo)
    );
  }

  if (filters.verified !== undefined) {
    filtered = filtered.filter(event => event.verified === filters.verified);
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Get traceability statistics
export const getTraceabilityStats = () => {
  const allTraceData = getTraceabilityData();
  const allSummaries = JSON.parse(localStorage.getItem(BATCH_HISTORY_KEY) || '[]');

  const stats = {
    totalEvents: allTraceData.length,
    totalBatches: allSummaries.length,
    verifiedEvents: allTraceData.filter(e => e.verified).length,
    issuesReported: allTraceData.filter(e => e.eventType === TRACE_EVENT_TYPES.ISSUE_REPORTED).length,
    eventsByType: Object.values(TRACE_EVENT_TYPES).reduce((acc, type) => {
      acc[type] = allTraceData.filter(e => e.eventType === type).length;
      return acc;
    }, {}),
    eventsByRole: ['farmer', 'processor', 'distributor', 'consumer'].reduce((acc, role) => {
      acc[role] = allTraceData.filter(e => e.userRole === role).length;
      return acc;
    }, {}),
    batchesByStage: allSummaries.reduce((acc, summary) => {
      acc[summary.currentStage] = (acc[summary.currentStage] || 0) + 1;
      return acc;
    }, {})
  };

  return stats;
};

// Get supply chain analytics
export const getSupplyChainAnalytics = () => {
  const allSummaries = JSON.parse(localStorage.getItem(BATCH_HISTORY_KEY) || '[]');
  const allTraceData = getTraceabilityData();

  // Calculate average time between stages
  const stageTransitions = {};

  allSummaries.forEach(summary => {
    const events = getBatchTraceability(summary.batchId);

    for (let i = 1; i < events.length; i++) {
      const prevEvent = events[i - 1];
      const currentEvent = events[i];
      const transition = `${prevEvent.eventType}_to_${currentEvent.eventType}`;

      const timeDiff = new Date(currentEvent.timestamp) - new Date(prevEvent.timestamp);
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (!stageTransitions[transition]) {
        stageTransitions[transition] = [];
      }
      stageTransitions[transition].push(daysDiff);
    }
  });

  // Calculate averages
  const avgTransitionTimes = {};
  Object.keys(stageTransitions).forEach(transition => {
    const times = stageTransitions[transition];
    avgTransitionTimes[transition] = times.reduce((sum, time) => sum + time, 0) / times.length;
  });

  return {
    stageTransitions: avgTransitionTimes,
    totalBatchesTracked: allSummaries.length,
    averageEventsPerBatch: allTraceData.length / Math.max(allSummaries.length, 1),
    completionRates: {
      harvested: allSummaries.filter(s => s.timeline.some(t => t.eventType === TRACE_EVENT_TYPES.HARVESTED)).length,
      processed: allSummaries.filter(s => s.timeline.some(t => t.eventType === TRACE_EVENT_TYPES.PROCESSED)).length,
      distributed: allSummaries.filter(s => s.timeline.some(t => t.eventType === TRACE_EVENT_TYPES.DISTRIBUTED)).length,
      delivered: allSummaries.filter(s => s.timeline.some(t => t.eventType === TRACE_EVENT_TYPES.DELIVERED)).length
    }
  };
};

export default {
  addTraceabilityEvent,
  getBatchTraceability,
  getUserTraceabilityEvents,
  verifyTraceabilityEvent,
  getBatchHistorySummary,
  generateBatchQRData,
  initializeTraceabilityForExistingBatches,
  searchTraceabilityEvents,
  getTraceabilityStats,
  getSupplyChainAnalytics
};
