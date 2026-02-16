/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/favicon.svg', permanent: false }];
  },
};

module.exports = nextConfig;
