import { useMapConnections } from '@/hooks/useConnections';
import { resolvePhotoUrl } from '@/lib/constants';
import { Loader2, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet + webpack/vite issue)
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapTab() {
  const { data: connections, isLoading } = useMapConnections();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Locate size={24} className="text-white/30" />
        </div>
        <p className="text-sm font-semibold text-white mb-1">Nenhuma conexao com localizacao</p>
        <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
          Para registrar a localizacao das suas conexoes, permita o acesso a geolocalizacao no navegador ao visitar um perfil.
          As proximas conexoes serao exibidas no mapa automaticamente.
        </p>
      </div>
    );
  }

  // Center map on first connection or default (Brazil)
  const center: [number, number] = connections.length > 0
    ? [connections[0].latitude, connections[0].longitude]
    : [-14.235, -51.925];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 400 }}>
      <MapContainer
        center={center}
        zoom={connections.length === 1 ? 12 : 4}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {connections.map((conn) => (
          <Marker key={conn.id} position={[conn.latitude, conn.longitude]}>
            <Popup>
              <div className="flex items-center gap-2 p-1">
                {conn.profile.photoUrl && (
                  <img
                    src={resolvePhotoUrl(conn.profile.photoUrl)!}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold">{conn.profile.displayName}</p>
                  {conn.locationLabel && (
                    <p className="text-[11px] text-gray-500">{conn.locationLabel}</p>
                  )}
                  {conn.connectedAt && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(conn.connectedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
