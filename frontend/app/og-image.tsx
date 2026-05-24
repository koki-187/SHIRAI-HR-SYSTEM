import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0ea5e9 100%)',
          padding: 60,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 48, color: 'white', fontWeight: 'bold' }}>H</span>
            </div>
            <span style={{ fontSize: 56, color: 'white', fontWeight: 'bold' }}>HotelScope</span>
          </div>
          <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)' }}>
            ホテル土地仕入れ判断のための周辺料金市場調査システム
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
