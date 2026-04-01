import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
    __googleMapsCallbacks?: (() => void)[];
  }
}

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

function loadGoogleMaps(): Promise<void> {
  if (window.__googleMapsLoaded && window.google?.maps?.places) return Promise.resolve();

  if (window.__googleMapsLoading) {
    return new Promise((resolve) => {
      window.__googleMapsCallbacks = window.__googleMapsCallbacks || [];
      window.__googleMapsCallbacks.push(resolve);
    });
  }

  window.__googleMapsLoading = true;
  window.__googleMapsCallbacks = [];

  return new Promise(async (resolve, reject) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-key');
      if (error || !data?.key) {
        window.__googleMapsLoading = false;
        reject(new Error('Failed to fetch Google Maps API key'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
      script.async = true;
      script.onload = () => {
        window.__googleMapsLoaded = true;
        window.__googleMapsLoading = false;
        resolve();
        window.__googleMapsCallbacks?.forEach((cb) => cb());
        window.__googleMapsCallbacks = [];
      };
      script.onerror = () => {
        window.__googleMapsLoading = false;
        reject(new Error('Failed to load Google Maps script'));
      };
      document.head.appendChild(script);
    } catch (e) {
      window.__googleMapsLoading = false;
      reject(e);
    }
  });
}

function parseAddressComponents(components: any[]): Omit<ParsedAddress, 'fullAddress'> {
  let street_number = '', route = '', city = '', state = '', zip = '';
  for (const c of components) {
    const types = c.types as string[];
    if (types.includes('street_number')) street_number = c.long_name;
    else if (types.includes('route')) route = c.long_name;
    else if (types.includes('locality')) city = c.long_name;
    else if (types.includes('administrative_area_level_1')) state = c.short_name;
    else if (types.includes('postal_code')) zip = c.long_name;
  }
  return { street: `${street_number} ${route}`.trim(), city, state, zip };
}

export function useGooglePlaces(onSelect: (address: ParsedAddress) => void) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !inputRef.current || autocompleteRef.current) return;

        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address'],
          types: ['address'],
        });

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place?.address_components) return;
          const parsed = parseAddressComponents(place.address_components);
          onSelectRef.current({ ...parsed, fullAddress: place.formatted_address || '' });
        });

        autocompleteRef.current = ac;
      } catch (e) {
        console.error('Google Places init error:', e);
        if (!cancelled) setError(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []);

  return { inputRef, error };
}
