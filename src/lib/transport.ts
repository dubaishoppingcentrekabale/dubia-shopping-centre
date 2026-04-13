export const TRANSPORT_RATE_PER_KM = 800;
export const STORE_COORDINATES = {
  lat: -1.2491,
  lng: 29.9894,
} as const;

export type MapCoordinates = {
  lat: number;
  lng: number;
};

export type TransportEstimate = {
  distanceKm: number;
  distanceText: string;
  durationText: string;
  fare: number;
  source: "maps" | "fallback";
  note?: string;
};

type RoutePreset = {
  distanceKm: number;
  durationMinutes: number;
  label: string;
  patterns: string[];
};

const FALLBACK_ROUTE_PRESETS: RoutePreset[] = [
  { distanceKm: 5, durationMinutes: 15, label: "Kabale town", patterns: ["kabale"] },
  { distanceKm: 28, durationMinutes: 45, label: "Katuna route", patterns: ["katuna"] },
  { distanceKm: 54, durationMinutes: 85, label: "Rukungiri route", patterns: ["rukungiri"] },
  { distanceKm: 68, durationMinutes: 95, label: "Ntungamo route", patterns: ["ntungamo"] },
  { distanceKm: 76, durationMinutes: 110, label: "Kisoro route", patterns: ["kisoro"] },
  { distanceKm: 140, durationMinutes: 160, label: "Mbarara route", patterns: ["mbarara"] },
  { distanceKm: 305, durationMinutes: 320, label: "Masaka route", patterns: ["masaka"] },
  { distanceKm: 410, durationMinutes: 430, label: "Kampala route", patterns: ["kampala"] },
  { distanceKm: 106, durationMinutes: 145, label: "Kigali route", patterns: ["kigali", "rwanda"] },
];

const DEFAULT_FALLBACK_DISTANCE_KM = 25;
const DEFAULT_FALLBACK_SPEED_KPH = 35;
const EARTH_RADIUS_KM = 6371;

const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toRadians = (value: number) => (value * Math.PI) / 180;

const parseCoordinateLocation = (value: string): MapCoordinates | null => {
  const match = value.trim().match(
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  );

  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng };
};

const getDistanceBetweenCoordinatesKm = (start: MapCoordinates, end: MapCoordinates) => {
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

export const formatCoordinatePair = ({ lat, lng }: MapCoordinates) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const getFallbackTransportEstimate = (location: string): TransportEstimate | null => {
  const coordinateLocation = parseCoordinateLocation(location);

  if (coordinateLocation) {
    const distanceKm = Math.max(1, Math.round(getDistanceBetweenCoordinatesKm(coordinateLocation, STORE_COORDINATES)));
    const durationMinutes = Math.max(10, Math.round((distanceKm / DEFAULT_FALLBACK_SPEED_KPH) * 60));

    return {
      distanceKm,
      distanceText: `Approx. ${distanceKm} km`,
      durationText: `Approx. ${formatDuration(durationMinutes)}`,
      fare: distanceKm * TRANSPORT_RATE_PER_KM,
      source: "fallback",
      note: "Estimated from the selected map pin while live route lookup is unavailable. Final delivery cost can still be confirmed by the store.",
    };
  }

  const normalizedLocation = normalizeLocation(location);

  if (!normalizedLocation) {
    return null;
  }

  const preset = FALLBACK_ROUTE_PRESETS.find(({ patterns }) =>
    patterns.some((pattern) => normalizedLocation.includes(pattern)),
  );

  const distanceKm = preset?.distanceKm ?? DEFAULT_FALLBACK_DISTANCE_KM;
  const durationMinutes =
    preset?.durationMinutes ?? Math.max(35, Math.round((distanceKm / DEFAULT_FALLBACK_SPEED_KPH) * 60));
  const routeLabel = preset?.label ?? "our regional route guide";

  return {
    distanceKm,
    distanceText: `Approx. ${distanceKm} km`,
    durationText: `Approx. ${formatDuration(durationMinutes)}`,
    fare: distanceKm * TRANSPORT_RATE_PER_KM,
    source: "fallback",
    note: `Estimated from ${routeLabel} while live route lookup is unavailable. Final delivery cost can still be confirmed by the store.`,
  };
};
