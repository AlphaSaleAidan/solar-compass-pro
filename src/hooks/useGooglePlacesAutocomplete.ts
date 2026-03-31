import { useEffect, useRef, useCallback } from 'react';

interface AddressComponents {
  streetNumber: string;
  route: string;
  fullAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface UseGooglePlacesAutocompleteOptions {
  onSelect: (address: AddressComponents) => void;
}

export function useGooglePlacesAutocomplete({ onSelect }: UseGooglePlacesAutocompleteOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['address_components', 'geometry', 'name'],
      types: ['address'],
      componentRestrictions: { country: 'us' },
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const get = (type: string, short = false) => {
        const comp = place.address_components?.find(c => c.types.includes(type));
        return comp ? (short ? comp.short_name : comp.long_name) : '';
      };

      const streetNumber = get('street_number');
      const route = get('route');

      onSelect({
        streetNumber,
        route,
        fullAddress: `${streetNumber} ${route}`.trim(),
        city: get('locality') || get('sublocality_level_1'),
        state: get('administrative_area_level_1', true),
        zip: get('postal_code', true),
        country: get('country', true),
      });
    });

    autocompleteRef.current = autocomplete;
  }, [onSelect]);

  useEffect(() => {
    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          initAutocomplete();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [initAutocomplete]);

  return inputRef;
}
