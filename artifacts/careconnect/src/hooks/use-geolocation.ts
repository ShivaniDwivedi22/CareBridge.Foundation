import { useState, useCallback } from "react";

interface GeolocationState {
  location: string;
  latitude: number | null;
  longitude: number | null;
  isDetecting: boolean;
  error: string | null;
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "CareBridge/1.0" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  const addr = data.address;
  const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
  const state = addr.state || addr.region || "";
  const country = addr.country_code?.toUpperCase() || "";
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (state) return state;
  return data.display_name?.split(",").slice(0, 2).join(",") || "Unknown location";
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: "",
    latitude: null,
    longitude: null,
    isDetecting: false,
    error: null,
  });

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation is not supported by your browser." }));
      return;
    }

    setState((s) => ({ ...s, isDetecting: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const location = await reverseGeocode(latitude, longitude);
          setState({ location, latitude, longitude, isDetecting: false, error: null });
        } catch {
          setState({ location: "", latitude, longitude, isDetecting: false, error: "Could not determine your city. Please enter manually." });
        }
      },
      (err) => {
        let error = "Could not detect location.";
        if (err.code === err.PERMISSION_DENIED) error = "Location access denied. Please enter manually.";
        else if (err.code === err.POSITION_UNAVAILABLE) error = "Location unavailable. Please enter manually.";
        setState((s) => ({ ...s, isDetecting: false, error }));
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { ...state, detectLocation };
}
