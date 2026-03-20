import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Home {
  lat: number;
  lng: number;
  address: string;
  customer: string;
  systemSize: string;
  installDate: string;
}

interface InstalledHomesMapProps {
  homes: Home[];
}

const InstalledHomesMap = ({ homes }: InstalledHomesMapProps) => {
  const [mapCity, setMapCity] = useState<'houston' | 'corpus'>('houston');

  const cityConfig = {
    houston: { center: [29.76, -95.37] as [number, number], zoom: 11, label: 'Houston' },
    corpus: { center: [27.77, -97.40] as [number, number], zoom: 12, label: 'Corpus Christi' },
  };

  const filteredHomes = homes.filter(h =>
    mapCity === 'houston' ? h.address.includes('Houston') : h.address.includes('Corpus')
  );

  const cfg = cityConfig[mapCity];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMapCity('houston')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${
            mapCity === 'houston' ? 'bg-primary text-primary-foreground' : 'bg-white/[0.06] text-white/50 border border-white/10'
          }`}
        >
          Houston ({homes.filter(h => h.address.includes('Houston')).length} homes)
        </button>
        <button
          onClick={() => setMapCity('corpus')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] ${
            mapCity === 'corpus' ? 'bg-primary text-primary-foreground' : 'bg-white/[0.06] text-white/50 border border-white/10'
          }`}
        >
          Corpus Christi ({homes.filter(h => h.address.includes('Corpus')).length} homes)
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 420 }}>
        <MapContainer
          key={mapCity}
          center={cfg.center}
          zoom={cfg.zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {filteredHomes.map((home, i) => (
            <CircleMarker
              key={i}
              center={[home.lat, home.lng]}
              radius={7}
              pathOptions={{
                fillColor: 'hsl(150, 65%, 50%)',
                fillOpacity: 0.85,
                color: 'hsl(150, 65%, 70%)',
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]">
                  <div className="font-bold text-sm">{home.customer}</div>
                  <div className="text-gray-600">{home.address}</div>
                  <div className="text-gray-500">⚡ {home.systemSize} · 📅 {home.installDate}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <div className="text-[10px] text-white/30 text-center">
        {filteredHomes.length} installed homes shown · Green dots = active solar installations
      </div>
    </div>
  );
};

export default InstalledHomesMap;
