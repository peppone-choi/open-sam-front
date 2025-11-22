import type { NextConfig } from 'next';
 
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

export default nextConfig;
