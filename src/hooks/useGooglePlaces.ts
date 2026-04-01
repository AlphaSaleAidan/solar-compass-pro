import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
    __googleMapsLoading?: boolean;
    __googleMapsLoaded?: boolean;
  }
}

interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  fullAddress: string;
}

async function loadGoogleMaps(): Promise<void> {
  if (window.__googleMapsLoaded) return;
  if (window.__googleMapsLoading) {
    // Wait for existing load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.__googleMapsLoaded) { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  window.__googleMapsLoading = true;

  const { data, error } = await supabase.functions.invoke('google-maps-key');
  if (error || !data?.key) throw new Error('Failed to fetch Google Maps API key');

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
    script.async = true;
    script.onload = () => { window.__googleMapsLoaded = true; window.__googleMapsLoading = false; resolve(); };
    script.onerror = () => { window.__googleMapsLoading = false; reject(new Error('Failed to load Google Maps')); };
    document.head.appendChild(script);
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

export function useGooglePlaces(
  inputRef: React.RefObject<HTMLInputElement>,
  onSelect: (address: ParsedAddress) => void,
) {
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(console.error);

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

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
  }, [ready, inputRef]);

  return { ready };
}
