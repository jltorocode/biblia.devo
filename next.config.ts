import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida standalone: incluye un mini runtime y solo las deps necesarias,
  // ideal para imagen Docker pequena. El runner copia .next/standalone.
  output: "standalone",
};

export default nextConfig;
