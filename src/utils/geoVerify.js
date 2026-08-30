/**
 * geoVerify.js
 * GPS location utilities for attendance check-in/out verification
 */

/**
 * Get current browser position as a Promise
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const messages = {
          1: 'Location permission was denied. Please allow location access and try again.',
          2: 'Location unavailable. Please check your device GPS.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[err.code] || 'Unable to get location.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Haversine formula — distance in meters between two lat/lng points
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Verify if employee is within allowed radius of project location
 */
export function verifyLocation(projectLat, projectLng, empLat, empLng, radiusMeters = 200) {
  const distance = haversineDistance(projectLat, projectLng, empLat, empLng);
  return { verified: distance <= radiusMeters, distance };
}

export function formatDistance(meters) {
  if (meters === null || meters === undefined) return '—';
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const d = new Date(timeStr);
  return d.toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', hour12: false });
}
