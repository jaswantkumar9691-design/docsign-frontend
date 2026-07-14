/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfjs-dist (used by react-pdf) probes for an optional 'canvas' /
  // 'encoding' node module that doesn't exist in the browser bundle.
  // Aliasing them off is the officially recommended fix to avoid
  // webpack build warnings/errors when using react-pdf with Next.js.
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
