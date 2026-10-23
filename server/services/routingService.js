const RESQ_BASE = { lat: 19.072, lng: 72.868 };

export async function createRoute(incident) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${RESQ_BASE.lat},${RESQ_BASE.lng}&destination=${incident.location.lat},${incident.location.lng}&travelmode=driving`;
  if (!process.env.MAPS_API_KEY) {
    return { provider: "local-demo", mapsUrl, distanceMeters: null, duration: null, polyline: null };
  }

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline"
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: RESQ_BASE.lat, longitude: RESQ_BASE.lng } } },
      destination: { location: { latLng: { latitude: incident.location.lat, longitude: incident.location.lng } } },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      languageCode: "en"
    }),
    signal: AbortSignal.timeout(8_000)
  });
  if (!response.ok) throw new Error(`Maps provider returned HTTP ${response.status}`);
  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("Maps provider returned no route");
  return {
    provider: "google-routes",
    mapsUrl,
    distanceMeters: route.distanceMeters,
    duration: route.duration,
    polyline: route.polyline?.encodedPolyline ?? null
  };
}
