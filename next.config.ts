import type { NextConfig } from "next";

const DOMAIN_SCHEMA = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
const DEVELOPMENT = process.env.NODE_ENV !== "production";
const date = new Date();
const BUILD_ID = DEVELOPMENT
  ? "development"
  : `revamp-production_${Math.random()
      .toString(36)
      .substring(2, 13)}+${date.getFullYear()}${String(
      date.getMonth() + 1
    ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  assetPrefix: DOMAIN_SCHEMA,
  env: {
    BUILD_ID,
  },
  compiler: {
    removeConsole: DEVELOPMENT
      ? false
      : {
          exclude: ["info"],
        },
    reactRemoveProperties: true,
  },
  images: {
    dangerouslyAllowSVG: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer, strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },

  generateBuildId: async () => {
    if (DEVELOPMENT) return "development";

    console.log();
    console.log();
    console.log("🚀", "REVAMP.RD, Scribble the plans, spill the thoughts.");
    console.log(
      "➔",
      `Copyright (C) ${
        new Date().getFullYear() == 2025
          ? 2025
          : `2025 - ${new Date().getFullYear()}`
      } Jayant Hegde Kageri <https://github.com/jayantkageri/>`
    );
    console.log(
      "➔",
      "Licensed under the Terms and Conditions of GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)"
    );
    console.log();

    console.log("🔥", "Build ID:", BUILD_ID);
    console.log();
    console.log();

    return BUILD_ID;
  },
};

export default nextConfig;
