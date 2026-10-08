/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Legal removed the group-coverage funnel ("we don't sell group"). Old ad
  // and search links to it land on the homepage instead of a 404.
  async redirects() {
    return [
      { source: "/business", destination: "/", permanent: true },
      { source: "/business/:path*", destination: "/", permanent: true },
    ]
  },
}

export default nextConfig
