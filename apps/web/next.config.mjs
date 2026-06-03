const workspaceRoot = new URL("../..", import.meta.url).pathname;

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot
  },
  transpilePackages: ["@bbs/ui", "@bbs/shared"]
};

export default nextConfig;
