/** @type {import('next').NextConfig} */
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
  experimental: {
    allowedDevOrigins: ["https://6000-firebase-studio-1747168607847.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev"],
  }
};

module.exports = nextConfig;
