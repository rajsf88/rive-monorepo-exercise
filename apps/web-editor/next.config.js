/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export", // Static export for deployment
    trailingSlash: true,
    transpilePackages: [
        "@rive-monorepo/core",
        "@rive-monorepo/canvas-renderer",
        "@rive-monorepo/react",
    ],
};

module.exports = nextConfig;
