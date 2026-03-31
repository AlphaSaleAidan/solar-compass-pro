import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAL7uHlch7NEnPHSXVclLa-ay45ZbLHZaI';

interface Prediction {
  place_id: string;
  description: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
}

// Load Google Maps script once
let scriptLoaded = false;
let scriptPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (scriptLoaded && (window as any).google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) {
      scriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const AddressAutocomplete = ({ value, onChange, placeholder = 'Enter Site Address here...', className }: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ready, setReady] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dummyDiv = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadGoogleMaps().then(() => {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      // PlacesService needs a DOM element
      if (!dummyDiv.current) {
        dummyDiv.current = document.createElement('div');
      }
      placesService.current = new (window as any).google.maps.places.PlacesService(dummyDiv.current);
      setReady(true);
    }).catch(console.error);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!ready || !autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'us' },
        types: ['address'],
      },
      (results: Prediction[] | null, status: string) => {
        if (status === 'OK' && results) {
          setPredictions(results.slice(0, 5));
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, [ready]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchPredictions(val);
  };

  const handleSelect = (prediction: Prediction) => {
    if (!placesService.current) {
      onChange(prediction.description);
      setShowDropdown(false);
      setPredictions([]);
      return;
    }

    placesService.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address', 'address_components'] },
      (place: any, status: string) => {
        if (status === 'OK' && place) {
          // Build full address with street, city, state, zip
          const components = place.address_components || [];
          const get = (type: string) => components.find((c: any) => c.types.includes(type))?.short_name || '';
          const getLong = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || '';

          const street = `${getLong('street_number')} ${getLong('route')}`.trim();
          const city = getLong('locality') || getLong('sublocality_level_1') || getLong('administrative_area_level_2');
          const state = get('administrative_area_level_1');
          const zip = get('postal_code');

          const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');
          onChange(fullAddress || place.formatted_address || prediction.description);
        } else {
          onChange(prediction.description);
        }
        setShowDropdown(false);
        setPredictions([]);
      }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => { if (predictions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        className={className}
      />

      {showDropdown && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[hsl(220,20%,12%)] border border-white/15 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-white/80 truncate">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
