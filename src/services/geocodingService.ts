/**
 * Real Geocoding & Landmark Search Service
 * Connects to OpenStreetMap Nominatim with global coverage and addressdetails
 * Includes fallback registry for major global and Indian metropolitan hubs
 */

export interface GeocodedPlace {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  state: string;
  country: string;
}

const GLOBAL_KNOWN_COORDINATES: Record<string, { lat: number; lng: number; city: string; state: string; country: string }> = {
  rathinam: { lat: 10.9372, lng: 76.9602, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'ரத்தினம்': { lat: 10.9372, lng: 76.9602, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'ரத்தினம் காலேஜ்': { lat: 10.9372, lng: 76.9602, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'rathinam college': { lat: 10.9372, lng: 76.9602, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  eachanari: { lat: 10.9360, lng: 76.9680, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'ஈச்சனாரி': { lat: 10.9360, lng: 76.9680, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  coimbatore: { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'கோயம்புத்தூர்': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'கோவை': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  gandhipuram: { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'காந்திபுரம்': { lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  chennai: { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  'சென்னை': { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  'anna nagar': { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  'அண்ணா நகர்': { lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  madurai: { lat: 9.9252, lng: 78.1198, city: 'Madurai', state: 'Tamil Nadu', country: 'India' },
  'மதுரை': { lat: 9.9252, lng: 78.1198, city: 'Madurai', state: 'Tamil Nadu', country: 'India' },
  trichy: { lat: 10.7905, lng: 78.7047, city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India' },
  'திருச்சி': { lat: 10.7905, lng: 78.7047, city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India' },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047, city: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India' },
  salem: { lat: 11.6643, lng: 78.1460, city: 'Salem', state: 'Tamil Nadu', country: 'India' },
  'சேலம்': { lat: 11.6643, lng: 78.1460, city: 'Salem', state: 'Tamil Nadu', country: 'India' },
  tirunelveli: { lat: 8.7139, lng: 77.7567, city: 'Tirunelveli', state: 'Tamil Nadu', country: 'India' },
  'திருநெல்வேலி': { lat: 8.7139, lng: 77.7567, city: 'Tirunelveli', state: 'Tamil Nadu', country: 'India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  bangalore: { lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  mumbai: { lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  delhi: { lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi', country: 'India' },
  kolkata: { lat: 22.5726, lng: 88.3639, city: 'Kolkata', state: 'West Bengal', country: 'India' },
  hyderabad: { lat: 17.3850, lng: 78.4867, city: 'Hyderabad', state: 'Telangana', country: 'India' },
  london: { lat: 51.5074, lng: -0.1278, city: 'London', state: 'England', country: 'United Kingdom' },
  'new york': { lat: 40.7128, lng: -74.0060, city: 'New York', state: 'New York', country: 'United States' },
  paris: { lat: 48.8566, lng: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
  tokyo: { lat: 35.6762, lng: 139.6503, city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
  dubai: { lat: 25.2048, lng: 55.2708, city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates' },
  singapore: { lat: 1.3521, lng: 103.8198, city: 'Singapore', state: 'Central Community Development Council', country: 'Singapore' },
  sydney: { lat: -33.8688, lng: 151.2093, city: 'Sydney', state: 'New South Wales', country: 'Australia' },
  nairobi: { lat: -1.2921, lng: 36.8219, city: 'Nairobi', state: 'Nairobi County', country: 'Kenya' },
  cairo: { lat: 30.0444, lng: 31.2357, city: 'Cairo', state: 'Cairo Governorate', country: 'Egypt' },
};

export async function searchAddressOrLandmark(
  query: string,
  contextCountry?: string
): Promise<GeocodedPlace | null> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;

  const lower = clean.toLowerCase();

  // 1. Fast match from local high-frequency global coordinate dictionary
  for (const [key, value] of Object.entries(GLOBAL_KNOWN_COORDINATES)) {
    if (lower === key || lower.startsWith(key + ',') || lower.endsWith(', ' + key)) {
      return {
        lat: value.lat,
        lng: value.lng,
        displayName: `${value.city}, ${value.state}, ${value.country}`,
        city: value.city,
        state: value.state,
        country: value.country,
      };
    }
  }

  // 2. Fetch from OpenStreetMap Nominatim with worldwide scope
  try {
    const searchParam = encodeURIComponent(clean);
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${searchParam}&limit=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,ta,hi,es,fr,ar',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const addr = first.address || {};
        const detectedCity =
          addr.city || addr.town || addr.village || addr.suburb || addr.municipality || first.name || clean;
        const detectedState = addr.state || addr.province || addr.region || '';
        const detectedCountry = addr.country || contextCountry || 'Global';

        return {
          lat: Number(parseFloat(first.lat).toFixed(5)),
          lng: Number(parseFloat(first.lon).toFixed(5)),
          displayName: first.display_name,
          city: detectedCity,
          state: detectedState,
          country: detectedCountry,
        };
      }
    }
  } catch (err) {
    console.warn('Global geocoding service notice:', err);
  }

  // 3. Fallback: try appending context country if provided
  if (contextCountry && !clean.toLowerCase().includes(contextCountry.toLowerCase())) {
    try {
      const scopedQuery = encodeURIComponent(`${clean}, ${contextCountry}`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${scopedQuery}&limit=1`,
        { headers: { 'Accept-Language': 'en,ta,hi' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          const addr = first.address || {};
          return {
            lat: Number(parseFloat(first.lat).toFixed(5)),
            lng: Number(parseFloat(first.lon).toFixed(5)),
            displayName: first.display_name,
            city: addr.city || addr.town || clean,
            state: addr.state || '',
            country: addr.country || contextCountry,
          };
        }
      }
    } catch {}
  }

  return null;
}
