/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/builder/:build*",
        destination: "/builder?:build*"
      }
    ]
  }
}


module.exports = nextConfig
