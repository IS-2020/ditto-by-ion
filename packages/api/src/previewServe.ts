/** Rewrite preview HTML so assets resolve under a per-clone mount (not site-root /static/). */
export function rewritePreviewHtml(html: string, mountBase: string): string {
  const base = mountBase.endsWith("/") ? mountBase : mountBase + "/";
  const baseTag = `<base href="${base}">`;
  let out = html.replace(/<base\s[^>]*>/gi, baseTag);
  if (!/<base\s/i.test(out)) {
    if (/<head[^>]*>/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    else out = `<!DOCTYPE html><html><head>${baseTag}</head><body>${out}</body></html>`;
  }
  // Mirror HTML uses origin-absolute /static/assets/… — relative to the clone mount instead.
  out = out.replace(/=(["'])\/static\/assets\//gi, "=$1./assets/");
  out = out.replace(/=(["'])\/(assets|_next|static)\//gi, "=$1./$2/");
  out = out.replace(/url\((["']?)\/(assets|_next|static)\//gi, "url($1./$2/");
  out = out.replace(/url\((["']?)\/static\/assets\//gi, "url($1./assets/");
  return out;
}

export function isHtmlLike(path: string): boolean {
  return path.endsWith(".html") || !path.split("/").pop()?.includes(".");
}

/** HTML error page for preview iframes — never return JSON (Chrome shows "Pretty-print"). */
export function previewErrorHtml(title: string, detail: string): string {
  const t = title.replace(/[<>&]/g, "");
  const d = detail.replace(/[<>&]/g, "");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title></head><body style="margin:0;font:14px/1.55 Inter,system-ui,sans-serif;background:#121417;color:#f4f4f5;padding:28px"><p style="margin:0 0 6px;font-weight:600;color:#e6b84a">${t}</p><p style="margin:0;color:#8b9099;max-width:42em">${d}</p></body></html>`;
}
