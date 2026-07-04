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
