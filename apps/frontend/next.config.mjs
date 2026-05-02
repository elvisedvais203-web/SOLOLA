import withPWA from "next-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function upstreamForRewrites() {
  const raw =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    "https://solola-api.onrender.com";
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  turbopack: {},
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" }
    ]
  },
  /**
   * Proxy vers le backend Express : après les routes locales (`app/api/upload`, etc.).
   * évite un 404 Next sur `/api/auth/...` si la réécriture passait avant les handlers.
   */
  async rewrites() {
    const base = upstreamForRewrites();
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${base}/api/:path*`
        }
      ]
    };
  }
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
})(nextConfig);
