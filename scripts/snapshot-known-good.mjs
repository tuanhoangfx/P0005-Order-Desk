#!/usr/bin/env node
/**
 * Pin known-good deploy for P0005 (Vercel production crm.infi.io.vn).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(productRoot, "config", "known-good.json");
const manifestPath = path.join(productRoot, "tool.manifest.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const pkg = readJson(path.join(productRoot, "package.json"));
const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : {};
const version = pkg.version || manifest.release?.version || "0.0.0";

function runVercelInspectProd() {
  const r = spawnSync("vercel", ["inspect", "--prod"], {
    cwd: productRoot,
    encoding: "utf8",
    shell: true,
    timeout: 120_000,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const idMatch = out.match(/\bid\s+(dpl_[A-Za-z0-9]+)/);
  const urlMatch = out.match(/https:\/\/p0005-order-desk[^\s]+/);
  return {
    deploymentId: idMatch ? idMatch[1] : "",
    deploymentUrl: urlMatch ? urlMatch[0] : "",
  };
}

const { deploymentId, deploymentUrl } = runVercelInspectProd();
const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: productRoot, encoding: "utf8" });
const dirty = spawnSync("git", ["status", "--porcelain"], { cwd: productRoot, encoding: "utf8" });
const gitCommit = dirty.stdout?.trim() ? null : head.stdout?.trim() || null;

const snapshot = {
  schemaVersion: 1,
  label: `stable-${version}`,
  version,
  gitCommit,
  gitTag: `v${version}-stable`,
  productType: "Web",
  notes: "crm.infi.io.vn — rollback via scripts/restore-known-good.ps1 -Rollback",
  deploy: {
    provider: "vercel",
    project: manifest.vercel?.project || "p0005-order-desk",
    projectId: manifest.vercel?.projectId || null,
    productionUrl: manifest.vercel?.productionUrl || manifest.urls?.app || "https://crm.infi.io.vn",
    deploymentId: deploymentId || null,
    deploymentUrl: deploymentUrl || null,
    customDomains: manifest.vercel?.customDomains || ["crm.infi.io.vn"],
    dnsRecord: manifest.vercel?.dnsRequired || "A crm.infi.io.vn 76.76.21.21",
    deployHookName: manifest.vercel?.deployHookName || "ship-production",
    capturedAt: new Date().toISOString(),
  },
  envKeys: ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"],
  restore: {
    rollback: deploymentId ? `vercel rollback ${deploymentId}` : "vercel deploy --prod",
    dns: `node ../../scripts/sync-vercel-dns-cf.mjs --apply --product-root ${productRoot.replace(/\\/g, "/")}`,
    smoke: "node scripts/smoke-order-desk.mjs",
  },
  checklist: [
    "https://crm.infi.io.vn loads Customers/Orders",
    "Sign-in via workspace account",
    "gitCommit recorded when repo is clean",
  ],
};

fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log("OK  known-good →", configPath);
