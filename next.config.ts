/** @type {import('next').NextConfig} */

// Load environment variables from .env file
require('dotenv').config({ path: './.env' });

const nextConfig = {
  // Forçar recarregamento para carregar .env
  typescript: {
    // AVISO: Ignorar erros de build pode levar a problemas em produção.
    // Use isso com cautela e verifique os logs de build.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Não recomendado, mas pode ser necessário para builds rápidos.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

module.exports = nextConfig;
