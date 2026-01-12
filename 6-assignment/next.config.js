/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow loading local card assets from the public folder
    remotePatterns: [],
  },
  // Enable TypeScript path alias defined in tsconfig
  webpack: (config) => {
    config.resolve.alias['@'] = require('path').resolve(__dirname, 'src')
    return config
  },
}

module.exports = nextConfig