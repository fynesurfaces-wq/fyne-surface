/** @type {import('next').NextConfig} */

// Where the Express API runs. The admin proxies /api/v1/* to it so the browser
// sees ONE origin: no CORS, and the HttpOnly refresh cookie (path=/api/v1/auth,
// SameSite=Strict) is always sent on /api/v1/auth/refresh.
const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:5000';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' }, // keep the admin out of search engines
        ],
      },
    ];
  },
};

export default nextConfig;
