import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb', '@aws-sdk/client-eventbridge'],
  outputFileTracingRoot: '.',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle AWS SDK for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
  },
  typescript: {
    // Ensure type checking during builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
