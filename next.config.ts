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
};

// Forçando a atualização do cache.
module.exports = nextConfig;
