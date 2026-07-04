import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TEXT_EXT = new Set([".tsx", ".ts", ".jsx", ".js", ".css", ".json", ".html", ".md", ".txt", ".map"]);

function isText(path: string): boolean {
  const i = path.lastIndexOf(".");
  return i >= 0 && TEXT_EXT.has(path.slice(i).toLowerCase());
}

function walk(dir: string, root: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, root, out);
    else if (ent.isFile()) out.push(relative(root, abs).split("\\").join("/"));
  }
  return out;
}

/** List generated app files while a clone is still running (or after). */
export function listWipFiles(runDir: string): string[] {
  const root = join(runDir, "generated", "app");
  return walk(root, root).sort();
}

export function readWipFile(runDir: string, relPath: string): { bytes: Buffer; text?: string; kind: "text" | "binary" } | null {
  const root = join(runDir, "generated", "app");
  const norm = relPath.replace(/^\/+/, "").split("\\").join("/");
  if (norm.includes("..")) return null;
  const abs = join(root, norm);
  if (!abs.startsWith(root) || !existsSync(abs) || !statSync(abs).isFile()) return null;
  const bytes = readFileSync(abs);
  if (isText(norm)) return { bytes, text: bytes.toString("utf8"), kind: "text" };
  return { bytes, kind: "binary" };
}
