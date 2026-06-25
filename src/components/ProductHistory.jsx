import React, { useState, useEffect } from 'react';
import {
  History,
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Eye,
  Plus,
  QrCode,
  Camera,
  FileText,
  Star,
  MessageSquare,
  Truck,
  Package,
  Factory,
  Leaf,
  ShoppingCart,
  Award
} from 'lucide-react';
import {
  getBatchTraceability,
  addTraceabilityEvent,
  verifyTraceabilityEvent,
  TRACE_EVENT_TYPES,
  ROLE_PERMISSIONS,
  generateBatchQRData
} from '../utils/traceabilityUtils';
import { useAuth } from './AuthContext';
import { useDropzone } from 'react-dropzone';

const ProductHistory = ({ batchId, showAddEvent = true, compact = false }) => {
  const { user } = useAuth();
  const [traceEvents, setTraceEvents] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    eventType: '',
    description: '',
    location: '',
    details: {},
    images: []
  });
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    loadTraceabilityEvents();
  }, [batchId]);

  const loadTraceabilityEvents = () => {
    const events = getBatchTraceability(batchId);
    setTraceEvents(events);
  };

  // Image upload for events
  const onImageDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewEvent(prev => ({
        ...prev,
        images: [...prev.images, reader.result]
      }));
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onImageDrop,
    accept: { 'image/*': [] },
    maxFiles: 3
  });

  const handleAddEvent = () => {
    if (!newEvent.eventType || !newEvent.description) return;

    try {
      addTraceabilityEvent(
        batchId,
        newEvent.eventType,
        {
          userName: `${user.firstName} ${user.lastName}`,
          description: newEvent.description,
          location: newEvent.location,
          details: newEvent.details,
          images: newEvent.images
        },
        user.id,
        user.role
      );

      setShowAddEventModal(false);
      setNewEvent({
        eventType: '',
        description: '',
        location: '',
        details: {},
        images: []
      });
      loadTraceabilityEvents();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVerifyEvent = (eventId) => {
    verifyTraceabilityEvent(eventId, user.id, user.role);
    loadTraceabilityEvents();
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case TRACE_EVENT_TYPES.CREATED: return <Leaf className="w-5 h-5 text-green-600" />;
      case TRACE_EVENT_TYPES.HARVESTED: return <Package className="w-5 h-5 text-blue-600" />;
      case TRACE_EVENT_TYPES.PROCESSED: return <Factory className="w-5 h-5 text-purple-600" />;
      case TRACE_EVENT_TYPES.QUALITY_CHECK: return <Award className="w-5 h-5 text-yellow-600" />;
      case TRACE_EVENT_TYPES.PACKAGED: return <Package className="w-5 h-5 text-indigo-600" />;
      case TRACE_EVENT_TYPES.SHIPPED: return <Truck className="w-5 h-5 text-orange-600" />;
      case TRACE_EVENT_TYPES.RECEIVED: return <CheckCircle className="w-5 h-5 text-green-600" />;
      case TRACE_EVENT_TYPES.DISTRIBUTED: return <ShoppingCart className="w-5 h-5 text-teal-600" />;
      case TRACE_EVENT_TYPES.SOLD: return <ShoppingCart className="w-5 h-5 text-emerald-600" />;
      case TRACE_EVENT_TYPES.DELIVERED: return <CheckCircle className="w-5 h-5 text-green-700" />;
      case TRACE_EVENT_TYPES.FEEDBACK: return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case TRACE_EVENT_TYPES.ISSUE_REPORTED: return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'farmer': return 'text-green-600 bg-green-50 border-green-200';
      case 'processor': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'distributor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'consumer': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatEventType = (eventType) => {
    return eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const generateQRCode = () => {
    const qrData = generateBatchQRData(batchId);
    // For demo purposes, we'll show a simple QR representation
    // In production, you'd use a QR code library
    return qrData;
  };

  const allowedEventTypes = user ? ROLE_PERMISSIONS[user.role] || [] : [];

  if (compact) {
    // Compact view for smaller spaces
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <History className="w-4 h-4 mr-2" />
            Product Journey ({traceEvents.length} events)
          </h3>
          <button
            onClick={() => setShowQRCode(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {traceEvents.slice(0, 3).map(event => (
            <div key={event.id} className="flex items-center space-x-2 text-sm">
              {getEventIcon(event.eventType)}
              <span className="font-medium">{formatEventType(event.eventType)}</span>
              <span className="text-gray-500">by {event.userName}</span>
              <span className="text-xs text-gray-400">
                {new Date(event.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}

          {traceEvents.length > 3 && (
            <div className="text-sm text-gray-500">
              +{traceEvents.length - 3} more events
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <History className="w-6 h-6 mr-2 text-blue-600" />
              Product Traceability
            </h2>
            <p className="text-gray-600">Batch ID: {batchId}</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowQRCode(true)}
              className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center space-x-1"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>

            {showAddEvent && user && allowedEventTypes.length > 0 && (
              <button
                onClick={() => setShowAddEventModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {traceEvents.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No traceability events recorded yet</p>
            {showAddEvent && user && allowedEventTypes.length > 0 && (
              <button
                onClick={() => setShowAddEventModal(true)}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Event
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {traceEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-200 rounded-full">
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatEventType(event.eventType)}
                        </h3>
                        <p className="text-gray-600 mt-1">{event.description}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {event.verified && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>Verified</span>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className={`px-2 py-1 rounded-full border ${getRoleColor(event.userRole)}`}>
                        <User className="w-3 h-3 inline mr-1" />
                        {event.userName} ({event.userRole})
                      </div>

                      {event.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-3 h-3 mr-1" />
                          {event.location}
                        </div>
                      )}

                      <div className="flex items-center text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>

                    {event.images && event.images.length > 0 && (
                      <div className="mt-3 flex space-x-2">
                        {event.images.slice(0, 3).map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt="Event"
                            className="w-16 h-16 object-cover rounded border"
                          />
                        ))}
                        {event.images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                            +{event.images.length - 3} more
                          </div>
                        )}
                      </div>
                    )}

                    {!event.verified && user && user.role !== event.userRole && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleVerifyEvent(event.id)}
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Verify Event
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Traceability Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select event type...</option>
                  {allowedEventTypes.map(type => (
                    <option key={type} value={type}>
                      {formatEventType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Describe what happened..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Where did this happen?"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (optional)</label>
                <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-gray-400">
                  <input {...getInputProps()} />
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                </div>

                {newEvent.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newEvent.images.map((image, idx) => (
                      <div key={idx} className="relative">
                        <img src={image} alt="Upload" className="w-16 h-16 object-cover rounded border" />
                        <button
                          onClick={() => {
                            const updated = newEvent.images.filter((_, i) => i !== idx);
                            setNewEvent({ ...newEvent, images: updated });
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!newEvent.eventType || !newEvent.description}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="ml-2 text-sm text-gray-900">{formatEventType(selectedEvent.eventType)}</span>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="text-sm text-gray-900 mt-1">{selectedEvent.description}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Added by:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {selectedEvent.userName} ({selectedEvent.userRole})
                </span>
              </div>

              {selectedEvent.location && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Location:</span>
                  <span className="ml-2 text-sm text-gray-900">{selectedEvent.location}</span>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </span>
              </div>

              {selectedEvent.verified && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Verified by:</span>
                  <span className="ml-2 text-sm text-green-600">
                    {selectedEvent.verifiedBy} on {new Date(selectedEvent.verifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {selectedEvent.images && selectedEvent.images.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600 block mb-2">Images:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEvent.images.map((image, idx) => (
                      <img
                        key={idx}
                        src={image}
                        alt="Event"
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR Code for<br />Batch {batchId}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to view the complete traceability information
              </p>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p>Data: {generateQRCode().substring(0, 100)}...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductHistory;
