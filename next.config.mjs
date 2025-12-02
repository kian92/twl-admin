/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "twl-media.b-cdn.net",
        pathname: "/development/**",  
      },
      {
        protocol: "https",
        hostname: "twl-media.b-cdn.net",
        pathname: "/production/**",  
      },
    ],
  },
  
}

export default nextConfig
