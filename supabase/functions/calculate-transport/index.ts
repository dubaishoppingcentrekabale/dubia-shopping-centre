const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KABALE_DESTINATION = "PXRR+Q9P, Kabale, Uganda";
const RATE_PER_KM = 800;
const STORE_COORDINATES = { lat: -1.2491, lng: 29.9894 };
const DEFAULT_FALLBACK_DISTANCE_KM = 25;
const DEFAULT_FALLBACK_SPEED_KPH = 35;
const EARTH_RADIUS_KM = 6371;
const FALLBACK_ROUTE_PRESETS = [
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

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toRadians = (value: number) => (value * Math.PI) / 180;

const parseCoordinateLocation = (value: string) => {
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

const getDistanceBetweenCoordinatesKm = (start: typeof STORE_COORDINATES, end: typeof STORE_COORDINATES) => {
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

const getFallbackTransportEstimate = (origin: string) => {
  const coordinateLocation = parseCoordinateLocation(origin);

  if (coordinateLocation) {
    const distanceKm = Math.max(1, Math.round(getDistanceBetweenCoordinatesKm(coordinateLocation, STORE_COORDINATES)));
    const durationMinutes = Math.max(10, Math.round((distanceKm / DEFAULT_FALLBACK_SPEED_KPH) * 60));

    return {
      distance_km: distanceKm,
      distance_text: `Approx. ${distanceKm} km`,
      duration_text: `Approx. ${formatDuration(durationMinutes)}`,
      fare: distanceKm * RATE_PER_KM,
      rate_per_km: RATE_PER_KM,
      source: "fallback",
      note: "Estimated from the selected map pin while live route lookup is unavailable. Final delivery cost can still be confirmed by the store.",
    };
  }

  const normalizedOrigin = normalizeLocation(origin);

  if (!normalizedOrigin) {
    return null;
  }

  const preset = FALLBACK_ROUTE_PRESETS.find(({ patterns }) =>
    patterns.some((pattern) => normalizedOrigin.includes(pattern)),
  );

  const distanceKm = preset?.distanceKm ?? DEFAULT_FALLBACK_DISTANCE_KM;
  const durationMinutes =
    preset?.durationMinutes ?? Math.max(35, Math.round((distanceKm / DEFAULT_FALLBACK_SPEED_KPH) * 60));
  const routeLabel = preset?.label ?? "our regional route guide";

  return {
    distance_km: distanceKm,
    distance_text: `Approx. ${distanceKm} km`,
    duration_text: `Approx. ${formatDuration(durationMinutes)}`,
    fare: distanceKm * RATE_PER_KM,
    rate_per_km: RATE_PER_KM,
    source: "fallback",
    note: `Estimated from ${routeLabel} while live route lookup is unavailable. Final delivery cost can still be confirmed by the store.`,
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let origin = "";

  try {
    const body = await req.json();
    origin = typeof body?.origin === "string" ? body.origin : "";

    if (!origin) {
      return jsonResponse({ error: "origin is required (address or lat,lng)" }, 400);
    }

    const fallbackEstimate = getFallbackTransportEstimate(origin);
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return fallbackEstimate ? jsonResponse(fallbackEstimate) : jsonResponse({ error: "Google Maps API key not configured" }, 500);
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", KABALE_DESTINATION);
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK") {
      return fallbackEstimate ? jsonResponse(fallbackEstimate) : jsonResponse({ error: "Distance Matrix API error", detail: data.status }, 502);
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return fallbackEstimate
        ? jsonResponse(fallbackEstimate)
        : jsonResponse({ error: "Could not calculate distance", detail: element?.status }, 422);
    }

    const distanceMeters = element.distance.value;
    const distanceKm = Math.round(distanceMeters / 1000);
    const fare = distanceKm * RATE_PER_KM;

    return jsonResponse({
      distance_km: distanceKm,
      distance_text: element.distance.text,
      duration_text: element.duration.text,
      fare,
      rate_per_km: RATE_PER_KM,
      source: "maps",
    });
  } catch (err) {
    const fallbackEstimate = getFallbackTransportEstimate(origin);
    if (fallbackEstimate) {
      return jsonResponse(fallbackEstimate);
    }

    return jsonResponse({ error: err instanceof Error ? err.message : "Unexpected transport error" }, 500);
  }
});
