'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HotelData } from '@/types';

// ホテルマーカー（SVG inline — CDN不要）
const hotelIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`,
  className: '',
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

// 調査地点マーカー（星型・青）
const centerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
    <circle cx="16" cy="16" r="15" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
    <text x="16" y="21" text-anchor="middle" font-size="16" fill="#fff">★</text>
  </svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
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
        <Marker position={[centerLat, centerLng]} icon={centerIcon}>
          <Popup>
            <div className="text-sm font-bold text-blue-600">📍 調査地点</div>
          </Popup>
        </Marker>

        {/* 検索半径サークル */}
        <Circle
          center={[centerLat, centerLng]}
          radius={3000}
          fillOpacity={0.05}
          color="#3b82f6"
        />

        {/* ホテルマーカー */}
        {hotelsWithCoords.map((hotel, i) => (
          <Marker key={i} position={[hotel.lat!, hotel.lng!]} icon={hotelIcon}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-bold">{hotel.name}</div>
                <div className="text-red-600 font-semibold">¥{hotel.price_per_night.toLocaleString()}<span className="text-gray-500 font-normal">/泊</span></div>
                {hotel.rating && <div className="text-yellow-500">★ {hotel.rating} <span className="text-gray-500">({hotel.review_count?.toLocaleString()}件)</span></div>}
                {hotel.url && <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">詳細を見る →</a>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
