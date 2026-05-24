const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: ['chart.js', 'react-chartjs-2', 'leaflet'],
  },
  async headers() {
    return [
      {
        // 全ページ・APIにセキュリティヘッダーを付与
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-Content-Type-Options',      value: 'nosniff' },
          { key: 'X-XSS-Protection',            value: '1; mode=block' },
          { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",                  // Next.js + Leaflet用
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",            // 地図タイル・ホテル画像
              "font-src 'self' data:",
              "connect-src 'self' https://nominatim.openstreetmap.org https://app.rakuten.co.jp https://booking-com15.p.rapidapi.com https://www.reinfolib.mlit.go.jp https://api.e-stat.go.jp https://vitals.vercel-insights.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // APIレスポンスにキャッシュ禁止ヘッダー（センシティブデータ保護）
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
