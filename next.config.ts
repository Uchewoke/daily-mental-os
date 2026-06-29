import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
import path from 'path';

const nextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },
};
