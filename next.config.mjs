import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
