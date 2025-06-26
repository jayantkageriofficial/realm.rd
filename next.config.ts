/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import type { NextConfig } from "next";

const DEVELOPMENT = process.env.NODE_ENV !== "production";

const DOMAIN_SCHEMA = DEVELOPMENT
  ? process.env.NEXT_PUBLIC_DEV_SERVER || "http://localhost:3000"
  : process.env.NEXT_PUBLIC_DOMAIN;
const date = new Date();
const BUILD_ID = DEVELOPMENT
  ? "development"
  : `realm-production_${Math.random()
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
          exclude: ["info", "warn"],
        },
    reactRemoveProperties: true,
  },
  images: {
    dangerouslyAllowSVG: true,
  },
  experimental: {
    nodeMiddleware: true,
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
    console.log("🚀", "REALM.RD, Scribble the plans, spill the thoughts.");
    console.log(
      "➔",
      `Copyright (C) ${
        new Date().getFullYear() === 2025
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

    return BUILD_ID;
  },
};

export default nextConfig;
