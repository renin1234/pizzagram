/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "static.tildacdn.com" },
      { protocol: "https", hostname: "thb.tildacdn.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Запрет встраивания сайта в iframe на сторонних ресурсах (кликджекинг)
          { key: "X-Frame-Options", value: "DENY" },
          // Браузер не будет угадывать MIME-тип — только тот, что сервер объявил
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Устаревший, но безвредный фильтр XSS в старых браузерах
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Не слать Referer при переходе на другие домены
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Отключаем неиспользуемые браузерные API (camera, mike)
          { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          // HSTS: принудительный HTTPS на 2 года (активировать после деплоя на HTTPS)
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
