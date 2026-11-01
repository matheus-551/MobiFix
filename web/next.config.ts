import type { NextConfig } from "next";

/**
 * Endereço da API Spring Boot (somente servidor). O navegador chama `/api/v1/...` na própria origem
 * do Next.js e o rewrite abaixo repassa a requisição para a API, evitando CORS (a API não o configura).
 */
const apiUrl = (process.env.API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
