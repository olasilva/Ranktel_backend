const subscribers = new Map();

export const TRACKING_STATUSES = [
  'paid',
  'processing',
  'ready_for_pickup',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'completed',
  'cancelled'
];

export const initialTracking = (status, at = new Date().toISOString()) => ({
  status,
  location: null,
  eta: null,
  note: null,
  updatedAt: at,
  history: [{ status, at, location: null, note: null }]
});

export const updateTracking = (current, status, changes = {}) => {
  const at = new Date().toISOString();
  const next = {
    ...(current || initialTracking(status, at)),
    status,
    location: changes.location === undefined ? current?.location || null : changes.location,
    eta: changes.eta === undefined ? current?.eta || null : changes.eta,
    note: changes.note === undefined ? current?.note || null : changes.note,
    updatedAt: at
  };
  const history = Array.isArray(current?.history) ? current.history : [];
  if (!current || current.status !== status || changes.location !== undefined || changes.note !== undefined) {
    next.history = [...history, { status, at, location: next.location, note: next.note }];
  } else {
    next.history = history;
  }
  return next;
};

export const subscribe = (trackingId, response) => {
  const listeners = subscribers.get(trackingId) || new Set();
  listeners.add(response);
  subscribers.set(trackingId, listeners);
  return () => {
    listeners.delete(response);
    if (!listeners.size) subscribers.delete(trackingId);
  };
};

export const publish = (trackingId, payload) => {
  const listeners = subscribers.get(trackingId);
  if (!listeners) return;
  const message = `event: tracking.updated\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of listeners) {
    response.write(message);
  }
};
