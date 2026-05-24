import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// セキュリティレスポンスヘッダー
function addSecurityHeaders(response: NextResponse): NextResponse {
  // クリックジャッキング防止
  response.headers.set('X-Frame-Options', 'DENY');
  // MIMEスニッフィング防止
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // XSS フィルター（旧ブラウザ向け）
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // リファラー情報を制限
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS（HTTPS強制）
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // カメラ・マイク等のブラウザ機能を制限
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  return response;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdmin = (token as any)?.isAdmin;
    const path = req.nextUrl.pathname;

    // /admin 以下は管理者のみ
    if (path.startsWith('/admin') && !isAdmin) {
      const res = NextResponse.redirect(new URL('/dashboard', req.url));
      return addSecurityHeaders(res);
    }

    const res = NextResponse.next();
    return addSecurityHeaders(res);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // ページ
    '/dashboard/:path*',
    '/admin/:path*',
    // 全API（認証必須・セキュリティヘッダー付与）
    '/api/admin/:path*',
    '/api/user/:path*',
    '/api/survey/:path*',
    '/api/analyze/:path*',
    '/api/adr-report/:path*',
    '/api/hotel-ranking/:path*',
    '/api/land-price/:path*',
    '/api/occ/:path*',
    '/api/factors/:path*',
    '/api/history/:path*',
    '/api/snapshots/:path*',
    '/api/brand-benchmark/:path*',
    '/api/price-calendar/:path*',
    '/api/collect/:path*',
    '/api/rakuten/:path*',
    '/api/geocode/:path*',
    '/api/seed-all/:path*',
  ],
};
