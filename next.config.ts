import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
// @ts-ignore
import withPWAInit from 'next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});
 
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone', // Docker 최적화
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://localhost:8080';
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/api-docs/:path*', destination: `${backend}/api-docs/:path*` },
    ];
  },
};

export default withNextIntl(withPWA(nextConfig));
