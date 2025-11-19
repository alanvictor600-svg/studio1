/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 10, // Tenta a rede por 10s, depois vai para o cache
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'NetworkFirst', // Prioriza a rede para garantir que o código mais recente seja buscado
      options: {
        cacheName: 'static-resources',
        networkTimeoutSeconds: 10, // Tenta a rede por 10s, depois vai para o cache
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
  ],
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
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
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true, layers: true };
    return config;
  },
};

module.exports = withPWA(nextConfig);
