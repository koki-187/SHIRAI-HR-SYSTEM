'use client';
import dynamic from 'next/dynamic';
import { HotelData } from '@/types';

const MapComponent = dynamic(() => import('./MapInner'), { ssr: false });

interface Props {
  hotels: HotelData[];
  centerLat: number;
  centerLng: number;
}

export default function MapTab(props: Props) {
  return <MapComponent {...props} />;
}
