
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // add your own strategies
});


const nextConfig: NextConfig = {
  /* config options here */
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
        port: '',
        pathname: '/**',
      },
      // Removed placehold.co as it's no longer used
    ],
  },
  experimental: {
    allowedDevOrigins: ["https://6000-firebase-studio-1747168607847.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev"],
  }
};

export default withPWA(nextConfig);
