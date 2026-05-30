/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.VERCEL_ENV === "production" ? "https://www.pizzagram.ru" : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "thb.tildacdn.com" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "pizzagram.ru" }],
        destination: "https://www.pizzagram.ru/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js hydration requires unsafe-inline; Yandex Maps loads scripts from yastatic.net
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api-maps.yandex.ru https://yandex.ru https://yastatic.net",
      "style-src 'self' 'unsafe-inline' https://yastatic.net",
      "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://static.tildacdn.com https://thb.tildacdn.com https://*.yandex.net https://*.yandex.ru https://yastatic.net",
      "connect-src 'self' https://api.groq.com https://nominatim.openstreetmap.org https://api-maps.yandex.ru https://*.yandex.net https://*.yandex.ru https://yastatic.net",
      "font-src 'self' data:",
      "frame-src https://yandex.ru",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
