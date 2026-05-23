import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));

const mainAppAuth =
  process.env.NEXT_PUBLIC_MAIN_APP_URL?.replace(/\/$/, "") || "https://solola-frontend.onrender.com/auth";

const nextConfig: NextConfig = {
  turbopack: {
    root: appDir,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: mainAppAuth,
        permanent: false
      }
    ];
  }
};

export default nextConfig;
