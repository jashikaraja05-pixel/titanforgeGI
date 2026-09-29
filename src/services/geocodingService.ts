/**
 * Real Geocoding & Landmark Search Service
 * Connects to OpenStreetMap Nominatim / Geocoding APIs to fetch real coordinates
 */

export interface GeocodedPlace {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  state: string;
  country: string;
}

export async function searchAddressOrLandmark(
  query: string,
  contextCountry: string = 'India'
): Promise<GeocodedPlace | null> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;

  try {
    const fullQuery = `${clean}, ${contextCountry}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      fullQuery
    )}&limit=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en,ta,hi',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);

      return {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        displayName: first.display_name,
        city: first.display_name.split(',')[0] || clean,
        state: contextCountry,
        country: contextCountry,
      };
    }

    // Try without context country if empty
    const directRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1`
    );
    const directData = await directRes.json();
    if (Array.isArray(directData) && directData.length > 0) {
      const first = directData[0];
      return {
        lat: Number(parseFloat(first.lat).toFixed(5)),
        lng: Number(parseFloat(first.lon).toFixed(5)),
        displayName: first.display_name,
        city: clean,
        state: '',
        country: contextCountry,
      };
    }

    return null;
  } catch (err) {
    console.warn('Geocoding fetch error:', err);
    return null;
  }
}
