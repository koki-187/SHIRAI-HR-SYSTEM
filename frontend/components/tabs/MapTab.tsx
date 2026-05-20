'use client';
import dynamic from 'next/dynamic';
import { HotelData } from '@/types';

const MapComponent = dynamic(() => import('./MapInner'), { ssr: false });

interface Props {
  hotels: HotelData[];
  centerLat: number;
  centerLng: number;
}

export default function MapTab({ hotels, centerLat, centerLng }: Props) {
  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-gray-400">
        <p className="text-2xl mb-2">🗺️</p>
        <p className="text-sm">地図に表示するホテルがありません</p>
      </div>
    );
  }

  const validHotels = hotels.filter(h =>
    h.lat != null && h.lng != null &&
    isFinite(h.lat) && isFinite(h.lng)
  );

  return <MapComponent hotels={validHotels} centerLat={centerLat} centerLng={centerLng} />;
}
