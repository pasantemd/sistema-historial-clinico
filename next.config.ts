import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
