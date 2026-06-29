import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const devRoot = path.resolve(toolRoot, "../..");
const hubUiSrc = path.resolve(toolRoot, "vendor/hub-ui/src");
const hubIdentitySrc = path.resolve(toolRoot, "vendor/hub-identity/src");

function loadSharedEnvFile(p: string) {
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    const value = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

export default defineConfig(({ mode }) => {
  const sharedPath = fs.existsSync(path.resolve(devRoot, ".env.shared"))
    ? path.resolve(devRoot, ".env.shared")
    : path.resolve(toolRoot, ".env.shared");
  const shared = loadSharedEnvFile(sharedPath);
  const env = { ...shared, ...loadEnv(mode, toolRoot, ""), ...loadEnv(mode, devRoot, "") };
  const supabaseUrl =
    process.env.DATABOX_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env.DATABOX_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    "";
  const supabaseAnon =
    process.env.DATABOX_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.DATABOX_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    "";

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnon),
    },
    server: {
      host: "127.0.0.1",
      port: 3005,
      strictPort: true,
      fs: { allow: [toolRoot, hubUiSrc, hubIdentitySrc, devRoot] },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react", "@supabase/supabase-js"],
      exclude: ["@tool-workspace/hub-ui", "@tool-workspace/hub-identity"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: [
        { find: /^@tool-workspace\/hub-ui\/(.+)$/, replacement: `${hubUiSrc}/$1` },
        { find: "@tool-workspace/hub-ui", replacement: path.join(hubUiSrc, "index.ts") },
        { find: /^@tool-workspace\/hub-identity\/(.+)$/, replacement: `${hubIdentitySrc}/$1` },
        { find: "@tool-workspace/hub-identity", replacement: path.join(hubIdentitySrc, "index.ts") },
        { find: "@dev/hub-identity", replacement: path.join(hubIdentitySrc, "index.ts") },
      ],
    },
    esbuild: { target: "es2022" },
  };
});
