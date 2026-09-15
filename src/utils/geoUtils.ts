/**
 * Kaaba Coordinates in Mecca (Makkah al-Mukarramah)
 */
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};

/**
 * Calculates great-circle distance between two points in kilometers
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calculates true Qibla bearing (in degrees clockwise from True North: 0° - 360°)
 * and distance to the Kaaba for any coordinate on Earth.
 */
export function calculateQiblaDirection(
  latitude: number,
  longitude: number
): { bearing: number; distanceKm: number; cardinalName: string } {
  const phi1 = (latitude * Math.PI) / 180;
  const lambda1 = (longitude * Math.PI) / 180;
  const phi2 = (KAABA_COORDINATES.latitude * Math.PI) / 180;
  const lambda2 = (KAABA_COORDINATES.longitude * Math.PI) / 180;

  const deltaLambda = lambda2 - lambda1;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  const qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180) / Math.PI;
  let bearing = (qiblaDeg + 360) % 360;

  const distanceKm = calculateDistanceKm(
    latitude,
    longitude,
    KAABA_COORDINATES.latitude,
    KAABA_COORDINATES.longitude
  );

  return {
    bearing: Math.round(bearing * 10) / 10,
    distanceKm: Math.round(distanceKm),
    cardinalName: getCardinalDirection(bearing),
  };
}

/**
 * Returns Indonesian cardinal direction name for given degrees
 */
export function getCardinalDirection(deg: number): string {
  const normalized = (deg % 360 + 360) % 360;
  const directions = [
    { label: 'Utara (U)', min: 348.75, max: 11.25 },
    { label: 'Utara Timur Laut (UTL)', min: 11.25, max: 33.75 },
    { label: 'Timur Laut (TL)', min: 33.75, max: 56.25 },
    { label: 'Timur Timur Laut (TTL)', min: 56.25, max: 78.75 },
    { label: 'Timur (T)', min: 78.75, max: 101.25 },
    { label: 'Timur Menenggara (TM)', min: 101.25, max: 123.75 },
    { label: 'Tenggara (TG)', min: 123.75, max: 146.25 },
    { label: 'Selatan Menenggara (SM)', min: 146.25, max: 168.75 },
    { label: 'Selatan (S)', min: 168.75, max: 191.25 },
    { label: 'Selatan Barat Daya (SBD)', min: 191.25, max: 213.75 },
    { label: 'Barat Daya (BD)', min: 213.75, max: 236.25 },
    { label: 'Barat Barat Daya (BBD)', min: 236.25, max: 258.75 },
    { label: 'Barat (B)', min: 258.75, max: 281.25 },
    { label: 'Barat Barat Laut (BBL)', min: 281.25, max: 303.75 },
    { label: 'Barat Laut (BL)', min: 303.75, max: 326.25 },
    { label: 'Utara Barat Laut (UBL)', min: 326.25, max: 348.75 },
  ];

  for (const dir of directions) {
    if (dir.min > dir.max) {
      if (normalized >= dir.min || normalized < dir.max) return dir.label;
    } else {
      if (normalized >= dir.min && normalized < dir.max) return dir.label;
    }
  }

  return 'Barat Laut (BL)';
}

