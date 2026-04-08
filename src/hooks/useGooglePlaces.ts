import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
    __googleMapsAuthFailed?: boolean;
  }
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

const GOOGLE_SCRIPT_ID = 'google-maps-places-script';
const GOOGLE_KEY_REGEX = /^AIza[A-Za-z0-9_-]{20,}$/;

async function loadGoogleMaps(): Promise<void> {
  if (window.__googleMapsLoaded && window.google?.maps?.places) return;

  if (window.__googleMapsAuthFailed) {
    throw new Error('Google Maps authentication failed');
  }

  if (window.__googleMapsLoading) {
    return new Promise((resolve, reject) => {
      const check = window.setInterval(() => {
        if (window.__googleMapsLoaded && window.google?.maps?.places) {
          clearInterval(check);
          resolve();
          return;
        }

        if (!window.__googleMapsLoading) {
          clearInterval(check);
          reject(new Error('Google Maps failed to initialize'));
        }
      }, 100);
    });
  }

  window.__googleMapsLoading = true;

  try {
    // Option 1: Read from env var (preferred — no edge function needed)
    let apiKey = (import.meta.env.VITE_GOOGLE_MAPS_KEY || '').trim();

    // Fallback: try Supabase edge function (legacy path)
    if (!apiKey) {
      try {
        const { data, error } = await supabase.functions.invoke('google-maps-key');
        if (!error && typeof data?.key === 'string') apiKey = data.key.trim();
      } catch { /* edge function may not exist */ }
    }

    if (!apiKey) {
      throw new Error('Google Maps API key not configured. Set VITE_GOOGLE_MAPS_KEY in .env');
    }

    if (!GOOGLE_KEY_REGEX.test(apiKey)) {
      throw new Error('Invalid Google Maps API key format');
    }

    await new Promise<void>((resolve, reject) => {
      window.gm_authFailure = () => {
        window.__googleMapsAuthFailed = true;
        reject(new Error('Google Maps authentication failed'));
      };

      const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (existingScript) {
        if (window.google?.maps?.places) {
          resolve();
          return;
        }

        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });

    if (!window.google?.maps?.places) {
      throw new Error('Google Places library unavailable');
    }

    window.__googleMapsLoaded = true;
  } finally {
    window.__googleMapsLoading = false;
  }
}

function parseAddressComponents(components: any[]): Omit<ParsedAddress, 'fullAddress'> {
  let street_number = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';

  for (const c of components) {
    const types = c.types as string[];
    if (types.includes('street_number')) street_number = c.long_name;
    else if (types.includes('route')) route = c.long_name;
    else if (types.includes('locality') || types.includes('postal_town')) city = c.long_name;
    else if (types.includes('administrative_area_level_1')) state = c.short_name;
    else if (types.includes('postal_code')) zip = c.long_name;
  }

  return { street: `${street_number} ${route}`.trim(), city, state, zip };
}

export function useGooglePlaces(onSelect: (address: ParsedAddress) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadGoogleMaps();

        if (cancelled || !inputRef.current || autocompleteRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place?.address_components) return;

          const parsed = parseAddressComponents(place.address_components);
          onSelectRef.current({
            ...parsed,
            fullAddress: place.formatted_address || parsed.street,
          });
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Address autocomplete is unavailable';
        console.error('Google Places init error:', message);

        if (!cancelled) {
          setErrorMessage(message);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    };
  }, []);

  return {
    inputRef,
    error: !!errorMessage,
    errorMessage,
  };
}
