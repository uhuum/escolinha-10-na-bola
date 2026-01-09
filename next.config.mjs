import withPWA from "next-pwa"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // 👇 força webpack e desativa turbopack
  turbopack: {},
  webpack: (config) => {
    return config
  },
}

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

export default pwaConfig(nextConfig)
