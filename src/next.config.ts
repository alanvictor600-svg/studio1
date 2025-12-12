/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,

  // Otimização de compilação
  swcMinify: true,

  // Mantém o build seguro
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Otimização de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    formats: ['image/avif', 'image/webp'], // formatos mais leves
  },

  // Otimiza pages/app route
  experimental: {
    serverActions: true, // aumenta desempenho em funções server-side
  },

  // Webpack otimizado
  webpack: (config, { isServer }) => {
    // Melhora performance em builds grandes
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        minSize: 20000,
      },
    };

    // Reduz tamanho do bundle no client
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },
};

module.exports = withPWA(nextConfig);
