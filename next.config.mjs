import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // このフォルダをプロジェクトのルートとして固定（上位フォルダの package-lock.json を拾って警告・誤動作するのを防ぐ）
  turbopack: { root: here },
};

export default nextConfig;
