'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HotelData } from '@/types';

// Leafletデフォルトアイコン修正
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const starIcon = L.divIcon({
  html: '<div style="font-size:24px;line-height:1">★</div>',
  iconSize: [24, 24],
  className: '',
});

function SetView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

interface Props {
  hotels: HotelData[];
  centerLat: number;
  centerLng: number;
}

export default function MapInner({ hotels, centerLat, centerLng }: Props) {
  const hotelsWithCoords = hotels.filter(h => h.lat && h.lng);

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm"
      style={{ height: '500px' }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
        <SetView lat={centerLat} lng={centerLng} />

        {/* 中心点マーカー */}
        <Marker position={[centerLat, centerLng]} icon={starIcon}>
          <Popup>調査地点</Popup>
        </Marker>

        {/* 検索半径サークル */}
        <Circle
          center={[centerLat, centerLng]}
          radius={3000}
          fillOpacity={0.05}
          color="blue"
        />

        {/* ホテルマーカー */}
        {hotelsWithCoords.map((hotel, i) => (
          <Marker key={i} position={[hotel.lat!, hotel.lng!]}>
            <Popup>
              <div className="text-sm">
                <strong>{hotel.name}</strong>
                <br />
                ¥{hotel.price_per_night.toLocaleString()}/泊
                <br />
                {hotel.rating && `★ ${hotel.rating}`}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
