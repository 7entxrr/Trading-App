#!/usr/bin/env node
/**
 * READ-ONLY API discovery for the GoldMiner integration.
 *
 * Calls ONLY the 12 GET endpoints below and writes `api-shapes.json`: the
 * STRUCTURE of each response (field names + value types), with every actual
 * value removed. No balances, tickets, prices or tokens end up in the file, so
 * it is safe to share. It never calls POST/DELETE — there is no code for it.
 *
 * Usage (on a machine that can reach the API):
 *   1. Put GOLDMINER_API_TOKEN=... in .env.local (git-ignored)
 *   2. node scripts/discover-api.mjs
 *   3. Share the generated api-shapes.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const GET_ENDPOINTS = [
  "/health",
  "/api/status",
  "/api/account",
  "/api/positions",
  "/api/orders",
  "/api/trades",
  "/api/baskets",
  "/api/performance",
  "/api/alerts",
  "/api/snapshot",
  "/api/protection",
  "/api/commands",
];

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/** Replace every value with its type, keeping the structure. */
function shape(v, depth = 0) {
  if (depth > 8) return "…";
  if (v === null) return "null";
  if (Array.isArray(v)) {
    if (!v.length) return ["(empty array)"];
    // Merge the shapes of up to 20 items so optional fields show up.
    const merged = {};
    let scalar;
    for (const item of v.slice(0, 20)) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        for (const [k, val] of Object.entries(item)) {
          const s = JSON.stringify(shape(val, depth + 1));
          merged[k] = merged[k] ? [...new Set([...merged[k], s])] : [s];
        }
      } else scalar = shape(item, depth + 1);
    }
    if (scalar !== undefined) return [scalar];
    const out = {};
    for (const [k, variants] of Object.entries(merged)) {
      const parsed = variants.map((s) => JSON.parse(s));
      out[k] = parsed.length === 1 ? parsed[0] : { oneOf: parsed };
    }
    return [out];
  }
  if (typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, shape(val, depth + 1)]));
  }
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return "string (ISO datetime)";
    return "string";
  }
  return typeof v;
}

loadEnvLocal();
const base = (process.env.GOLDMINER_API_BASE_URL || "https://goldminer-api.srv1995263.hstgr.cloud").replace(/\/+$/, "");
const token = process.env.GOLDMINER_API_TOKEN;
if (!token) {
  console.error("GOLDMINER_API_TOKEN is not set (add it to .env.local).");
  process.exit(1);
}

const result = { base_url: base, generated_at: new Date().toISOString(), endpoints: {} };

for (const path of GET_ENDPOINTS) {
  const headers = { accept: "application/json" };
  if (path !== "/health") headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetch(base + path, { method: "GET", headers, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    result.endpoints[`GET ${path}`] = {
      status: res.status,
      content_type: res.headers.get("content-type"),
      shape: body === undefined ? "(non-JSON body)" : shape(body),
    };
    console.log(`GET ${path} -> ${res.status}`); // status only — never headers or body
  } catch (e) {
    result.endpoints[`GET ${path}`] = { error: e.name === "TimeoutError" ? "timeout" : "network error" };
    console.log(`GET ${path} -> failed (${e.name})`);
  }
}

// Also capture the OpenAPI schema if the backend publishes one (no auth sent).
try {
  const res = await fetch(`${base}/openapi.json`, { signal: AbortSignal.timeout(15000) });
  if (res.ok) {
    writeFileSync("api-openapi.json", await res.text());
    console.log("GET /openapi.json -> saved to api-openapi.json");
  } else console.log(`GET /openapi.json -> ${res.status}`);
} catch {
  console.log("GET /openapi.json -> failed");
}

writeFileSync("api-shapes.json", JSON.stringify(result, null, 2));
console.log("\nWrote api-shapes.json (structure only, no values).");
