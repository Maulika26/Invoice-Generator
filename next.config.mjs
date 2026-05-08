/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack config for @react-pdf/renderer compatibility
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  turbopack: {},
};

export default nextConfig;
