import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = githubPages
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      webpack: (config) => {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          path: false,
          fs: false,
          url: false,
          module: false,
          crypto: false,
        };
        return config;
      },
    }
  : {
      serverExternalPackages: ["pdfjs-dist", "pngjs"],
      experimental: {
        serverActions: {
          bodySizeLimit: "64mb",
        },
      },
      webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            path: false,
            fs: false,
            url: false,
            module: false,
          };
        }
        return config;
      },
    };

export default nextConfig;
