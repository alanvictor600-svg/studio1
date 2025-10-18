/** @type {import('next').NextConfig} */

// Load environment variables from .env file
require('dotenv').config({ path: './.env' });

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Forçando a atualização do cache para resolver ChunkLoadError.
  // Esta opção vazia não afeta a aplicação.
  experimental: {},
};

module.exports = nextConfig;
