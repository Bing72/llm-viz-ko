/** @type {import('next').NextConfig} */

let withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/llm-viz-ko' : '';

const nextConfig = {
    output: 'export',
    basePath,
    assetPrefix: basePath,
    trailingSlash: true,
    reactStrictMode: false,
    productionBrowserSourceMaps: true,
    images: { unoptimized: true },
    experimental: {
        appDir: true,
    },
    env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
    },
};

module.exports = withBundleAnalyzer(nextConfig);
